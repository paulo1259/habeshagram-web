import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { firebaseDb, isFirebaseConfigured } from "@/lib/firebase";
import { dailyDebatePrompts, localNewsItems } from "@/services/discovery-data";
import { curatedVideoHighlights } from "@/services/video-highlights-data";
import { CuratedVideoItem, DailyDebatePrompt, FootballTeam, LocalNewsItem } from "@/types";

const FIRESTORE_TIMEOUT_MS = 4000;

const COLLECTIONS = {
  videos: "editorialVideos",
  debates: "dailyDebates",
  localHighlights: "localCultureHighlights"
} as const;

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

function sortByCreatedAtDesc<T extends { createdAt?: string }>(items: T[]) {
  return [...items].sort(
    (a, b) => +new Date(b.createdAt ?? 0) - +new Date(a.createdAt ?? 0)
  );
}

function mapVideo(data: Partial<CuratedVideoItem>, id: string): CuratedVideoItem | null {
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
    hashtags: data.hashtags ?? [],
    createdAt: data.createdAt || new Date().toISOString(),
    publishLabel: data.publishLabel,
    featured: Boolean(data.featured)
  };
}

function mapDebate(data: Partial<DailyDebatePrompt>, id: string): DailyDebatePrompt | null {
  if (!data.prompt || !data.category || !data.suggestedText) {
    return null;
  }

  return {
    id: data.id || id,
    prompt: data.prompt,
    category: data.category,
    teamTag: data.teamTag,
    hashtag: typeof data.hashtag === "string" ? data.hashtag : undefined,
    suggestedText: data.suggestedText,
    featured: Boolean(data.featured),
    active: data.active !== false,
    publishLabel: data.publishLabel,
    createdAt: data.createdAt || new Date().toISOString()
  };
}

function mapLocalItem(data: Partial<LocalNewsItem>, id: string): LocalNewsItem | null {
  if (!data.headline || !data.source || !data.summary || !data.category) {
    return null;
  }

  return {
    id: data.id || id,
    headline: data.headline,
    source: data.source,
    summary: data.summary,
    category: data.category,
    imageURL: data.imageURL || "",
    link: data.link || ""
  };
}

export async function getEditorialVideos(): Promise<CuratedVideoItem[]> {
  if (!isFirebaseConfigured || !firebaseDb) {
    return sortByCreatedAtDesc(curatedVideoHighlights);
  }

  try {
    const snapshot = await withFirestoreTimeout(
      getDocs(collection(firebaseDb, COLLECTIONS.videos)),
      "Timed out while loading video highlights."
    );

    const items = snapshot.docs
      .map((item) => mapVideo(item.data() as Partial<CuratedVideoItem>, item.id))
      .filter((item): item is CuratedVideoItem => Boolean(item));

    return items.length ? sortByCreatedAtDesc(items) : sortByCreatedAtDesc(curatedVideoHighlights);
  } catch {
    return sortByCreatedAtDesc(curatedVideoHighlights);
  }
}

export async function getEditorialVideosByTeam(team: FootballTeam) {
  const items = await getEditorialVideos();
  return items.filter((item) => item.teamTag === team);
}

export async function getEditorialVideoById(id: string): Promise<CuratedVideoItem | null> {
  if (!isFirebaseConfigured || !firebaseDb) {
    return curatedVideoHighlights.find((item) => item.id === id) ?? null;
  }

  try {
    const snapshot = await withFirestoreTimeout(
      getDoc(doc(firebaseDb, COLLECTIONS.videos, id)),
      "Timed out while loading this video."
    );

    if (snapshot.exists()) {
      return mapVideo(snapshot.data() as Partial<CuratedVideoItem>, snapshot.id);
    }
  } catch {
    // fall through to fallback
  }

  return curatedVideoHighlights.find((item) => item.id === id) ?? null;
}

export async function getRelatedEditorialVideos(video: CuratedVideoItem, limit = 4) {
  const items = await getEditorialVideos();
  return items
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

function rotateDebates(items: DailyDebatePrompt[], team?: FootballTeam) {
  const filtered = team ? items.filter((item) => item.teamTag === team || !item.teamTag) : items;

  if (!filtered.length) {
    return [];
  }

  const daySeed = new Date().getUTCDate() + new Date().getUTCMonth() * 31;
  const startIndex = daySeed % filtered.length;
  const rotated = [...filtered.slice(startIndex), ...filtered.slice(0, startIndex)];
  return rotated.slice(0, Math.min(team ? 3 : 4, rotated.length));
}

export async function getEditorialDailyDebates(team?: FootballTeam): Promise<DailyDebatePrompt[]> {
  if (!isFirebaseConfigured || !firebaseDb) {
    return rotateDebates(dailyDebatePrompts, team);
  }

  try {
    const snapshot = await withFirestoreTimeout(
      getDocs(collection(firebaseDb, COLLECTIONS.debates)),
      "Timed out while loading daily debates."
    );

    const items = snapshot.docs
      .map((item) => mapDebate(item.data() as Partial<DailyDebatePrompt>, item.id))
      .filter((item): item is DailyDebatePrompt => Boolean(item));

    return rotateDebates(items.length ? items : dailyDebatePrompts, team);
  } catch {
    return rotateDebates(dailyDebatePrompts, team);
  }
}

export async function getEditorialLocalHighlights(): Promise<LocalNewsItem[]> {
  if (!isFirebaseConfigured || !firebaseDb) {
    return localNewsItems;
  }

  try {
    const snapshot = await withFirestoreTimeout(
      getDocs(collection(firebaseDb, COLLECTIONS.localHighlights)),
      "Timed out while loading local culture highlights."
    );

    const items = snapshot.docs
      .map((item) => mapLocalItem(item.data() as Partial<LocalNewsItem>, item.id))
      .filter((item): item is LocalNewsItem => Boolean(item));

    return items.length ? items : localNewsItems;
  } catch {
    return localNewsItems;
  }
}
