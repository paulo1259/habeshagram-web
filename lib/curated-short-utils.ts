import { CuratedShortCategory, CuratedShortItem } from "@/types";
import { getTimestampValue, normalizeCreatedAt } from "@/lib/curated-video-utils";

export type CuratedShortDiagnostics = {
  source: "firestore" | "empty" | "error";
  collection: string;
  totalDocs: number;
  mappedDocs: number;
  rejectedDocs: Array<{ id: string; title?: string; reasons: string[] }>;
  items: CuratedShortItem[];
  returnedItems: Array<{
    id: string;
    title: string;
    featured: boolean;
    createdAt: string;
    vertical: boolean;
  }>;
  error?: string;
};

const SHORT_CATEGORIES = new Set<CuratedShortCategory>([
  "Fan Cam",
  "Quick Take",
  "Culture Burst"
]);

function readCategory(value: unknown) {
  return typeof value === "string" && SHORT_CATEGORIES.has(value as CuratedShortCategory)
    ? (value as CuratedShortCategory)
    : "Quick Take";
}

function readDurationSeconds(value: unknown) {
  if (typeof value !== "string") {
    return Number.POSITIVE_INFINITY;
  }

  const cleaned = value.trim();
  if (!cleaned) {
    return Number.POSITIVE_INFINITY;
  }

  const parts = cleaned.split(":").map((part) => Number.parseInt(part, 10));
  if (parts.some((part) => Number.isNaN(part))) {
    return Number.POSITIVE_INFINITY;
  }

  if (parts.length === 1) {
    return parts[0];
  }

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  return parts[0] * 3600 + parts[1] * 60 + parts[2];
}

export function mapCuratedShortData(
  data: Partial<CuratedShortItem>,
  id: string,
  rejectedDocs?: CuratedShortDiagnostics["rejectedDocs"]
): CuratedShortItem | null {
  const reasons: string[] = [];

  if (!data.title) {
    reasons.push("missing title");
  }

  if (!data.source) {
    reasons.push("missing source");
  }

  if (!data.summary) {
    reasons.push("missing summary");
  }

  if (!data.embedUrl && !data.videoUrl) {
    reasons.push("missing playable short source");
  }

  const duration = typeof data.duration === "string" ? data.duration.trim() : "";
  if (!duration) {
    reasons.push("missing duration");
  } else if (readDurationSeconds(duration) > 180) {
    reasons.push("duration exceeds short-form threshold");
  }

  const vertical = typeof data.vertical === "boolean" ? data.vertical : true;
  if (!vertical) {
    reasons.push("short is not marked vertical");
  }

  const playbackMode =
    data.playbackMode === "embed"
      ? "embed"
      : data.videoUrl
        ? "file"
        : "embed";

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
    category: readCategory(data.category),
    source: data.source as string,
    summary: data.summary as string,
    thumbnailURL: data.thumbnailURL || "",
    videoUrl: (data.videoUrl || data.embedUrl || "") as string,
    embedUrl: (data.embedUrl || "") as string,
    duration,
    playbackMode,
    vertical,
    storagePath: typeof data.storagePath === "string" ? data.storagePath : undefined,
    thumbnailStoragePath:
      typeof data.thumbnailStoragePath === "string" ? data.thumbnailStoragePath : undefined,
    hashtags: Array.isArray(data.hashtags) ? data.hashtags : [],
    createdAt: normalizeCreatedAt(data.createdAt),
    publishLabel: data.publishLabel,
    featured: Boolean(data.featured)
  };
}

export function sortCuratedShorts(items: CuratedShortItem[]) {
  return [...items].sort((a, b) => {
    if (Boolean(a.featured) !== Boolean(b.featured)) {
      return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
    }

    return getTimestampValue(b.createdAt) - getTimestampValue(a.createdAt);
  });
}
