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
  lang?: "en" | "am";
  /** Short hash of the brief's text; changes whenever the brief is rewritten. */
  version?: string;
  /** Present when a spoken version can be generated. */
  audioUrl?: string;
};

const DIGEST_CLIENT_CACHE_MS = 5 * 60 * 1000;

type Lang = "en" | "am";
const cache: Partial<Record<Lang, { payload: WorldNewsDigestPayload; at: number }>> = {};
const inflightByLang: Partial<Record<Lang, Promise<WorldNewsDigestPayload>>> = {};

export async function getWorldNewsDigest(lang: Lang = "en"): Promise<WorldNewsDigestPayload> {
  const cached = cache[lang];
  if (cached && Date.now() - cached.at < DIGEST_CLIENT_CACHE_MS) {
    return cached.payload;
  }

  const pending = inflightByLang[lang];
  if (pending) {
    return pending;
  }

  const request = fetch(`/api/world-news/digest?lang=${lang}`, { method: "GET", cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Digest request failed with ${response.status}.`);
      }

      const payload = (await response.json()) as WorldNewsDigestPayload;
      cache[lang] = { payload, at: Date.now() };
      return payload;
    })
    .catch((error) => {
      const fallback = cache[lang]?.payload;
      if (fallback) {
        return fallback;
      }

      throw error;
    })
    .finally(() => {
      delete inflightByLang[lang];
    });

  inflightByLang[lang] = request;
  return request;
}
