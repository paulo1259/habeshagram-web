import { NextRequest, NextResponse } from "next/server";
import { fetchApiBasketballJson, getApiBasketballConfig } from "@/lib/api-basketball";
import {
  ApiBasketballPayload,
  ApiBasketballStanding,
  BasketballStandingsFeed,
  extractApiBasketballResponse,
  mapApiBasketballStandingToRow
} from "@/services/basketball-service";
import { LeagueStandingRow } from "@/types";

export const dynamic = "force-dynamic";

let lastSuccessfulPayload: BasketballStandingsFeed | null = null;

export async function GET(request: NextRequest) {
  const { apiKey, defaultLeagueId } = getApiBasketballConfig();
  const searchParams = request.nextUrl.searchParams;
  const league = searchParams.get("league")?.trim() || defaultLeagueId;
  const season = searchParams.get("season")?.trim() || new Date().getFullYear().toString();

  if (!apiKey) {
    return NextResponse.json({
      standings: [],
      source: "empty",
      stale: true,
      fetchedAt: new Date().toISOString(),
      message: "Basketball standings are not configured on the server yet."
    } satisfies BasketballStandingsFeed);
  }

  if (!league) {
    return NextResponse.json({
      standings: [],
      source: "empty",
      stale: true,
      fetchedAt: new Date().toISOString(),
      message: "Add a league query param or API_BASKETBALL_DEFAULT_LEAGUE_ID to load basketball standings."
    } satisfies BasketballStandingsFeed);
  }

  try {
    const payload = await fetchApiBasketballJson<ApiBasketballPayload<ApiBasketballStanding>>("/standings", {
      league,
      season
    });

    const standings = extractApiBasketballResponse(payload)
      .map((row) => mapApiBasketballStandingToRow(row))
      .filter((row): row is LeagueStandingRow => Boolean(row));

    const nextPayload: BasketballStandingsFeed = {
      standings,
      source: "api",
      stale: false,
      fetchedAt: new Date().toISOString(),
      message: standings.length ? undefined : `No standings rows are available right now for league ${league}.`
    };

    lastSuccessfulPayload = nextPayload;
    return NextResponse.json(nextPayload);
  } catch (error) {
    if (lastSuccessfulPayload) {
      return NextResponse.json({
        ...lastSuccessfulPayload,
        source: "cache",
        stale: true,
        message: "Using the last successful basketball table while API-Basketball recovers."
      } satisfies BasketballStandingsFeed);
    }

    return NextResponse.json({
      standings: [],
      source: "empty",
      stale: true,
      fetchedAt: new Date().toISOString(),
      message:
        error instanceof Error
          ? `Basketball standings are temporarily unavailable. ${error.message}`
          : "Basketball standings are temporarily unavailable."
    } satisfies BasketballStandingsFeed);
  }
}
