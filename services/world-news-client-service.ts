import type { WorldNewsFeedPayload } from "@/services/world-news-service";

const WORLD_NEWS_CACHE_MS = 30_000;

let cachedPayload: WorldNewsFeedPayload | null = null;
let cachedAt = 0;
let inflightRequest: Promise<WorldNewsFeedPayload> | null = null;

export async function getWorldNewsFeed() {
  if (cachedPayload && Date.now() - cachedAt < WORLD_NEWS_CACHE_MS) {
    return cachedPayload;
  }

  if (inflightRequest) {
    return inflightRequest;
  }

  inflightRequest = fetch("/api/world-news", {
    method: "GET",
    cache: "no-store"
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`World news request failed with ${response.status}.`);
      }

      const payload = (await response.json()) as WorldNewsFeedPayload;
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
      inflightRequest = null;
    });

  return inflightRequest;
}
