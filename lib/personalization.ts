"use client";

import { Post } from "@/types";

export type PersonalizationSection =
  | "radio"
  | "world-news"
  | "videos"
  | "debates";

type PersonalizationProfile = {
  sectionUsage: Partial<Record<PersonalizationSection, number>>;
  tagUsage: Record<string, number>;
  updatedAt: string;
};

const STORAGE_KEY = "habeshagram-personalization-v1";

const EMPTY_PROFILE: PersonalizationProfile = {
  sectionUsage: {},
  tagUsage: {},
  updatedAt: new Date(0).toISOString()
};

function normalizeTag(tag: string) {
  return tag.replace(/^#+/, "").trim().toLowerCase();
}

function readProfile(): PersonalizationProfile {
  if (typeof window === "undefined") {
    return EMPTY_PROFILE;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return EMPTY_PROFILE;
    }

    const parsed = JSON.parse(raw) as Partial<PersonalizationProfile>;

    return {
      sectionUsage: parsed.sectionUsage ?? {},
      tagUsage: parsed.tagUsage ?? {},
      updatedAt: parsed.updatedAt ?? new Date().toISOString()
    };
  } catch {
    return EMPTY_PROFILE;
  }
}

function writeProfile(profile: PersonalizationProfile) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

function updateProfile(mutator: (profile: PersonalizationProfile) => PersonalizationProfile) {
  const current = readProfile();
  const next = mutator(current);
  writeProfile({
    ...next,
    updatedAt: new Date().toISOString()
  });
}

function incrementRecordValue<T extends string>(
  record: Partial<Record<T, number>>,
  key: T,
  weight: number
) {
  record[key] = (record[key] ?? 0) + weight;
}

export function getPersonalizationProfile() {
  return readProfile();
}

export function recordSectionUsage(section: PersonalizationSection, weight = 1) {
  updateProfile((profile) => {
    const nextSectionUsage = { ...profile.sectionUsage };
    incrementRecordValue(nextSectionUsage, section, weight);

    return {
      ...profile,
      sectionUsage: nextSectionUsage
    };
  });
}

export function recordTagUsage(tags?: string[], weight = 1) {
  if (!tags?.length) {
    return;
  }

  updateProfile((profile) => {
    const nextTagUsage = { ...profile.tagUsage };

    tags.forEach((tag) => {
      const normalized = normalizeTag(tag);
      if (normalized) {
        nextTagUsage[normalized] = (nextTagUsage[normalized] ?? 0) + weight;
      }
    });

    return {
      ...profile,
      tagUsage: nextTagUsage
    };
  });
}

export function recordPostEngagement(post: Post, options?: { weight?: number; section?: PersonalizationSection }) {
  const weight = options?.weight ?? 1;

  if (options?.section) {
    recordSectionUsage(options.section, weight);
  }

  recordTagUsage(post.hashtags, weight);
}

export function recordVideoEngagement(input: {
  hashtags?: string[];
  weight?: number;
}) {
  const weight = input.weight ?? 1;
  recordSectionUsage("videos", weight);
  recordTagUsage(input.hashtags, weight);
}

export function recordDebateEngagement(input: {
  hashtag?: string;
  weight?: number;
}) {
  const weight = input.weight ?? 1;
  recordSectionUsage("debates", weight);
  recordTagUsage(input.hashtag ? [input.hashtag] : [], weight);
}

function buildStateTagScores(posts: Post[]) {
  const scores: Record<string, number> = {};

  posts.forEach((post) => {
    (post.hashtags ?? []).forEach((tag) => {
      const normalized = normalizeTag(tag);
      if (normalized) {
        scores[normalized] = (scores[normalized] ?? 0) + 1;
      }
    });
  });

  return scores;
}

export function hasEnoughPersonalizationData(input: {
  profile: PersonalizationProfile;
  likedPosts: Post[];
  savedPosts: Post[];
  followingIds: string[];
}) {
  const sectionSignals = Object.values(input.profile.sectionUsage).reduce((sum, value) => sum + (value ?? 0), 0);
  const tagSignals = Object.values(input.profile.tagUsage).reduce((sum, value) => sum + (value ?? 0), 0);

  return (
    input.likedPosts.length > 0 ||
    input.savedPosts.length > 0 ||
    input.followingIds.length > 0 ||
    sectionSignals + tagSignals >= 4
  );
}

export function rankPersonalizedFeedPosts(input: {
  posts: Post[];
  currentUserId?: string | null;
  followingIds: string[];
  likedPosts: Post[];
  savedPosts: Post[];
  profile: PersonalizationProfile;
}) {
  if (!input.currentUserId) {
    return input.posts;
  }

  const likedTagScores = buildStateTagScores(input.likedPosts);
  const savedTagScores = buildStateTagScores(input.savedPosts);
  const followingIdSet = new Set(input.followingIds);

  return [...input.posts].sort((left, right) => {
    const scorePost = (post: Post) => {
      const ageHours = Math.max(0, (Date.now() - new Date(post.createdAt).getTime()) / 36e5);
      const freshnessScore = Math.max(0, 48 - ageHours) * 0.75;
      let score = freshnessScore;

      if (followingIdSet.has(post.userId)) {
        score += 10;
      }

      (post.hashtags ?? []).forEach((tag) => {
        const normalized = normalizeTag(tag);
        score += (input.profile.tagUsage[normalized] ?? 0) * 0.7;
        score += (likedTagScores[normalized] ?? 0) * 1.1;
        score += (savedTagScores[normalized] ?? 0) * 1.3;
      });

      if (post.userId === input.currentUserId) {
        score += 1.5;
      }

      if (post.isSystem) {
        score -= 2;
      }

      return score;
    };

    const rightScore = scorePost(right);
    const leftScore = scorePost(left);

    if (rightScore !== leftScore) {
      return rightScore - leftScore;
    }

    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });
}

export function getHomepageSectionScores(profile: PersonalizationProfile) {
  return {
    radio: profile.sectionUsage.radio ?? 0,
    "world-news": profile.sectionUsage["world-news"] ?? 0,
    videos: profile.sectionUsage.videos ?? 0,
    debates: profile.sectionUsage.debates ?? 0
  };
}
