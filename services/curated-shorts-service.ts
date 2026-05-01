import { getTimestampValue } from "@/lib/curated-video-utils";
import { CuratedShortItem, FootballTeam } from "@/types";

type CuratedShortsResponse = {
  items: CuratedShortItem[];
  source: "firestore" | "empty" | "error";
  message?: string;
};

const CURATED_SHORTS_CACHE_MS = 45_000;

let shortsCache: CuratedShortItem[] | null = null;
let shortsCacheAt = 0;
let shortsRequest: Promise<CuratedShortItem[]> | null = null;
const shortByIdCache = new Map<string, CuratedShortItem | null>();

async function requestCuratedShorts(path: string) {
  const response = await fetch(path, {
    cache: "no-store"
  });

  const payload = (await response.json().catch(() => ({}))) as CuratedShortsResponse;

  if (!response.ok) {
    throw new Error(payload.message || "Failed to load curated shorts.");
  }

  return payload;
}

export async function getCuratedShorts(): Promise<CuratedShortItem[]> {
  if (shortsCache && Date.now() - shortsCacheAt < CURATED_SHORTS_CACHE_MS) {
    return shortsCache;
  }

  if (shortsRequest) {
    return shortsRequest;
  }

  shortsRequest = requestCuratedShorts("/api/curated-shorts")
    .then((payload) => {
      shortsCache = payload.items;
      shortsCacheAt = Date.now();
      payload.items.forEach((item) => shortByIdCache.set(item.id, item));
      return payload.items;
    })
    .finally(() => {
      shortsRequest = null;
    });

  return shortsRequest;
}

export async function getCuratedShortsByTeam(team: FootballTeam) {
  const items = await getCuratedShorts();
  return items.filter((item) => item.teamTag === team);
}

export async function getCuratedShortById(id: string): Promise<CuratedShortItem | null> {
  if (shortByIdCache.has(id)) {
    return shortByIdCache.get(id) ?? null;
  }

  if (shortsCache && Date.now() - shortsCacheAt < CURATED_SHORTS_CACHE_MS) {
    return shortsCache.find((item) => item.id === id) ?? null;
  }

  try {
    const payload = await requestCuratedShorts(`/api/curated-shorts/${id}`);
    const item = payload.items[0] ?? null;
    shortByIdCache.set(id, item);
    return item;
  } catch {
    return null;
  }
}

export function sortShortsForFeed(items: CuratedShortItem[]) {
  return [...items].sort((a, b) => {
    if (Boolean(a.featured) !== Boolean(b.featured)) {
      return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
    }

    return getTimestampValue(b.createdAt) - getTimestampValue(a.createdAt);
  });
}
