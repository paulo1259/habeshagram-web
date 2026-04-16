import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { firebaseDb, isFirebaseConfigured } from "@/lib/firebase";
import { CuratedVideoItem, FootballTeam } from "@/types";

const FIRESTORE_TIMEOUT_MS = 4000;
const CURATED_VIDEOS_COLLECTION = "curatedVideos";

async function withFirestoreTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), FIRESTORE_TIMEOUT_MS);
      })
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

function sortByCreatedAtDesc(items: CuratedVideoItem[]) {
  return [...items].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

function mapCuratedVideo(data: Partial<CuratedVideoItem>, id: string): CuratedVideoItem | null {
  if (!data.title || !data.category || !data.source || !data.summary || !data.embedUrl) {
    return null;
  }

  return {
    id: data.id || id,
    title: data.title,
    category: data.category,
    source: data.source,
    summary: data.summary,
    thumbnailURL: data.thumbnailURL || "",
    videoUrl: data.videoUrl || data.embedUrl,
    embedUrl: data.embedUrl,
    duration: data.duration || "",
    teamTag: data.teamTag,
    hashtags: Array.isArray(data.hashtags) ? data.hashtags : [],
    createdAt: data.createdAt || new Date().toISOString(),
    publishLabel: data.publishLabel,
    featured: Boolean(data.featured)
  };
}

export async function getCuratedVideos(): Promise<CuratedVideoItem[]> {
  if (!isFirebaseConfigured || !firebaseDb) {
    return [];
  }

  try {
    const snapshot = await withFirestoreTimeout(
      getDocs(collection(firebaseDb, CURATED_VIDEOS_COLLECTION)),
      "Timed out while loading curated videos."
    );

    const items = snapshot.docs
      .map((item) => mapCuratedVideo(item.data() as Partial<CuratedVideoItem>, item.id))
      .filter((item): item is CuratedVideoItem => Boolean(item));

    return sortByCreatedAtDesc(items);
  } catch {
    return [];
  }
}

export async function getCuratedVideosByTeam(team: FootballTeam) {
  const videos = await getCuratedVideos();
  return videos.filter((video) => video.teamTag === team);
}

export async function getCuratedVideoById(id: string): Promise<CuratedVideoItem | null> {
  if (!isFirebaseConfigured || !firebaseDb) {
    return null;
  }

  try {
    const snapshot = await withFirestoreTimeout(
      getDoc(doc(firebaseDb, CURATED_VIDEOS_COLLECTION, id)),
      "Timed out while loading this curated video."
    );

    if (snapshot.exists()) {
      return mapCuratedVideo(snapshot.data() as Partial<CuratedVideoItem>, snapshot.id);
    }
  } catch {
    return null;
  }

  return null;
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

      return +new Date(b.item.createdAt) - +new Date(a.item.createdAt);
    })
    .slice(0, limit)
    .map(({ item }) => item);
}

// TODO: Replace Firestore Console-only curation with an internal admin dashboard
// that writes the same CuratedVideoItem shape into curatedVideos/{videoId}.
