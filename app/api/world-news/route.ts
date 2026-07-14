import { NextResponse } from "next/server";
import { fetchWorldNewsFeed, WorldNewsFeedPayload } from "@/services/world-news-service";

export const dynamic = "force-dynamic";

let lastSuccessfulPayload: WorldNewsFeedPayload | null = null;
let lastFetchedAt = 0;

// Short TTL so fresh stories surface within ~90 seconds of publication.
const CACHE_TTL_MS = 90 * 1000;

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
        message: "Showing the most recent news snapshot while source feeds recover."
      } satisfies WorldNewsFeedPayload);
    }

    return NextResponse.json({
      topStories: [],
      ethiopia: [],
      eastafrica: [],
      diaspora: [],
      sourceLabels: [],
      fetchedAt: new Date().toISOString(),
      stale: true,
      message:
        error instanceof Error
          ? `News is temporarily unavailable. ${error.message}`
          : "News is temporarily unavailable."
    } satisfies WorldNewsFeedPayload);
  }
}
