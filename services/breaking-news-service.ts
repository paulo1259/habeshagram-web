import { createDeterministicId } from "@/lib/utils";
import { BreakingBadge, BreakingItem } from "@/types";

const DEFAULT_BREAKING_NEWS_RSS_URL = "https://feeds.bbci.co.uk/news/world/africa/rss.xml";

type BreakingFeedPayload = {
  items: BreakingItem[];
  source: string;
  stale: boolean;
  fetchedAt: string;
  message?: string;
};

type ParsedRssItem = {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  source: string;
};


const badgeByAgeHours = (hours: number): BreakingBadge => {
  if (hours <= 2) {
    return "BREAKING";
  }

  if (hours <= 8) {
    return "JUST IN";
  }

  return "LIVE";
};

function decodeXmlEntities(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function getTagValue(item: string, tagName: string) {
  const match = item.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`, "i"));
  return match ? decodeXmlEntities(match[1]) : "";
}

function parseRssItems(xml: string): ParsedRssItem[] {
  const itemMatches = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];

  return itemMatches.map((item, index) => ({
    title: getTagValue(item, "title") || `News update ${index + 1}`,
    link: getTagValue(item, "link"),
    pubDate: getTagValue(item, "pubDate"),
    description: getTagValue(item, "description"),
    source: getTagValue(item, "source") || "BBC Africa"
  }));
}


function mapRssItemToBreakingItem(item: ParsedRssItem): BreakingItem | null {
  if (!item.title || !item.link) {
    return null;
  }

  const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date();
  const hoursAgo = Math.max(0, (Date.now() - publishedAt.getTime()) / 36e5);

  return {
    id: createDeterministicId("rss_breaking", `${item.title}-${item.source}`),
    headline: item.title,
    source: item.source,
    summary: item.description,
    link: item.link,
    timestamp: publishedAt.toISOString(),
    category: "News",
    badge: badgeByAgeHours(hoursAgo)
  };
}

function rankBreakingItem(item: BreakingItem) {
  const publishedAt = new Date(item.timestamp).getTime();
  const ageHours = Math.max(0, (Date.now() - publishedAt) / 36e5);
  const freshnessScore = Math.max(0, 24 - ageHours);
  const badgeScore = item.badge === "BREAKING" ? 3 : item.badge === "JUST IN" ? 2 : 1;
  return freshnessScore + badgeScore;
}

function normalizeFeedUrlList(raw: string | undefined) {
  return (raw ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function getBreakingNewsFeedUrls() {
  const multi = normalizeFeedUrlList(process.env.BREAKING_NEWS_RSS_URLS);

  if (multi.length) {
    return multi;
  }

  const single = process.env.BREAKING_NEWS_RSS_URL?.trim();
  return single ? [single] : [DEFAULT_BREAKING_NEWS_RSS_URL];
}

export function getBreakingNewsFeedUrl() {
  return getBreakingNewsFeedUrls().join(", ");
}

export async function fetchBreakingNewsFromRss(feedUrls = getBreakingNewsFeedUrls()) {
  const settledFeeds = await Promise.allSettled(
    feedUrls.map(async (feedUrl) => {
      const response = await fetch(feedUrl, {
        headers: {
          Accept: "application/rss+xml, application/xml, text/xml;q=0.9"
        },
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(`Breaking news provider returned ${response.status} for ${feedUrl}.`);
      }

      const xml = await response.text();
      return parseRssItems(xml);
    })
  );

  const successfulFeeds = settledFeeds
    .filter((result): result is PromiseFulfilledResult<ParsedRssItem[]> => result.status === "fulfilled")
    .flatMap((result) => result.value);

  if (!successfulFeeds.length) {
    const firstFailure = settledFeeds.find((result): result is PromiseRejectedResult => result.status === "rejected");
    throw firstFailure?.reason instanceof Error
      ? firstFailure.reason
      : new Error("All breaking news feeds failed.");
  }

  const deduped = Array.from(
    new Map(
      successfulFeeds.map((item) => [
        createDeterministicId("rss_raw_breaking", `${item.title}-${item.link || item.pubDate}`),
        item
      ])
    ).values()
  );

  return deduped
    .map(mapRssItemToBreakingItem)
    .filter((item): item is BreakingItem => Boolean(item))
    .sort((left, right) => rankBreakingItem(right) - rankBreakingItem(left))
    .slice(0, 8);
}

export type { BreakingFeedPayload };
