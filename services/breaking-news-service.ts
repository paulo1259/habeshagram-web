import { breakingItems } from "@/services/discovery-data";
import { BreakingBadge, BreakingItem, FootballTeam } from "@/types";

const DEFAULT_BREAKING_NEWS_RSS_URL = "https://feeds.bbci.co.uk/sport/football/rss.xml";

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

const teamKeywords: Record<FootballTeam, string[]> = {
  "Manchester United": ["manchester united", "man utd", "man united", "old trafford", "amorim", "rashford"],
  Arsenal: ["arsenal", "gunners", "arteta", "emirates stadium", "saka"],
  Chelsea: ["chelsea", "blues", "stamford bridge", "palmer", "maresca"],
  "Manchester City": ["manchester city", "man city", "etihad", "guardiola", "haaland", "foden"]
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
    title: getTagValue(item, "title") || `Football update ${index + 1}`,
    link: getTagValue(item, "link"),
    pubDate: getTagValue(item, "pubDate"),
    description: getTagValue(item, "description"),
    source: getTagValue(item, "source") || "BBC Sport"
  }));
}

function detectTeam(text: string): FootballTeam | undefined {
  const normalized = text.toLowerCase();

  return (Object.entries(teamKeywords) as Array<[FootballTeam, string[]]>).find(([, keywords]) =>
    keywords.some((keyword) => normalized.includes(keyword))
  )?.[0];
}

function mapRssItemToBreakingItem(item: ParsedRssItem, index: number): BreakingItem | null {
  const combined = `${item.title} ${item.description}`.trim();
  const team = detectTeam(combined);

  if (!team) {
    return null;
  }

  const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date();
  const hoursAgo = Math.max(0, (Date.now() - publishedAt.getTime()) / 36e5);

  return {
    id: `rss-breaking-${index}`,
    headline: item.title,
    source: item.source,
    timestamp: publishedAt.toISOString(),
    category: "Football",
    badge: badgeByAgeHours(hoursAgo),
    team
  };
}

export function getBreakingNewsFeedUrl() {
  return process.env.BREAKING_NEWS_RSS_URL || DEFAULT_BREAKING_NEWS_RSS_URL;
}

export function getFallbackBreakingItems(team?: FootballTeam) {
  return team ? breakingItems.filter((item) => item.team === team || !item.team) : breakingItems;
}

export async function fetchBreakingNewsFromRss(feedUrl = getBreakingNewsFeedUrl()) {
  const response = await fetch(feedUrl, {
    headers: {
      Accept: "application/rss+xml, application/xml, text/xml;q=0.9"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Breaking news provider returned ${response.status}.`);
  }

  const xml = await response.text();
  return parseRssItems(xml)
    .map(mapRssItemToBreakingItem)
    .filter((item): item is BreakingItem => Boolean(item))
    .slice(0, 8);
}

export type { BreakingFeedPayload };
