import { LeagueStandingRow } from "@/types";
import { BasketballLiveFeed, BasketballLiveMatch, BasketballStandingsFeed } from "@/services/basketball-service";

let basketballMatchesCache: BasketballLiveMatch[] = [];
let basketballStandingsCache: LeagueStandingRow[] = [];

export async function fetchBasketballLive(): Promise<BasketballLiveFeed> {
  try {
    const response = await fetch("/api/basketball/live", {
      method: "GET",
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Unable to fetch basketball games (${response.status}).`);
    }

    const payload = (await response.json()) as BasketballLiveFeed;
    if (payload.matches?.length) {
      basketballMatchesCache = payload.matches;
    }
    return payload;
  } catch (error) {
    return {
      matches: basketballMatchesCache,
      source: "cache",
      stale: true,
      fetchedAt: new Date().toISOString(),
      message:
        basketballMatchesCache.length
          ? error instanceof Error
            ? `Using the last successful basketball scoreboard for now. ${error.message}`
            : "Using the last successful basketball scoreboard for now."
          : error instanceof Error
            ? `Basketball live data is temporarily unavailable. ${error.message}`
            : "Basketball live data is temporarily unavailable."
    };
  }
}

export async function fetchBasketballStandings(): Promise<BasketballStandingsFeed> {
  try {
    const response = await fetch("/api/basketball/standings", {
      method: "GET",
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Unable to fetch basketball standings (${response.status}).`);
    }

    const payload = (await response.json()) as BasketballStandingsFeed;
    if (payload.standings?.length) {
      basketballStandingsCache = payload.standings;
    }
    return payload;
  } catch (error) {
    return {
      standings: basketballStandingsCache,
      source: "cache",
      stale: true,
      fetchedAt: new Date().toISOString(),
      message:
        basketballStandingsCache.length
          ? error instanceof Error
            ? `Using the last successful basketball table for now. ${error.message}`
            : "Using the last successful basketball table for now."
          : error instanceof Error
            ? `Basketball standings are temporarily unavailable. ${error.message}`
            : "Basketball standings are temporarily unavailable."
    };
  }
}
