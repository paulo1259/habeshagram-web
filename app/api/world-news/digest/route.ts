import { NextResponse } from "next/server";
import { generateAiJson, getConfiguredAiProvider } from "@/services/ai-service";
import { fetchWorldNewsFeed } from "@/services/world-news-service";
import type { WorldNewsDigestPayload } from "@/services/ai-digest-client-service";
import type { WorldNewsItem } from "@/types";

export const dynamic = "force-dynamic";


type DigestAiResponse = {
  headline: string;
  paragraphs: string[];
  stories: Array<{ id: string; whyItMatters: string }>;
};

// A "daily" digest that refreshes a few times a day, and immediately when the
// top-story mix changes meaningfully.
const DIGEST_TTL_MS = 3 * 60 * 60 * 1000;

let cachedPayload: WorldNewsDigestPayload | null = null;
let cachedAt = 0;
let cachedStoryKey = "";
let inflight: Promise<WorldNewsDigestPayload> | null = null;

function buildStoryKey(stories: WorldNewsItem[]) {
  return stories
    .map((story) => story.id)
    .sort()
    .join("|");
}

async function buildDigest(): Promise<WorldNewsDigestPayload> {
  const feed = await fetchWorldNewsFeed();
  const stories = [
    ...feed.topStories,
    ...feed.ethiopia.slice(0, 3),
    ...feed.eastafrica.slice(0, 3),
    ...feed.diaspora.slice(0, 2)
  ];

  // Deduplicate by id while keeping order.
  const seen = new Set<string>();
  const uniqueStories = stories.filter((story) => {
    if (seen.has(story.id)) {
      return false;
    }
    seen.add(story.id);
    return true;
  });

  if (!uniqueStories.length) {
    return {
      aiConfigured: true,
      provider: getConfiguredAiProvider() ?? undefined,
      message: "No fresh stories are available to summarize right now."
    };
  }

  const storyKey = buildStoryKey(uniqueStories);

  if (cachedPayload && cachedStoryKey === storyKey && Date.now() - cachedAt < DIGEST_TTL_MS) {
    return cachedPayload;
  }

  const storyList = uniqueStories
    .map(
      (story, index) =>
        `${index + 1}. [id: ${story.id}] (${story.category} — ${story.source}, ${story.publishLabel}) ${story.headline}\n   ${story.summary}`
    )
    .join("\n");

  const ai = await generateAiJson<DigestAiResponse>({
    system: [
      "You are the news editor for HabeshaGram, a social app for the Ethiopian and Eritrean diaspora.",
      "You write warm, clear, neutral news briefings centered on Ethiopia and East Africa.",
      "Never invent facts that are not in the provided stories. Never editorialize on politics.",
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
    ].join("\n")
  });

  const storySummaries: Record<string, string> = {};
  (ai.stories ?? []).forEach((entry) => {
    if (entry?.id && typeof entry.whyItMatters === "string" && entry.whyItMatters.trim()) {
      storySummaries[entry.id] = entry.whyItMatters.trim();
    }
  });

  const payload: WorldNewsDigestPayload = {
    aiConfigured: true,
    provider: getConfiguredAiProvider() ?? undefined,
    headline: typeof ai.headline === "string" ? ai.headline.trim() : "East Africa, briefly",
    paragraphs: Array.isArray(ai.paragraphs)
      ? ai.paragraphs.filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
      : [],
    storySummaries,
    storyCount: uniqueStories.length,
    generatedAt: new Date().toISOString(),
    stale: false
  };

  cachedPayload = payload;
  cachedAt = Date.now();
  cachedStoryKey = storyKey;

  return payload;
}

export async function GET() {
  if (!getConfiguredAiProvider()) {
    return NextResponse.json({
      aiConfigured: false,
      message:
        "AI digest is not configured yet. Add ANTHROPIC_API_KEY or GEMINI_API_KEY to .env.local and restart the dev server."
    } satisfies WorldNewsDigestPayload);
  }

  try {
    if (!inflight) {
      inflight = buildDigest().finally(() => {
        inflight = null;
      });
    }

    const payload = await inflight;
    return NextResponse.json(payload satisfies WorldNewsDigestPayload);
  } catch (error) {
    if (cachedPayload) {
      return NextResponse.json({
        ...cachedPayload,
        stale: true,
        message: "Showing the most recent AI digest while a fresh one is prepared."
      } satisfies WorldNewsDigestPayload);
    }

    const rawMessage = error instanceof Error ? error.message : "";
    let friendly = "The AI digest is temporarily unavailable. It will retry automatically.";

    if (rawMessage.includes("429") || /credit|quota|billing|rate/i.test(rawMessage)) {
      friendly =
        "The AI provider rejected the request (out of credits or rate-limited). Check your API key's billing or quota, then reload.";
    } else if (rawMessage.includes("401") || rawMessage.includes("403")) {
      friendly = "The AI API key was rejected. Double-check the key in .env.local and restart the dev server.";
    }

    const detail =
      process.env.NODE_ENV === "development" && rawMessage ? ` [dev detail: ${rawMessage.slice(0, 300)}]` : "";

    return NextResponse.json({
      aiConfigured: true,
      provider: getConfiguredAiProvider() ?? undefined,
      stale: true,
      message: `${friendly}${detail}`
    } satisfies WorldNewsDigestPayload);
  }
}
