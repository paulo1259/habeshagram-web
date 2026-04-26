import { NextResponse } from "next/server";
import { fetchWorldNewsFeed, WorldNewsFeedPayload } from "@/services/world-news-service";

export const dynamic = "force-dynamic";

let lastSuccessfulPayload: WorldNewsFeedPayload | null = null;
let lastFetchedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function GET() {
  const now = Date.now();

  if (lastSuccessfulPayload && now - lastFetchedAt < CACHE_TTL_MS) {
    return NextResponse.json(lastSuccessfulPayload satisfies WorldNewsFeedPayload);
  }

  try {
    const payload = await fetchWorldNewsFeed();
    lastSuccessfulPayload = payload;
    lastFetchedAt = now;
    return NextResponse.json(payload satisfies WorldNewsFeedPayload);
  } catch (error) {
    if (lastSuccessfulPayload) {
      return NextResponse.json({
        ...lastSuccessfulPayload,
        stale: true,
        message: "Showing the most recent world-news snapshot while source feeds recover."
      } satisfies WorldNewsFeedPayload);
    }

    return NextResponse.json({
      topStories: [],
      us: [],
      ethiopia: [],
      immigration: [],
      sourceLabels: [],
      fetchedAt: new Date().toISOString(),
      stale: true,
      message:
        error instanceof Error
          ? `World News is temporarily unavailable. ${error.message}`
          : "World News is temporarily unavailable."
    } satisfies WorldNewsFeedPayload);
  }
}
