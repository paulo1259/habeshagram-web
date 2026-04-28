import { NextRequest, NextResponse } from "next/server";
import { fetchApiBasketballJson, getApiBasketballConfig, getDefaultBasketballSeason } from "@/lib/api-basketball";
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

function shiftDateString(baseDate: string, dayOffset: number) {
  const next = new Date(`${baseDate}T12:00:00.000Z`);
  next.setUTCDate(next.getUTCDate() + dayOffset);
  return next.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  const { apiKey } = getApiBasketballConfig();
  const searchParams = request.nextUrl.searchParams;
  const season = Number.parseInt(searchParams.get("season")?.trim() || `${getDefaultBasketballSeason()}`, 10);
  const date = searchParams.get("date")?.trim() || getTodayDateString();

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
    const payload = await fetchApiBasketballJson<ApiBasketballPayload<ApiBasketballGame>>("/games", {
      start_date: shiftDateString(date, -1),
      end_date: shiftDateString(date, 1),
      seasons: season,
      per_page: 100
    });

    const mergedGames = extractApiBasketballResponse(payload);

    const dedupedGames = Array.from(
      new Map(
        mergedGames.map((game) => [
          String(
            game.id ??
              `${game.home_team?.full_name ?? game.home_team?.name}-${game.visitor_team?.full_name ?? game.visitor_team?.name}-${game.datetime ?? game.date ?? ""}`
          ),
          game
        ])
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
      message: mapped.length ? undefined : "No live, upcoming, or recent basketball games are available right now."
    };

    lastSuccessfulPayload = nextPayload;
    return NextResponse.json(nextPayload);
  } catch (error) {
    if (lastSuccessfulPayload) {
      return NextResponse.json({
        ...lastSuccessfulPayload,
        source: "cache",
        stale: true,
        message: "Using the last successful basketball live snapshot while BALldontlie recovers."
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
