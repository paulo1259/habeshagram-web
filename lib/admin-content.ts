import {
  createDeterministicId,
  normalizeHashtag,
  slugify
} from "@/lib/utils";
import {
  CuratedVideoCategory,
  CuratedVideoItem,
  DailyDebatePrompt,
  EditorialHighlightCategory,
  FootballTeam,
  LocalNewsItem
} from "@/types";

export type AdminContentKind = "videos" | "debates" | "editorial";

export type AdminContentItemMap = {
  videos: CuratedVideoItem;
  debates: DailyDebatePrompt;
  editorial: LocalNewsItem;
};

export const ADMIN_CONTENT_COLLECTIONS: Record<AdminContentKind, string> = {
  videos: "curatedVideos",
  debates: "dailyDebates",
  editorial: "editorialHighlights"
};

const FOOTBALL_TEAMS = new Set<FootballTeam>([
  "Manchester United",
  "Arsenal",
  "Chelsea",
  "Manchester City"
]);

const VIDEO_CATEGORIES = new Set<CuratedVideoCategory>([
  "Football Moments",
  "Fan Reactions",
  "Culture",
  "Music"
]);

const DEBATE_CATEGORIES = new Set<DailyDebatePrompt["category"]>([
  "Big Debate",
  "Fan Base",
  "Matchday",
  "Community"
]);

const EDITORIAL_CATEGORIES = new Set<EditorialHighlightCategory>([
  "Entertainment",
  "Culture",
  "Music",
  "Events",
  "Community"
]);

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalString(value: unknown) {
  const next = readString(value);
  return next || undefined;
}

function readBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function readTeam(value: unknown) {
  const next = readString(value) as FootballTeam;
  return FOOTBALL_TEAMS.has(next) ? next : undefined;
}

function readHashtags(value: unknown) {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value
          .map((item) => normalizeHashtag(typeof item === "string" ? item : ""))
          .filter(Boolean)
      )
    );
  }

  if (typeof value === "string") {
    return Array.from(
      new Set(
        value
          .split(",")
          .map((item) => normalizeHashtag(item))
          .filter(Boolean)
      )
    );
  }

  return [];
}

function ensureCategory<T extends string>(value: unknown, allowed: Set<T>, fallback: T) {
  const next = readString(value) as T;
  return allowed.has(next) ? next : fallback;
}

function createStableId(prefix: string, seed: string, existingId?: string) {
  const preferred = readString(existingId);
  return preferred || createDeterministicId(prefix, seed);
}

export function isAdminContentKind(value: string): value is AdminContentKind {
  return value === "videos" || value === "debates" || value === "editorial";
}

export function sortAdminItems<T extends { createdAt?: string; featured?: boolean }>(items: T[]) {
  return [...items].sort((a, b) => {
    if (Boolean(a.featured) !== Boolean(b.featured)) {
      return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
    }

    return +new Date(b.createdAt ?? 0) - +new Date(a.createdAt ?? 0);
  });
}

export function sanitizeAdminItem<K extends AdminContentKind>(
  kind: K,
  value: unknown
): AdminContentItemMap[K] {
  const input = typeof value === "object" && value ? (value as Record<string, unknown>) : {};
  const now = new Date().toISOString();

  if (kind === "videos") {
    const title = readString(input.title);
    const source = readString(input.source);
    const summary = readString(input.summary);
    const embedUrl = readString(input.embedUrl);

    if (!title || !source || !summary || !embedUrl) {
      throw new Error("Videos require title, source, summary, and embedUrl.");
    }

    return {
      id: createStableId("video", title, readOptionalString(input.id)),
      title,
      category: ensureCategory(input.category, VIDEO_CATEGORIES, "Football Moments"),
      source,
      summary,
      thumbnailURL: readString(input.thumbnailURL),
      videoUrl: readString(input.videoUrl) || embedUrl,
      embedUrl,
      duration: readString(input.duration),
      teamTag: readTeam(input.teamTag),
      hashtags: readHashtags(input.hashtags),
      createdAt: readString(input.createdAt) || now,
      publishLabel: readOptionalString(input.publishLabel),
      featured: readBoolean(input.featured)
    } as AdminContentItemMap[K];
  }

  if (kind === "debates") {
    const prompt = readString(input.prompt);
    const suggestedText = readString(input.suggestedText);

    if (!prompt || !suggestedText) {
      throw new Error("Debates require a prompt and suggestedText.");
    }

    const hashtag = readOptionalString(input.hashtag);

    return {
      id: createStableId("debate", prompt, readOptionalString(input.id)),
      prompt,
      category: ensureCategory(input.category, DEBATE_CATEGORIES, "Big Debate"),
      teamTag: readTeam(input.teamTag),
      hashtag: hashtag ? normalizeHashtag(hashtag) : undefined,
      suggestedText,
      featured: readBoolean(input.featured),
      active: readBoolean(input.active, true),
      publishLabel: readOptionalString(input.publishLabel),
      createdAt: readString(input.createdAt) || now
    } as AdminContentItemMap[K];
  }

  const headline = readString(input.headline);
  const source = readString(input.source);
  const summary = readString(input.summary);

  if (!headline || !source || !summary) {
    throw new Error("Editorial highlights require a headline, source, and summary.");
  }

  return {
    id: createStableId("highlight", headline, readOptionalString(input.id)),
    headline,
    source,
    summary,
    category: ensureCategory(input.category, EDITORIAL_CATEGORIES, "Community"),
    imageURL: readString(input.imageURL),
    link: readString(input.link),
    featured: readBoolean(input.featured),
    createdAt: readString(input.createdAt) || now,
    publishLabel: readOptionalString(input.publishLabel),
    teamTag: readTeam(input.teamTag),
    hashtags: readHashtags(input.hashtags)
  } as AdminContentItemMap[K];
}

export function createAdminDraftId(kind: AdminContentKind, seed: string) {
  const normalized = slugify(seed);
  const prefix = kind === "videos" ? "video" : kind === "debates" ? "debate" : "highlight";
  return `${prefix}_${normalized || "item"}`;
}
