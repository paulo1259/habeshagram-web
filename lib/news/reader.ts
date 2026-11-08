import type { WorldNewsItem } from "@/types";

export function filterStories(items: WorldNewsItem[], query: string, source: string) {
  const term = query.trim().toLocaleLowerCase();
  return items.filter((item) => (!source || item.source === source) && `${item.headline} ${item.summary} ${item.source}`.toLocaleLowerCase().includes(term));
}

export function uniqueStories(items: WorldNewsItem[]) {
  const ids = new Set<string>();
  return items.filter((item) => { if (ids.has(item.id)) return false; ids.add(item.id); return true; });
}

export function publishedTime(value: string, lang: "en" | "am") {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return lang === "am" ? "ቀን አልተገለጸም" : "Date unavailable";
  return new Intl.DateTimeFormat(lang === "am" ? "am-ET" : "en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC", timeZoneName: "short"
  }).format(date);
}
