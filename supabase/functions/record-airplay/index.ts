/**
 * record-airplay — writes the "Aired today" log.
 *
 * Called every two minutes by pg_cron (see migration 0007). For each station
 * it opens Zeno's metadata stream, takes the first title it announces, closes
 * the connection, and hands the cleaned title to public.record_airplay(),
 * which either extends the current row or starts a new one.
 *
 * Protected by a shared secret rather than a JWT, because the caller is the
 * database itself. The secret lives only in Supabase Vault
 * ('airplay_cron_secret'); the cron job sends it as `x-cron-secret` and this
 * function asks the database whether it matches. Nothing to configure by
 * hand, and calling it twice does no harm either way.
 *
 * KEEP IN SYNC: the station list mirrors services/discovery-data.ts and
 * cleanStreamTitle mirrors services/now-playing-service.ts.
 */
import { createClient } from "jsr:@supabase/supabase-js@2";

const STATIONS: Array<{ id: string; mount: string }> = [
  { id: "sheger-1021", mount: "kr5k02vagt5tv" },
  { id: "ethio-fm-1078", mount: "72y045deqeruv" },
  { id: "fm-addis-971", mount: "rb6wbrap7yzuv" },
  { id: "wengel-fm", mount: "wsat39ewmd0uv" },
  { id: "orthodox-radio", mount: "pfaho9uockwuv" },
  { id: "voice-of-grace-radio", mount: "bbnz36ojnrktv" }
];

const METADATA_BASE = "https://api.zeno.fm/mounts/metadata/subscribe";
const READ_TIMEOUT_MS = 8_000;

function cleanStreamTitle(raw: string): string {
  if (!raw) return "";
  let title = raw.trim();
  title = title.replace(/\.(mp3|m4a|aac|ogg|wav|flac|opus)$/i, "");
  title = title.replace(/\((?:\d{2,4})\s*k(?:bps)?\)/gi, " ");
  title = title.replace(/[_]+/g, " ");
  title = title.replace(/#/g, " ");
  title = title.replace(/\s*-\s*$/g, "");
  title = title.replace(/\s{2,}/g, " ").trim();
  if (!title || /^(unknown|unknow|n\/a|null|undefined|-+)$/i.test(title)) return "";
  if (/^[a-z0-9]{10,}$/i.test(title) && !/\s/.test(title)) return "";
  return title.length > 120 ? `${title.slice(0, 117).trimEnd()}...` : title;
}

/** Read the SSE stream until the first event that carries a title. */
async function currentTitle(mount: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), READ_TIMEOUT_MS);

  try {
    const response = await fetch(`${METADATA_BASE}/${mount}`, {
      headers: { accept: "text/event-stream" },
      signal: controller.signal
    });
    if (!response.ok || !response.body) return null;

    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) return null;
      buffer += value;

      let newline: number;
      while ((newline = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newline).trim();
        buffer = buffer.slice(newline + 1);
        if (!line.startsWith("data:")) continue;
        try {
          const payload = JSON.parse(line.slice(5).trim()) as { streamTitle?: string };
          if (typeof payload.streamTitle === "string") {
            controller.abort();
            return payload.streamTitle;
          }
        } catch {
          // Not JSON — keep reading.
        }
      }
    }
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

Deno.serve(async (request) => {
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false }
  });

  const offered = request.headers.get("x-cron-secret") ?? "";
  const { data: allowed } = offered
    ? await supabase.rpc("airplay_secret_matches", { p_secret: offered })
    : { data: false };
  if (allowed !== true) {
    return new Response("Forbidden", { status: 403 });
  }

  const results = await Promise.all(
    STATIONS.map(async (station) => {
      const title = cleanStreamTitle((await currentTitle(station.mount)) ?? "");
      if (!title) return { station: station.id, title: null };

      const { error } = await supabase.rpc("record_airplay", {
        p_station_id: station.id,
        p_title: title
      });
      return { station: station.id, title, error: error?.message };
    })
  );

  return Response.json({ recordedAt: new Date().toISOString(), results });
});
