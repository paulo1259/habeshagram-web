export type WorldNewsDigestPayload = {
  aiConfigured: boolean;
  provider?: string;
  headline?: string;
  paragraphs?: string[];
  storySummaries?: Record<string, string>;
  storyCount?: number;
  generatedAt?: string;
  stale?: boolean;
  message?: string;
};

const DIGEST_CLIENT_CACHE_MS = 5 * 60 * 1000;

let cachedPayload: WorldNewsDigestPayload | null = null;
let cachedAt = 0;
let inflight: Promise<WorldNewsDigestPayload> | null = null;

export async function getWorldNewsDigest(): Promise<WorldNewsDigestPayload> {
  if (cachedPayload && Date.now() - cachedAt < DIGEST_CLIENT_CACHE_MS) {
    return cachedPayload;
  }

  if (inflight) {
    return inflight;
  }

  inflight = fetch("/api/world-news/digest", { method: "GET", cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Digest request failed with ${response.status}.`);
      }

      const payload = (await response.json()) as WorldNewsDigestPayload;
      cachedPayload = payload;
      cachedAt = Date.now();
      return payload;
    })
    .catch((error) => {
      if (cachedPayload) {
        return cachedPayload;
      }

      throw error;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}
