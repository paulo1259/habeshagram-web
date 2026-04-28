import { NextRequest, NextResponse } from "next/server";
import { fetchApiBasketballJson, getApiBasketballConfig, getDefaultBasketballSeason } from "@/lib/api-basketball";
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
  const { apiKey } = getApiBasketballConfig();
  const searchParams = request.nextUrl.searchParams;
  const season = Number.parseInt(searchParams.get("season")?.trim() || `${getDefaultBasketballSeason()}`, 10);

  if (!apiKey) {
    return NextResponse.json({
      standings: [],
      source: "empty",
      stale: true,
      fetchedAt: new Date().toISOString(),
      message: "Basketball standings are not configured on the server yet."
    } satisfies BasketballStandingsFeed);
  }

  try {
    const payload = await fetchApiBasketballJson<ApiBasketballPayload<ApiBasketballStanding>>("/standings", {
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
      message: standings.length ? undefined : "No standings rows are available right now."
    };

    lastSuccessfulPayload = nextPayload;
    return NextResponse.json(nextPayload);
  } catch (error) {
    if (error instanceof Error && error.message.includes("401")) {
      return NextResponse.json({
        standings: lastSuccessfulPayload?.standings ?? [],
        source: lastSuccessfulPayload ? "cache" : "empty",
        stale: true,
        fetchedAt: new Date().toISOString(),
        message: "Your current BALldontlie NBA plan does not include standings access yet."
      } satisfies BasketballStandingsFeed);
    }

    if (lastSuccessfulPayload) {
      return NextResponse.json({
        ...lastSuccessfulPayload,
        source: "cache",
        stale: true,
        message: "Using the last successful basketball table while BALldontlie recovers."
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
