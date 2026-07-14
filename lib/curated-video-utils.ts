import { CuratedVideoItem } from "@/types";

export type CuratedVideoDiagnostics = {
  source: "firestore" | "empty" | "error";
  collection: string;
  totalDocs: number;
  mappedDocs: number;
  rejectedDocs: Array<{ id: string; title?: string; reasons: string[] }>;
  items: CuratedVideoItem[];
  returnedItems: Array<{ id: string; title: string; featured: boolean; createdAt: string }>;
  error?: string;
};

export function getTimestampValue(value: unknown) {
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

export function normalizeCreatedAt(value: unknown) {
  const timestamp = getTimestampValue(value);
  return timestamp ? new Date(timestamp).toISOString() : new Date().toISOString();
}

export function mapCuratedVideoData(
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
    hashtags: Array.isArray(data.hashtags) ? data.hashtags : [],
    createdAt: normalizeCreatedAt(data.createdAt),
    publishLabel: data.publishLabel,
    featured: Boolean(data.featured)
  };
}

export function sortCuratedVideos(items: CuratedVideoItem[]) {
  return [...items].sort((a, b) => {
    if (Boolean(a.featured) !== Boolean(b.featured)) {
      return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
    }

    return getTimestampValue(b.createdAt) - getTimestampValue(a.createdAt);
  });
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
