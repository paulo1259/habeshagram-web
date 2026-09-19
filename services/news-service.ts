import { BreakingItem } from "@/types";

const BREAKING_CACHE_MS = 45_000;

const breakingItemsCache = new Map<string, { items: BreakingItem[]; fetchedAt: number }>();
const breakingItemsRequests = new Map<string, Promise<BreakingItem[]>>();

export async function getBreakingItems(): Promise<BreakingItem[]> {
  const cacheKey = "all";
  const cached = breakingItemsCache.get(cacheKey);

  if (cached && Date.now() - cached.fetchedAt < BREAKING_CACHE_MS) {
    return cached.items;
  }

  if (breakingItemsRequests.has(cacheKey)) {
    return breakingItemsRequests.get(cacheKey)!;
  }

  const request = (async () => {
    try {
      const response = await fetch("/api/news/breaking", {
        method: "GET",
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(`Breaking feed request failed with ${response.status}.`);
      }

      const payload = (await response.json()) as { items?: BreakingItem[] };
      const items = payload.items ?? [];
      breakingItemsCache.set(cacheKey, { items, fetchedAt: Date.now() });
      return items;
    } catch {
      return cached?.items ?? [];
    } finally {
      breakingItemsRequests.delete(cacheKey);
    }
  })();

  breakingItemsRequests.set(cacheKey, request);

  return request;
}
