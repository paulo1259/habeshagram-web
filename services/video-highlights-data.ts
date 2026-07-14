import { CuratedVideoItem } from "@/types";

export const curatedVideoHighlights: CuratedVideoItem[] = [
  {
    id: "video_habesha-street-style",
    title: "Habesha street style clip with music, confidence, and color",
    category: "Culture",
    source: "YouTube",
    summary:
      "A warm visual clip that feels perfectly on-brand for the HabeshaGram discovery mood.",
    thumbnailURL: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
    videoUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    embedUrl: "https://www.youtube.com/embed/aqz-KE-bpKQ",
    duration: "1:49",
    hashtags: ["habesha", "fashion", "addis"],
    createdAt: "2026-04-12T16:05:00.000Z",
    publishLabel: "Weekend pick"
  },
  {
    id: "video_music-lounge-vibes",
    title: "Late-night Habesha music lounge clip to reset the timeline",
    category: "Music",
    source: "YouTube",
    summary:
      "Curated music energy that keeps discovery warm, social, and unmistakably Habesha.",
    thumbnailURL: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=80",
    videoUrl: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
    embedUrl: "https://www.youtube.com/embed/ysz5S6PUM-U",
    duration: "5:11",
    hashtags: ["music", "habesha", "nightvibes"],
    createdAt: "2026-04-11T23:00:00.000Z",
    publishLabel: "Featured clip"
  }
];

// Fallback sample set for curatedVideos/{videoId} when Firestore is unavailable or empty.
// TODO: once an admin dashboard exists, keep the same CuratedVideoItem shape so the UI layer can stay unchanged.
export function getCuratedVideoHighlights() {
  return [...curatedVideoHighlights].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}


export function getCuratedVideoHighlightById(id: string) {
  return curatedVideoHighlights.find((item) => item.id === id) ?? null;
}

export function getRelatedCuratedVideoHighlights(video: CuratedVideoItem, limit = 4) {
  return getCuratedVideoHighlights()
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

      return new Date(b.item.createdAt).getTime() - new Date(a.item.createdAt).getTime();
    })
    .slice(0, limit)
    .map(({ item }) => item);
}
