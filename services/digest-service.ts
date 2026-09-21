import { createHash } from "node:crypto";
import { unstable_cache } from "next/cache";
import { generateAiJson, getConfiguredAiProvider } from "@/services/ai-service";
import { fetchWorldNewsFeed } from "@/services/world-news-service";
import type { WorldNewsDigestPayload } from "@/services/ai-digest-client-service";
import type { WorldNewsItem } from "@/types";

/**
 * The daily brief, shared by the text route and the audio route.
 *
 * Generation is cached in Vercel's Data Cache, keyed by the exact set of
 * stories and the language. That cache is shared by every server instance,
 * which matters: the audio route has to speak the *same* brief the reader is
 * looking at, not a second, slightly different one written by another
 * instance a few seconds later.
 */

export type DigestLang = "en" | "am";

type DigestAiResponse = {
  headline: string;
  paragraphs: string[];
  stories: Array<{ id: string; whyItMatters: string }>;
};

const DIGEST_RESPONSE_SCHEMA: Record<string, unknown> = {
  type: "object",
  additionalProperties: false,
  properties: {
    headline: {
      type: "string",
      description: "A neutral East Africa briefing headline with no more than nine words."
    },
    paragraphs: {
      type: "array",
      minItems: 2,
      maxItems: 3,
      items: {
        type: "string",
        description: "A short spoken-news paragraph with no more than 60 words."
      }
    },
    stories: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: {
            type: "string",
            description: "An exact story id supplied in the prompt."
          },
          whyItMatters: {
            type: "string",
            description: "A neutral explanation of relevance to Habesha diaspora readers, no more than 28 words."
          }
        },
        required: ["id", "whyItMatters"]
      }
    }
  },
  required: ["headline", "paragraphs", "stories"]
};

// Refreshes a few times a day, and immediately when the story mix changes.
const DIGEST_TTL_SECONDS = 3 * 60 * 60;

const LANGUAGE_RULES: Record<DigestLang, string> = {
  en: "Write everything in clear, simple English.",
  am: [
    "Write the headline, paragraphs and every whyItMatters line in Amharic, using Ethiopic (Ge'ez) script.",
    "Use natural, modern Amharic as a news presenter would speak it — not a word-for-word translation.",
    "Keep names of people, places and organisations recognisable; you may keep widely used English acronyms such as UN or US."
  ].join(" ")
};

function selectStories(feed: Awaited<ReturnType<typeof fetchWorldNewsFeed>>): WorldNewsItem[] {
  const stories = [
    ...feed.topStories,
    ...feed.ethiopia.slice(0, 3),
    ...feed.eastafrica.slice(0, 3),
    ...feed.diaspora.slice(0, 2)
  ];
  const seen = new Set<string>();
  return stories.filter((story) => {
    if (seen.has(story.id)) return false;
    seen.add(story.id);
    return true;
  });
}

type StoryInput = Pick<WorldNewsItem, "id" | "category" | "source" | "publishLabel" | "headline" | "summary">;

async function writeDigest(stories: StoryInput[], lang: DigestLang): Promise<WorldNewsDigestPayload> {
  const storyList = stories
    .map(
      (story, index) =>
        `${index + 1}. [id: ${story.id}] (${story.category} — ${story.source}, ${story.publishLabel}) ${story.headline}\n   ${story.summary}`
    )
    .join("\n");

  const ai = await generateAiJson<DigestAiResponse>({
    system: [
      "You are the news editor for Zema, a radio and news app for the Ethiopian and Eritrean diaspora.",
      "You write warm, clear, neutral news briefings centered on Ethiopia and East Africa.",
      "Never invent facts that are not in the provided stories. Never editorialize on politics.",
      LANGUAGE_RULES[lang],
      "Respond with STRICT JSON only — no markdown, no code fences, no commentary."
    ].join(" "),
    prompt: [
      "Here are today's stories from the live news lanes:",
      "",
      storyList,
      "",
      "Produce JSON with exactly this shape:",
      '{ "headline": string, "paragraphs": string[], "stories": [{ "id": string, "whyItMatters": string }] }',
      "",
      "- headline: a short, punchy title for today's East Africa briefing (max 9 words, no date).",
      "- paragraphs: 2-3 short paragraphs (max 60 words each) that read as a spoken 60-second briefing covering the most important themes across the stories.",
      '- stories: for EVERY story id listed above, one "whyItMatters" line (max 28 words) explaining in plain language why this matters to Habesha diaspora readers. Keep the exact ids.'
    ].join("\n"),
    maxTokens: lang === "am" ? 3600 : 2400,
    responseSchema: DIGEST_RESPONSE_SCHEMA
  });

  const validStoryIds = new Set(stories.map((story) => story.id));
  const storySummaries: Record<string, string> = {};
  (ai.stories ?? []).forEach((entry) => {
    if (entry?.id && validStoryIds.has(entry.id) && typeof entry.whyItMatters === "string" && entry.whyItMatters.trim()) {
      storySummaries[entry.id] = entry.whyItMatters.trim();
    }
  });

  const headline = typeof ai.headline === "string" && ai.headline.trim() ? ai.headline.trim() : "East Africa, briefly";
  const paragraphs = Array.isArray(ai.paragraphs)
    ? ai.paragraphs
        .filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
        .map((item) => item.trim())
        .slice(0, 3)
    : [];

  return {
    aiConfigured: true,
    provider: getConfiguredAiProvider() ?? undefined,
    lang,
    headline,
    paragraphs,
    storySummaries,
    storyCount: stories.length,
    generatedAt: new Date().toISOString(),
    stale: false,
    // Identifies this exact text, so the audio for it can be cached forever.
    version: createHash("sha256")
      .update(`${lang}\n${headline}\n${paragraphs.join("\n")}`)
      .digest("hex")
      .slice(0, 16)
  };
}

const cachedWriteDigest = (storyKey: string, stories: StoryInput[], lang: DigestLang) =>
  unstable_cache(() => writeDigest(stories, lang), ["world-news-digest", "v2", lang, storyKey], {
    revalidate: DIGEST_TTL_SECONDS
  })();

export async function getDigest(lang: DigestLang): Promise<WorldNewsDigestPayload> {
  const feed = await fetchWorldNewsFeed();
  const stories = selectStories(feed);

  if (!stories.length) {
    return {
      aiConfigured: true,
      provider: getConfiguredAiProvider() ?? undefined,
      lang,
      message: "No fresh stories are available to summarize right now."
    };
  }

  const storyKey = createHash("sha256")
    .update(stories.map((story) => story.id).sort().join("|"))
    .digest("hex")
    .slice(0, 24);

  const input: StoryInput[] = stories.map(({ id, category, source, publishLabel, headline, summary }) => ({
    id,
    category,
    source,
    publishLabel,
    headline,
    summary
  }));

  return cachedWriteDigest(storyKey, input, lang);
}

export function parseDigestLang(value: string | null): DigestLang {
  return value === "am" ? "am" : "en";
}
