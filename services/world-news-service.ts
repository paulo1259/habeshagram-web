import { createDeterministicId } from "@/lib/utils";
import { WorldNewsItem, WorldNewsSectionKey } from "@/types";

export type WorldNewsFeedPayload = {
  topStories: WorldNewsItem[];
  us: WorldNewsItem[];
  ethiopia: WorldNewsItem[];
  immigration: WorldNewsItem[];
  sourceLabels: string[];
  fetchedAt: string;
  stale: boolean;
  message?: string;
};

type SourceDefinition = {
  label: string;
  feedUrl: string;
};

type ParsedRssItem = {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  source: string;
  imageURL: string;
};

type LaneDefinition = {
  key: Exclude<WorldNewsSectionKey, "top">;
  category: WorldNewsItem["category"];
  sources: SourceDefinition[];
  keywords: string[];
  priority: number;
};

const GOOGLE_NEWS_RSS_BASE = "https://news.google.com/rss/search";

function buildGoogleNewsSearchUrl(query: string) {
  const params = new URLSearchParams({
    q: query,
    hl: "en-US",
    gl: "US",
    ceid: "US:en"
  });

  return `${GOOGLE_NEWS_RSS_BASE}?${params.toString()}`;
}

const WORLD_NEWS_LANES: LaneDefinition[] = [
  {
    key: "us",
    category: "United States",
    priority: 2,
    keywords: ["united states", "u.s.", "us", "america", "washington", "federal"],
    sources: [
      {
        label: "Trusted U.S. headlines",
        feedUrl: buildGoogleNewsSearchUrl(
          '("United States" OR "U.S." OR America) (site:reuters.com OR site:apnews.com OR site:npr.org OR site:pbs.org)'
        )
      }
    ]
  },
  {
    key: "ethiopia",
    category: "Ethiopia",
    priority: 4,
    keywords: ["ethiopia", "addis abeba", "addis ababa", "amhara", "tigray", "oromia"],
    sources: [
      {
        label: "Ethiopia-focused reporting",
        feedUrl: buildGoogleNewsSearchUrl(
          '(Ethiopia OR "Addis Abeba" OR "Addis Ababa") (site:addisstandard.com OR site:thereporterethiopia.com OR site:ethiopianmonitor.com)'
        )
      }
    ]
  },
  {
    key: "immigration",
    category: "Immigration",
    priority: 5,
    keywords: ["immigration", "visa", "green card", "asylum", "uscis", "dhs", "refugee"],
    sources: [
      {
        label: "Official immigration updates",
        feedUrl: buildGoogleNewsSearchUrl(
          '(immigration OR visa OR "green card" OR asylum OR refugee) (site:uscis.gov OR site:dhs.gov)'
        )
      }
    ]
  }
];

