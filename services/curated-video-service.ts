import { getTimestampValue, selectHomepageVideoHighlights } from "@/lib/curated-video-utils";
import { CuratedVideoItem, FootballTeam } from "@/types";

type CuratedVideosResponse = {
  items: CuratedVideoItem[];
  source: "firestore" | "empty" | "error";
  message?: string;
};

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
  const payload = await requestCuratedVideos("/api/curated-videos");
  return payload.items;
}

export async function getCuratedVideosByTeam(team: FootballTeam) {
  const videos = await getCuratedVideos();
  return videos.filter((video) => video.teamTag === team);
}

export async function getCuratedVideoById(id: string): Promise<CuratedVideoItem | null> {
  try {
    const payload = await requestCuratedVideos(`/api/curated-videos/${id}`);
    return payload.items[0] ?? null;
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

      if (video.teamTag && item.teamTag === video.teamTag) {
        score += 4;
      }

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
