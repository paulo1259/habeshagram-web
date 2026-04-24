import { NextResponse } from "next/server";
import { LiveMatchFeed } from "@/services/live-match-service";
import { fetchSportmonksLiveCoverage } from "@/services/sportmonks-football-service";

export const dynamic = "force-dynamic";

let lastSuccessfulPayload: LiveMatchFeed | null = null;

export async function GET() {
  const apiToken = process.env.SPORTMONKS_API_TOKEN?.trim();

  if (!apiToken) {
    return NextResponse.json({
      matches: [],
      source: "empty",
      stale: true,
      fetchedAt: new Date().toISOString(),
      message: "Sportmonks live football data is not configured on the server yet."
    } satisfies LiveMatchFeed);
  }

  try {
    const { matches, diagnostics } = await fetchSportmonksLiveCoverage();

    const payload: LiveMatchFeed = {
      matches,
      source: "api",
      stale: false,
      fetchedAt: new Date().toISOString(),
      message: matches.length
        ? `Sportmonks coverage: ${diagnostics.liveCount} live, ${diagnostics.windowCount} nearby tracked-club fixtures.`
        : "No live or nearby tracked-club matches are available right now."
    };

    lastSuccessfulPayload = payload;
    return NextResponse.json(payload);
  } catch (error) {
    if (lastSuccessfulPayload) {
      return NextResponse.json({
        ...lastSuccessfulPayload,
        source: "cache",
        stale: true,
        message: "Using the last successful Sportmonks live snapshot while the provider recovers."
      } satisfies LiveMatchFeed);
    }

    return NextResponse.json({
      matches: [],
      source: "empty",
      stale: true,
      fetchedAt: new Date().toISOString(),
      message:
        error instanceof Error
          ? `Live football data is temporarily unavailable. ${error.message}`
          : "Live football data is temporarily unavailable."
    } satisfies LiveMatchFeed);
  }
}
