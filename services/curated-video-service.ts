import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { firebaseDb, isFirebaseConfigured } from "@/lib/firebase";
import { CuratedVideoItem, FootballTeam } from "@/types";

const FIRESTORE_TIMEOUT_MS = 4000;
const CURATED_VIDEOS_COLLECTION = "curatedVideos";
const SHOULD_LOG_DEBUG = process.env.NODE_ENV !== "production";

type CuratedVideoDiagnostics = {
  source: "firestore" | "empty" | "error";
  collection: string;
  isFirebaseConfigured: boolean;
  totalDocs: number;
  mappedDocs: number;
  rejectedDocs: Array<{ id: string; title?: string; reasons: string[] }>;
  items: CuratedVideoItem[];
  returnedItems: Array<{ id: string; title: string; featured: boolean; createdAt: string; teamTag?: FootballTeam }>;
  error?: string;
};

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

function sortCuratedVideos(items: CuratedVideoItem[]) {
  return [...items].sort((a, b) => {
    if (Boolean(a.featured) !== Boolean(b.featured)) {
      return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
    }

    return getTimestampValue(b.createdAt) - getTimestampValue(a.createdAt);
  });
}

function getTimestampValue(value: unknown) {
  if (typeof value === "string") {
    const parsed = +new Date(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (
    typeof value === "object" &&
    value &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().getTime();
  }

  if (
    typeof value === "object" &&
    value &&
    "seconds" in value &&
    typeof (value as { seconds?: unknown }).seconds === "number"
  ) {
    return (value as { seconds: number }).seconds * 1000;
  }

  return 0;
}

function normalizeCreatedAt(value: unknown) {
  const timestamp = getTimestampValue(value);
  return timestamp ? new Date(timestamp).toISOString() : new Date().toISOString();
}

function mapCuratedVideo(
  data: Partial<CuratedVideoItem>,
  id: string,
  rejectedDocs?: CuratedVideoDiagnostics["rejectedDocs"]
): CuratedVideoItem | null {
  const reasons: string[] = [];

  if (!data.title) {
    reasons.push("missing title");
  }

  if (!data.category) {
    reasons.push("missing category");
  }

  if (!data.source) {
    reasons.push("missing source");
  }

  if (!data.summary) {
    reasons.push("missing summary");
  }

  if (!data.embedUrl) {
    reasons.push("missing embedUrl");
  }

  if (reasons.length) {
    rejectedDocs?.push({
      id,
      title: typeof data.title === "string" ? data.title : undefined,
      reasons
    });
    return null;
  }

  return {
    id: data.id || id,
    title: data.title as string,
    category: data.category as CuratedVideoItem["category"],
    source: data.source as string,
    summary: data.summary as string,
    thumbnailURL: data.thumbnailURL || "",
    videoUrl: (data.videoUrl || data.embedUrl) as string,
    embedUrl: data.embedUrl as string,
    duration: data.duration || "",
    teamTag: data.teamTag,
    hashtags: Array.isArray(data.hashtags) ? data.hashtags : [],
    createdAt: normalizeCreatedAt(data.createdAt),
    publishLabel: data.publishLabel,
    featured: Boolean(data.featured)
  };
}

function logDiagnostics(scope: string, diagnostics: CuratedVideoDiagnostics) {
  if (!SHOULD_LOG_DEBUG) {
    return;
  }

  console.info(`[curated-videos:${scope}]`, diagnostics);
}

export function selectHomepageVideoHighlights(videos: CuratedVideoItem[], limit = 6) {
  const sortedByRecency = [...videos].sort(
    (a, b) => getTimestampValue(b.createdAt) - getTimestampValue(a.createdAt)
  );
  const hero = videos.find((item) => item.featured) ?? sortedByRecency[0] ?? null;
  const remaining = sortedByRecency.filter((item) => item.id !== hero?.id);
  const featuredRemaining = remaining.filter((item) => item.featured);
  const regularRemaining = remaining.filter((item) => !item.featured);

  const supporting = [...featuredRemaining.slice(0, 2), ...regularRemaining]
    .slice(0, Math.max(limit - (hero ? 1 : 0), 0))
    .sort((a, b) => getTimestampValue(b.createdAt) - getTimestampValue(a.createdAt));

  return {
    hero,
    supporting,
    visibleIds: [hero?.id, ...supporting.map((item) => item.id)].filter(
      (value): value is string => Boolean(value)
    )
  };
}

export async function getCuratedVideoDebugSnapshot() {
  if (!isFirebaseConfigured || !firebaseDb) {
    const diagnostics: CuratedVideoDiagnostics = {
      source: "empty",
      collection: CURATED_VIDEOS_COLLECTION,
      isFirebaseConfigured,
      totalDocs: 0,
      mappedDocs: 0,
      rejectedDocs: [],
      items: [],
      returnedItems: [],
      error: "Firebase is not configured on the public client."
    };

    logDiagnostics("snapshot", diagnostics);
    return diagnostics;
  }

  try {
    const snapshot = await withFirestoreTimeout(
      getDocs(collection(firebaseDb, CURATED_VIDEOS_COLLECTION)),
      "Timed out while loading curated videos."
    );
    const rejectedDocs: CuratedVideoDiagnostics["rejectedDocs"] = [];

    const items = snapshot.docs
      .map((item) =>
        mapCuratedVideo(item.data() as Partial<CuratedVideoItem>, item.id, rejectedDocs)
      )
      .filter((item): item is CuratedVideoItem => Boolean(item));

    const sortedItems = sortCuratedVideos(items);
    const diagnostics: CuratedVideoDiagnostics = {
      source: sortedItems.length ? "firestore" : "empty",
      collection: CURATED_VIDEOS_COLLECTION,
      isFirebaseConfigured,
      totalDocs: snapshot.docs.length,
      mappedDocs: sortedItems.length,
      rejectedDocs,
      items: sortedItems,
      returnedItems: sortedItems.map((item) => ({
        id: item.id,
        title: item.title,
        featured: Boolean(item.featured),
        createdAt: item.createdAt,
        teamTag: item.teamTag
      }))
    };

    logDiagnostics("snapshot", diagnostics);
    return diagnostics;
  } catch (error) {
    const diagnostics: CuratedVideoDiagnostics = {
      source: "error",
      collection: CURATED_VIDEOS_COLLECTION,
      isFirebaseConfigured,
      totalDocs: 0,
      mappedDocs: 0,
      rejectedDocs: [],
      items: [],
      returnedItems: [],
      error: error instanceof Error ? error.message : "Unknown curated video read error."
    };

    logDiagnostics("snapshot", diagnostics);
    return diagnostics;
  }
}

export async function getCuratedVideos(): Promise<CuratedVideoItem[]> {
  const diagnostics = await getCuratedVideoDebugSnapshot();
  return diagnostics.items;
}

export async function getCuratedVideosByTeam(team: FootballTeam) {
  const diagnostics = await getCuratedVideoDebugSnapshot();
  const videos = diagnostics.items;
  const filtered = videos.filter((video) => video.teamTag === team);

  logDiagnostics("team-filter", {
    ...diagnostics,
    returnedItems: filtered.map((item) => ({
      id: item.id,
      title: item.title,
      featured: Boolean(item.featured),
      createdAt: item.createdAt,
      teamTag: item.teamTag
    })),
    mappedDocs: filtered.length
  });

  return filtered;
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
      const video = mapCuratedVideo(snapshot.data() as Partial<CuratedVideoItem>, snapshot.id);
      if (SHOULD_LOG_DEBUG) {
        console.info("[curated-videos:detail]", {
          id,
          found: Boolean(video),
          title: video?.title ?? null
        });
      }
      return video;
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

      return getTimestampValue(b.item.createdAt) - getTimestampValue(a.item.createdAt);
    })
    .slice(0, limit)
    .map(({ item }) => item);
}

// The internal admin workspace now manages curatedVideos/{videoId}. This
// service remains the lightweight public read layer for curated videos.
