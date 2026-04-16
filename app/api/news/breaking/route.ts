import { NextRequest, NextResponse } from "next/server";
import {
  BreakingFeedPayload,
  fetchBreakingNewsFromRss,
  getBreakingNewsFeedUrl
} from "@/services/breaking-news-service";
import { FootballTeam } from "@/types";

export const dynamic = "force-dynamic";

let lastSuccessfulPayload: BreakingFeedPayload | null = null;
let lastFetchedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

const supportedTeams = new Set<FootballTeam>([
  "Manchester United",
  "Arsenal",
  "Chelsea",
  "Manchester City"
]);

function getTeamFilter(request: NextRequest) {
  const team = request.nextUrl.searchParams.get("team");
  return team && supportedTeams.has(team as FootballTeam) ? (team as FootballTeam) : undefined;
}

export async function GET(request: NextRequest) {
  const team = getTeamFilter(request);
  const now = Date.now();

  if (lastSuccessfulPayload && now - lastFetchedAt < CACHE_TTL_MS) {
    return NextResponse.json({
      ...lastSuccessfulPayload,
      items: team
        ? lastSuccessfulPayload.items.filter((item) => item.team === team || !item.team)
        : lastSuccessfulPayload.items
    } satisfies BreakingFeedPayload);
  }

  try {
    const items = await fetchBreakingNewsFromRss();

    const payload: BreakingFeedPayload = {
      items,
      source: getBreakingNewsFeedUrl(),
      stale: false,
      fetchedAt: new Date().toISOString(),
      message: items.length
        ? undefined
        : team
          ? `No ${team} breaking stories are available right now.`
          : "No breaking football stories are available right now."
    };

    lastSuccessfulPayload = payload;
    lastFetchedAt = now;

    return NextResponse.json({
      ...payload,
      items: team ? payload.items.filter((item) => item.team === team || !item.team) : payload.items
    } satisfies BreakingFeedPayload);
  } catch (error) {
    if (lastSuccessfulPayload) {
      return NextResponse.json({
        ...lastSuccessfulPayload,
        items: team
          ? lastSuccessfulPayload.items.filter((item) => item.team === team || !item.team)
          : lastSuccessfulPayload.items,
        stale: true,
        message: "Using the last successful breaking feed update while the news provider recovers."
      } satisfies BreakingFeedPayload);
    }

    return NextResponse.json({
      items: [],
      source: getBreakingNewsFeedUrl(),
      stale: true,
      fetchedAt: new Date().toISOString(),
      message:
        error instanceof Error
          ? `Live breaking news is temporarily unavailable. ${error.message}`
          : "Live breaking news is temporarily unavailable."
    } satisfies BreakingFeedPayload);
  }
}
