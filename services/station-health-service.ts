import { radioStations } from "@/services/discovery-data";

export type StationHealth = "online" | "offline";

export type StationHealthReport = {
  checkedAt: string;
  stations: Record<string, StationHealth>;
};

/**
 * How we decide a station is on air: open its stream the way a listener's
 * browser would and see whether audio actually arrives.
 *
 * A healthy Zeno mount redirects to a relay, answers 200 with audio/mpeg and
 * immediately sends a buffer burst (~240 KB in the first few seconds). A mount
 * whose source has dropped either refuses, answers with something that is not
 * audio, or trickles nothing. 16 KB is about one second of 128 kbps audio, so
 * anything below that within the window is not a stream anyone could listen to.
 */
const MIN_BYTES = 16 * 1024;
const WINDOW_MS = 4500;

async function probeOnce(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WINDOW_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      cache: "no-store",
      headers: { "User-Agent": "ZemaStationHealth/1.0 (+https://habeshagram.today)" }
    });

    const type = response.headers.get("content-type") ?? "";
    if (!response.ok || !response.body || !/audio|mpeg|aac|ogg/i.test(type)) {
      return false;
    }

    const reader = response.body.getReader();
    let received = 0;

    try {
      while (received < MIN_BYTES) {
        const { value, done } = await reader.read();
        if (done) break;
        received += value?.byteLength ?? 0;
      }
    } finally {
      // Never keep a live stream open longer than needed.
      reader.cancel().catch(() => undefined);
    }

    return received >= MIN_BYTES;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
    controller.abort();
  }
}

/** One retry, so a single slow handshake does not mark a station off air. */
async function probe(url: string): Promise<StationHealth> {
  if (await probeOnce(url)) return "online";
  return (await probeOnce(url)) ? "online" : "offline";
}

export async function checkStationHealth(): Promise<StationHealthReport> {
  const entries = await Promise.all(
    radioStations.map(async (station) => {
      const health: StationHealth = station.streamUrl ? await probe(station.streamUrl) : "offline";
      return [station.id, health] as const;
    })
  );

  return { checkedAt: new Date().toISOString(), stations: Object.fromEntries(entries) };
}