function decodeXmlEntities(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function stripHtml(value: string) {
  return decodeXmlEntities(value).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function getTagValue(item: string, tagName: string) {
  const match = item.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`, "i"));
  return match ? stripHtml(match[1]) : "";
}

function getAttributeValue(input: string, tagName: string, attributeName: string) {
  const match = input.match(
    new RegExp(`<${tagName}[^>]*${attributeName}=["']([^"']+)["'][^>]*>`, "i")
  );
  return match ? decodeXmlEntities(match[1]) : "";
}

function parseRssItems(xml: string): ParsedRssItem[] {
  const itemMatches = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];

  return itemMatches.map((item, index) => ({
    title: getTagValue(item, "title") || `World news story ${index + 1}`,
    link: getTagValue(item, "link"),
    pubDate: getTagValue(item, "pubDate"),
    description: getTagValue(item, "description"),
    source: getTagValue(item, "source") || "News",
    imageURL:
      getAttributeValue(item, "media:content", "url") ||
      getAttributeValue(item, "media:thumbnail", "url") ||
      getAttributeValue(item, "enclosure", "url")
  }));
}

function formatPublishLabel(value: string) {
  const publishedAt = new Date(value);
  const diffMs = Date.now() - publishedAt.getTime();

  if (!Number.isFinite(diffMs) || diffMs < 0) {
    return "Just now";
  }

  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 60) {
    return `${Math.max(1, minutes)}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function toIsoDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function buildSummary(item: ParsedRssItem, lane: LaneDefinition) {
  const summary = item.description || `${lane.category} coverage from ${item.source}.`;
  return summary.length > 180 ? `${summary.slice(0, 177).trimEnd()}...` : summary;
}

function normalizeKey(value: string) {
  return value
    .toLowerCase()
    .replace(/https?:\/\/(www\.)?/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function rankLaneItem(item: WorldNewsItem, lane: LaneDefinition) {
  const publishedAt = new Date(item.publishedAt).getTime();
  const ageHours = Math.max(0, (Date.now() - publishedAt) / 36e5);
  const freshnessScore = Math.max(0, 48 - ageHours);
  const keywordScore = lane.keywords.reduce((total, keyword) => {
    const haystack = `${item.headline} ${item.summary}`.toLowerCase();
    return haystack.includes(keyword.toLowerCase()) ? total + 3 : total;
  }, 0);

  return freshnessScore + keywordScore + lane.priority * 6;
}

async function fetchLaneStories(lane: LaneDefinition) {
  const results = await Promise.all(
    lane.sources.map(async (source) => {
      const response = await fetch(source.feedUrl, {
        headers: {
          Accept: "application/rss+xml, application/xml, text/xml;q=0.9"
        },
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error(`${source.label} returned ${response.status}.`);
      }

      const xml = await response.text();
      return parseRssItems(xml).map((item) => ({ item, source }));
    })
  );

  const seen = new Set<string>();

  return results
    .flat()
    .map(({ item }) => {
      const publishedAt = item.pubDate ? toIsoDate(item.pubDate) : new Date().toISOString();

      const worldNewsItem: WorldNewsItem = {
        id: createDeterministicId(`world_${lane.key}`, `${item.title}-${item.source}`),
        headline: item.title,
        source: item.source,
        summary: buildSummary(item, lane),
        category: lane.category,
        imageURL: item.imageURL,
        link: item.link,
        publishedAt,
        publishLabel: formatPublishLabel(publishedAt),
        section: lane.key
      };

      return worldNewsItem;
    })
    .filter((item) => Boolean(item.link))
    .sort((left, right) => rankLaneItem(right, lane) - rankLaneItem(left, lane))
    .filter((item) => {
      const key = normalizeKey(`${item.headline} ${item.link}`);
      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .slice(0, 8);
}

function buildTopStories(sections: Record<Exclude<WorldNewsSectionKey, "top">, WorldNewsItem[]>) {
  const combined = [...sections.ethiopia, ...sections.immigration, ...sections.us];
  const seen = new Set<string>();

  return combined
    .sort((left, right) => {
      const leftAge = new Date(left.publishedAt).getTime();
      const rightAge = new Date(right.publishedAt).getTime();
      const leftPriority =
        left.section === "immigration" ? 3 : left.section === "ethiopia" ? 2 : 1;
      const rightPriority =
        right.section === "immigration" ? 3 : right.section === "ethiopia" ? 2 : 1;

      if (leftPriority !== rightPriority) {
        return rightPriority - leftPriority;
      }

      return rightAge - leftAge;
    })
    .filter((item) => {
      const key = normalizeKey(`${item.headline} ${item.link}`);
      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .slice(0, 4)
    .map((item) => ({
      ...item,
      category: "Top stories" as const,
      section: "top" as const
    }));
}

function excludeTopStoryDuplicates(items: WorldNewsItem[], topStories: WorldNewsItem[]) {
  const excluded = new Set(topStories.map((item) => normalizeKey(`${item.headline} ${item.link}`)));
  return items.filter((item) => !excluded.has(normalizeKey(`${item.headline} ${item.link}`))).slice(0, 4);
}

export async function fetchWorldNewsFeed(): Promise<WorldNewsFeedPayload> {
  const laneResponses = await Promise.all(WORLD_NEWS_LANES.map((lane) => fetchLaneStories(lane)));
  const laneMap = WORLD_NEWS_LANES.reduce<Record<Exclude<WorldNewsSectionKey, "top">, WorldNewsItem[]>>(
    (accumulator, lane, index) => {
      accumulator[lane.key] = laneResponses[index];
      return accumulator;
    },
    {
      us: [],
      ethiopia: [],
      immigration: []
    }
  );

  const topStories = buildTopStories(laneMap);

  return {
    topStories,
    us: excludeTopStoryDuplicates(laneMap.us, topStories),
    ethiopia: excludeTopStoryDuplicates(laneMap.ethiopia, topStories),
    immigration: excludeTopStoryDuplicates(laneMap.immigration, topStories),
    sourceLabels: WORLD_NEWS_LANES.flatMap((lane) => lane.sources.map((source) => source.label)),
    fetchedAt: new Date().toISOString(),
    stale: false,
    message: topStories.length
      ? undefined
      : "World News is temporarily quiet while the source lanes refresh."
  };
}
