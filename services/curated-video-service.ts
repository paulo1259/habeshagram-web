import { getTimestampValue, selectHomepageVideoHighlights } from "@/lib/curated-video-utils";
import { CuratedVideoItem } from "@/types";

type CuratedVideosResponse = {
  items: CuratedVideoItem[];
  source: "firestore" | "empty" | "error";
  message?: string;
};

const CURATED_VIDEO_CACHE_MS = 60_000;

let videosCache: CuratedVideoItem[] | null = null;
let videosCacheAt = 0;
let videosRequest: Promise<CuratedVideoItem[]> | null = null;
const videoByIdCache = new Map<string, CuratedVideoItem | null>();

async function requestCuratedVideos(path: string) {
  const response = await fetch(path, {
    cache: "no-store"
  });

  const payload = (await response.json().catch(() => ({}))) as CuratedVideosResponse;

  if (!response.ok) {
    throw new Error(payload.message || "Failed to load curated videos.");
  }

  return payload;
}

export async function getCuratedVideos(): Promise<CuratedVideoItem[]> {
  if (videosCache && Date.now() - videosCacheAt < CURATED_VIDEO_CACHE_MS) {
    return videosCache;
  }

  if (videosRequest) {
    return videosRequest;
  }

  videosRequest = requestCuratedVideos("/api/curated-videos")
    .then((payload) => {
      videosCache = payload.items;
      videosCacheAt = Date.now();
      payload.items.forEach((item) => videoByIdCache.set(item.id, item));
      return payload.items;
    })
    .finally(() => {
      videosRequest = null;
    });

  return videosRequest;
}


export async function getCuratedVideoById(id: string): Promise<CuratedVideoItem | null> {
  if (videoByIdCache.has(id)) {
    return videoByIdCache.get(id) ?? null;
  }

  if (videosCache && Date.now() - videosCacheAt < CURATED_VIDEO_CACHE_MS) {
    return videosCache.find((item) => item.id === id) ?? null;
  }

  try {
    const payload = await requestCuratedVideos(`/api/curated-videos/${id}`);
    const item = payload.items[0] ?? null;
    videoByIdCache.set(id, item);
    return item;
  } catch {
    return null;
  }
}

export async function getRelatedCuratedVideos(video: CuratedVideoItem, limit = 4) {
  const videos = await getCuratedVideos();

  return videos
    .filter((item) => item.id !== video.id)
    .map((item) => {
      let score = 0;

      if (item.category === video.category) {
        score += 3;
      }

      const hashtagOverlap = (item.hashtags ?? []).filter((tag) => (video.hashtags ?? []).includes(tag)).length;
      score += hashtagOverlap;

      if (item.featured) {
        score += 0.5;
      }

      return { item, score };
    })
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return getTimestampValue(b.item.createdAt) - getTimestampValue(a.item.createdAt);
    })
    .slice(0, limit)
    .map(({ item }) => item);
}

export { selectHomepageVideoHighlights };
