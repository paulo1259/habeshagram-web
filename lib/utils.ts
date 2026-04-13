import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export function createId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getInitials(username: string) {
  return username
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function normalizeHashtag(tag: string) {
  return tag.replace(/^#+/, "").trim().toLowerCase();
}

export function parseHashtags(text: string) {
  const matches = text.match(/#[\p{L}\p{N}_]+/gu) ?? [];
  return Array.from(
    new Set(
      matches
        .map((match) => normalizeHashtag(match))
      .filter(Boolean)
    )
  );
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function createDeterministicId(prefix: string, value: string) {
  const normalized = slugify(value);
  return `${prefix}_${normalized || "item"}`;
}

export function getBreakingDiscussionPostId(headline: string, source: string) {
  return createDeterministicId("system_breaking", `${headline}-${source}`);
}
