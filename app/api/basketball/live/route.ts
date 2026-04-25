import { NextRequest, NextResponse } from "next/server";
import { fetchApiBasketballJson, getApiBasketballConfig } from "@/lib/api-basketball";
import {
  ApiBasketballGame,
  ApiBasketballPayload,
  BasketballLiveFeed,
  extractApiBasketballResponse,
  mapApiBasketballGameToLiveMatch,
  prioritizeBasketballMatches
} from "@/services/basketball-service";

export const dynamic = "force-dynamic";

let lastSuccessfulPayload: BasketballLiveFeed | null = null;

function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  const { apiKey, defaultLeagueId } = getApiBasketballConfig();
  const searchParams = request.nextUrl.searchParams;
  const league = searchParams.get("league")?.trim() || defaultLeagueId;
  const season = searchParams.get("season")?.trim() || new Date().getFullYear().toString();
  const date = searchParams.get("date")?.trim() || getTodayDateString();
  const timezone = searchParams.get("timezone")?.trim() || "America/Los_Angeles";

  if (!apiKey) {
    return NextResponse.json({
      matches: [],
      source: "empty",
      stale: true,
      fetchedAt: new Date().toISOString(),
      message: "Basketball live data is not configured on the server yet."
    } satisfies BasketballLiveFeed);
  }

  try {
    const [scoreboardPayload, schedulePayload] = await Promise.all([
      fetchApiBasketballJson<ApiBasketballPayload<ApiBasketballGame>>("/scoreboard", {
        date,
        season,
        league,
        timezone
      }),
      fetchApiBasketballJson<ApiBasketballPayload<ApiBasketballGame>>("/nbaschedule", {
        date,
        season,
        league,
        timezone
      })
    ]);

    const mergedGames = [
      ...extractApiBasketballResponse(scoreboardPayload),
      ...extractApiBasketballResponse(schedulePayload)
    ];

    const dedupedGames = Array.from(
      new Map(
        mergedGames.map((game) => [String(game.id ?? `${game.teams?.home?.name ?? game.home?.name}-${game.teams?.away?.name ?? game.away?.name}-${game.date ?? game.datetime}`), game])
      ).values()
    );

    const mapped = prioritizeBasketballMatches(
      dedupedGames
        .map((game) => mapApiBasketballGameToLiveMatch(game))
        .filter((match): match is NonNullable<typeof match> => Boolean(match))
    ).slice(0, 12);

    const nextPayload: BasketballLiveFeed = {
      matches: mapped,
      source: "api",
      stale: false,
      fetchedAt: new Date().toISOString(),
      message: mapped.length
        ? undefined
        : league
          ? `No basketball games are available right now for league ${league}.`
          : "No live or scheduled basketball games are available right now."
    };

    lastSuccessfulPayload = nextPayload;
    return NextResponse.json(nextPayload);
  } catch (error) {
    if (lastSuccessfulPayload) {
      return NextResponse.json({
        ...lastSuccessfulPayload,
        source: "cache",
        stale: true,
        message: "Using the last successful basketball live snapshot while API-Basketball recovers."
      } satisfies BasketballLiveFeed);
    }

    return NextResponse.json({
      matches: [],
      source: "empty",
      stale: true,
      fetchedAt: new Date().toISOString(),
      message:
        error instanceof Error
          ? `Basketball live data is temporarily unavailable. ${error.message}`
          : "Basketball live data is temporarily unavailable."
    } satisfies BasketballLiveFeed);
  }
}
