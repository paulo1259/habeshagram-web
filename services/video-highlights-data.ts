import { CuratedVideoItem, FootballTeam } from "@/types";

export const curatedVideoHighlights: CuratedVideoItem[] = [
  {
    id: "video_mu_last-minute-chaos",
    title: "United chaos in stoppage time gets the whole timeline screaming",
    category: "Football Moments",
    source: "YouTube",
    summary:
      "A high-drama late goal clip that feels perfect for the Habesha matchday mood when group chats go wild.",
    thumbnailURL: "https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=900&q=80",
    videoUrl: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
    embedUrl: "https://www.youtube.com/embed/ysz5S6PUM-U",
    duration: "2:18",
    teamTag: "Manchester United",
    hashtags: ["ggmu", "matchday", "premierleague"],
    createdAt: "2026-04-14T09:30:00.000Z",
    publishLabel: "2h ago",
    featured: true
  },
  {
    id: "video_arsenal-fan-cam",
    title: "Arsenal fan cam energy after a statement win",
    category: "Fan Reactions",
    source: "YouTube",
    summary:
      "Pure post-match emotion, the kind of reaction clip that makes the fan zone feel alive even after full time.",
    thumbnailURL: "https://images.unsplash.com/photo-1518604666860-9ed391f76460?auto=format&fit=crop&w=900&q=80",
    videoUrl: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
    embedUrl: "https://www.youtube.com/embed/jNQXAC9IVRw",
    duration: "3:42",
    teamTag: "Arsenal",
    hashtags: ["coyg", "fanreactions", "london"],
    createdAt: "2026-04-14T07:00:00.000Z",
    publishLabel: "Today",
    featured: true
  },
  {
    id: "video_chelsea-tactical-breakdown",
    title: "Chelsea moments that sparked the loudest debate this week",
    category: "Football Moments",
    source: "YouTube",
    summary:
      "A tight highlight reel built around the biggest moments fans are already arguing about across the app.",
    thumbnailURL: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=900&q=80",
    videoUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    embedUrl: "https://www.youtube.com/embed/aqz-KE-bpKQ",
    duration: "4:06",
    teamTag: "Chelsea",
    hashtags: ["cfc", "bigdebate", "premierleague"],
    createdAt: "2026-04-13T20:15:00.000Z",
    publishLabel: "Last night"
  },
  {
    id: "video_city-clinical-finish",
    title: "City finishing clinic with all the little details fans love",
    category: "Football Moments",
    source: "YouTube",
    summary:
      "A polished clip for City supporters who want to replay the quality and for rivals who want to study it.",
    thumbnailURL: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=900&q=80",
    videoUrl: "https://www.youtube.com/watch?v=ScMzIvxBSi4",
    embedUrl: "https://www.youtube.com/embed/ScMzIvxBSi4",
    duration: "2:54",
    teamTag: "Manchester City",
    hashtags: ["mcfc", "footballmoments", "titlecharge"],
    createdAt: "2026-04-13T18:30:00.000Z",
    publishLabel: "Yesterday"
  },
  {
    id: "video_habesha-street-style",
    title: "Habesha street style clip with music, confidence, and color",
    category: "Culture",
    source: "YouTube",
    summary:
      "A warm visual break from football that still feels perfectly on-brand for the HabeshaGram discovery mood.",
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
      "Curated music energy that keeps discovery broader than football without losing the app's warm, social feel.",
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

export function getCuratedVideoHighlightsByTeam(team: FootballTeam) {
  return getCuratedVideoHighlights().filter((item) => item.teamTag === team);
}

export function getCuratedVideoHighlightById(id: string) {
  return curatedVideoHighlights.find((item) => item.id === id) ?? null;
}

export function getRelatedCuratedVideoHighlights(video: CuratedVideoItem, limit = 4) {
  return getCuratedVideoHighlights()
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

      return new Date(b.item.createdAt).getTime() - new Date(a.item.createdAt).getTime();
    })
    .slice(0, limit)
    .map(({ item }) => item);
}
