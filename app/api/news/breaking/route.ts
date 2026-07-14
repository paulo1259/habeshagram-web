import { NextResponse } from "next/server";
import {
  BreakingFeedPayload,
  fetchBreakingNewsFromRss,
  getBreakingNewsFeedUrl
} from "@/services/breaking-news-service";

export const dynamic = "force-dynamic";

let lastSuccessfulPayload: BreakingFeedPayload | null = null;
let lastFetchedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function GET() {
  const now = Date.now();

  if (lastSuccessfulPayload && now - lastFetchedAt < CACHE_TTL_MS) {
    return NextResponse.json(lastSuccessfulPayload satisfies BreakingFeedPayload);
  }

  try {
    const items = await fetchBreakingNewsFromRss();

    const payload: BreakingFeedPayload = {
      items,
      source: getBreakingNewsFeedUrl(),
      stale: false,
      fetchedAt: new Date().toISOString(),
      message: items.length ? undefined : "No breaking stories are available right now."
    };

    lastSuccessfulPayload = payload;
    lastFetchedAt = now;
    return NextResponse.json(payload satisfies BreakingFeedPayload);
  } catch (error) {
    if (lastSuccessfulPayload) {
      return NextResponse.json({
        ...lastSuccessfulPayload,
        stale: true,
        message: "Showing the most recent breaking-news snapshot while the source feed recovers."
      } satisfies BreakingFeedPayload);
    }

    return NextResponse.json({
      items: [],
      source: getBreakingNewsFeedUrl(),
      stale: true,
      fetchedAt: new Date().toISOString(),
      message:
        error instanceof Error
          ? `Breaking news is temporarily unavailable. ${error.message}`
          : "Breaking news is temporarily unavailable."
    } satisfies BreakingFeedPayload);
  }
}
