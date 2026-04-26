import { getEditorialLocalHighlights } from "@/services/editorial-content-service";
import { getDailyDebatePromptById, getDailyDebatePrompts } from "@/services/daily-debate-service";
import { BreakingItem, DailyDebatePrompt, FootballNewsItem, FootballTeam, LocalNewsItem } from "@/types";

const BREAKING_CACHE_MS = 45_000;
const DEBATE_CACHE_MS = 60_000;

const breakingItemsCache = new Map<string, { items: BreakingItem[]; fetchedAt: number }>();
const breakingItemsRequests = new Map<string, Promise<BreakingItem[]>>();
const dailyDebatesCache = new Map<string, { items: DailyDebatePrompt[]; fetchedAt: number }>();
const dailyDebatesRequests = new Map<string, Promise<DailyDebatePrompt[]>>();

export async function getLocalNewsItems(): Promise<LocalNewsItem[]> {
  return getEditorialLocalHighlights();
}

export async function getFootballBuzzItems(): Promise<FootballNewsItem[]> {
  return [];
}

export async function getFootballBuzzByTeam(team: FootballTeam): Promise<FootballNewsItem[]> {
  const items = await getFootballBuzzItems();
  return items.filter((item) => item.team === team);
}

export async function getBreakingItems(team?: FootballTeam): Promise<BreakingItem[]> {
  const cacheKey = team ?? "all";
  const cached = breakingItemsCache.get(cacheKey);

  if (cached && Date.now() - cached.fetchedAt < BREAKING_CACHE_MS) {
    return cached.items;
  }

  if (breakingItemsRequests.has(cacheKey)) {
    return breakingItemsRequests.get(cacheKey)!;
  }

  const request = (async () => {
    try {
      const query = team ? `?team=${encodeURIComponent(team)}` : "";
      const response = await fetch(`/api/news/breaking${query}`, {
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

export async function getDailyDebates(team?: FootballTeam): Promise<DailyDebatePrompt[]> {
  const cacheKey = team ?? "all";
  const cached = dailyDebatesCache.get(cacheKey);

  if (cached && Date.now() - cached.fetchedAt < DEBATE_CACHE_MS) {
    return cached.items;
  }

  if (dailyDebatesRequests.has(cacheKey)) {
    return dailyDebatesRequests.get(cacheKey)!;
  }

  const request = getDailyDebatePrompts(team)
    .then((items) => {
      dailyDebatesCache.set(cacheKey, { items, fetchedAt: Date.now() });
      return items;
    })
    .finally(() => {
      dailyDebatesRequests.delete(cacheKey);
    });

  dailyDebatesRequests.set(cacheKey, request);
  return request;
}

export async function getDailyDebateById(id: string): Promise<DailyDebatePrompt | null> {
  return getDailyDebatePromptById(id);
}
