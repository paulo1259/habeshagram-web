import { createDeterministicId } from "@/lib/utils";
import { WorldNewsItem, WorldNewsSectionKey } from "@/types";

export type WorldNewsFeedPayload = {
  topStories: WorldNewsItem[];
  ethiopia: WorldNewsItem[];
  eastafrica: WorldNewsItem[];
  diaspora: WorldNewsItem[];
  sourceLabels: string[];
  fetchedAt: string;
  stale: boolean;
  message?: string;
};

type SourceDefinition = {
  label: string;
  feedUrl: string;
  /** Used when the feed items carry no <source> tag (direct outlet feeds). */
  fallbackSource?: string;
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
const SOURCE_TIMEOUT_MS = 8_000;
const MAX_STORY_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function buildGoogleNewsSearchUrl(query: string) {
  const params = new URLSearchParams({
    q: query,
    hl: "en-US",
    gl: "US",
    ceid: "US:en"
  });

  return `${GOOGLE_NEWS_RSS_BASE}?${params.toString()}`;
}

/**
 * Lane strategy — Ethiopia / East Africa centered.
 *
 * Every source here is free, keyless, and server-fetched:
 *  - Google News RSS search lanes update within minutes of publication and
 *    carry outlet attribution per story.
 *  - Direct outlet RSS feeds (Addis Standard, BBC Amharic, BBC Africa) are
 *    polled straight from the publisher for the fastest possible pickup.
 */
const WORLD_NEWS_LANES: LaneDefinition[] = [
  {
    key: "ethiopia",
    category: "Ethiopia",
    priority: 5,
    keywords: [
      "ethiopia",
      "addis abeba",
      "addis ababa",
      "amhara",
      "tigray",
      "oromia",
      "afar",
      "abiy",
      "birr",
      "ethiopian",
      "ኢትዮጵያ",
      "አዲስ አበባ",
      "አማራ",
      "ትግራይ",
      "ኦሮሚያ",
      "አቢይ",
      "ኤርትራ"
    ],
    sources: [
      {
        label: "Ethiopia-focused reporting",
        feedUrl: buildGoogleNewsSearchUrl(
          '(Ethiopia OR "Addis Ababa" OR "Addis Abeba") (site:addisstandard.com OR site:thereporterethiopia.com OR site:ethiopianmonitor.com OR site:bbc.com OR site:aljazeera.com OR site:reuters.com OR site:apnews.com)'
        )
      },
      {
        label: "Addis Standard direct wire",
        feedUrl: "https://addisstandard.com/feed/",
        fallbackSource: "Addis Standard"
      },
      {
        label: "BBC Amharic",
        feedUrl: "https://feeds.bbci.co.uk/amharic/rss.xml",
        fallbackSource: "BBC Amharic"
      }
    ]
  },
  {
    key: "eastafrica",
    category: "East Africa",
    priority: 4,
    keywords: [
      "east africa",
      "horn of africa",
      "kenya",
      "somalia",
      "somaliland",
      "eritrea",
      "sudan",
      "south sudan",
      "djibouti",
      "uganda",
      "tanzania",
      "rwanda",
      "nairobi",
      "mogadishu",
      "asmara",
      "khartoum"
    ],
    sources: [
      {
        label: "East Africa & Horn coverage",
        feedUrl: buildGoogleNewsSearchUrl(
          '(Kenya OR Somalia OR Eritrea OR Sudan OR "South Sudan" OR Djibouti OR Uganda OR Tanzania OR Rwanda OR "Horn of Africa" OR "East Africa") (site:theeastafrican.co.ke OR site:nation.africa OR site:bbc.com OR site:aljazeera.com OR site:garoweonline.com OR site:sudantribune.com OR site:reuters.com)'
        )
      },
      {
        label: "BBC Africa direct wire",
        feedUrl: "https://feeds.bbci.co.uk/news/world/africa/rss.xml",
        fallbackSource: "BBC Africa"
      }
    ]
  },
  {
    key: "diaspora",
    category: "Diaspora & Immigration",
    priority: 3,
    keywords: [
      "immigration",
      "visa",
      "green card",
      "asylum",
      "uscis",
      "dhs",
      "refugee",
      "diaspora",
      "habesha",
      "ethiopian american",
      "eritrean american",
      "remittance"
    ],
    sources: [
      {
        label: "Official immigration updates",
        feedUrl: buildGoogleNewsSearchUrl(
          '(immigration OR visa OR "green card" OR asylum OR refugee) (site:uscis.gov OR site:dhs.gov OR site:state.gov)'
        )
      },
      {
        label: "Habesha diaspora stories",
        feedUrl: buildGoogleNewsSearchUrl(
          '("Ethiopian diaspora" OR "Eritrean diaspora" OR "Ethiopian community" OR "Eritrean community" OR Habesha) (site:apnews.com OR site:reuters.com OR site:npr.org OR site:bbc.com OR site:theguardian.com)'
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
    .replace(/&nbsp;|&#160;/gi, " ")
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

function parseRssItems(xml: string, fallbackSource?: string): ParsedRssItem[] {
  const itemMatches = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];

  return itemMatches.map((item, index) => ({
    title: getTagValue(item, "title") || `News story ${index + 1}`,
    link: getTagValue(item, "link"),
    pubDate: getTagValue(item, "pubDate"),
    description: getTagValue(item, "description"),
    source: getTagValue(item, "source") || fallbackSource || "News",
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

function createStableHash(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

function isFreshStory(item: WorldNewsItem) {
  const publishedAt = new Date(item.publishedAt).getTime();
  return Number.isFinite(publishedAt) && Date.now() - publishedAt <= MAX_STORY_AGE_MS;
}

function matchesLane(item: WorldNewsItem, lane: LaneDefinition) {
  const haystack = `${item.headline} ${item.summary}`.toLowerCase();
  return lane.keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
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
      try {
        const response = await fetch(source.feedUrl, {
          headers: {
            Accept: "application/rss+xml, application/xml, text/xml;q=0.9"
          },
          cache: "no-store",
          signal: AbortSignal.timeout(SOURCE_TIMEOUT_MS)
        });

        if (!response.ok) {
          throw new Error(`${source.label} returned ${response.status}.`);
        }

        const xml = await response.text();
        return parseRssItems(xml, source.fallbackSource).map((item) => ({ item, source }));
      } catch {
        // A single failing source should never take down the whole lane.
        return [] as { item: ParsedRssItem; source: SourceDefinition }[];
      }
    })
  );

  const seen = new Set<string>();

  return results
    .flat()
    .map(({ item }) => {
      const publishedAt = item.pubDate ? toIsoDate(item.pubDate) : new Date().toISOString();

      const worldNewsItem: WorldNewsItem = {
        id: createDeterministicId(
          `world_${lane.key}`,
          `${createStableHash(item.link || `${item.title}-${item.source}`)}-${item.title}-${item.source}`
        ),
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
    .filter((item) => isFreshStory(item) && matchesLane(item, lane))
    .sort((left, right) => rankLaneItem(right, lane) - rankLaneItem(left, lane))
    .filter((item) => {
      const key = normalizeKey(`${item.headline} ${item.link}`);
      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .slice(0, 10);
}

function buildTopStories(sections: Record<Exclude<WorldNewsSectionKey, "top">, WorldNewsItem[]>) {
  const combined = [...sections.ethiopia, ...sections.eastafrica, ...sections.diaspora];
  const seen = new Set<string>();

  return combined
    .sort((left, right) => {
      const leftAge = new Date(left.publishedAt).getTime();
      const rightAge = new Date(right.publishedAt).getTime();
      const leftPriority =
        left.section === "ethiopia" ? 3 : left.section === "eastafrica" ? 2 : 1;
      const rightPriority =
        right.section === "ethiopia" ? 3 : right.section === "eastafrica" ? 2 : 1;

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
    .slice(0, 5)
    .map((item) => ({
      ...item,
      category: "Top stories" as const,
      section: "top" as const
    }));
}

function excludeTopStoryDuplicates(items: WorldNewsItem[], topStories: WorldNewsItem[]) {
  const excluded = new Set(topStories.map((item) => normalizeKey(`${item.headline} ${item.link}`)));
  return items.filter((item) => !excluded.has(normalizeKey(`${item.headline} ${item.link}`))).slice(0, 6);
}

export async function fetchWorldNewsFeed(): Promise<WorldNewsFeedPayload> {
  const laneResponses = await Promise.all(WORLD_NEWS_LANES.map((lane) => fetchLaneStories(lane)));
  const laneMap = WORLD_NEWS_LANES.reduce<Record<Exclude<WorldNewsSectionKey, "top">, WorldNewsItem[]>>(
    (accumulator, lane, index) => {
      accumulator[lane.key] = laneResponses[index];
      return accumulator;
    },
    {
      ethiopia: [],
      eastafrica: [],
      diaspora: []
    }
  );

  const topStories = buildTopStories(laneMap);

  return {
    topStories,
    ethiopia: excludeTopStoryDuplicates(laneMap.ethiopia, topStories),
    eastafrica: excludeTopStoryDuplicates(laneMap.eastafrica, topStories),
    diaspora: excludeTopStoryDuplicates(laneMap.diaspora, topStories),
    sourceLabels: WORLD_NEWS_LANES.flatMap((lane) => lane.sources.map((source) => source.label)),
    fetchedAt: new Date().toISOString(),
    stale: false,
    message: topStories.length
      ? undefined
      : "News is temporarily quiet while the source lanes refresh."
  };
}
