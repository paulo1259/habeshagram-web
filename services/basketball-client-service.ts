import { LeagueStandingRow } from "@/types";
import { BasketballLiveFeed, BasketballLiveMatch, BasketballStandingsFeed } from "@/services/basketball-service";

let basketballMatchesCache: BasketballLiveMatch[] = [];
let basketballStandingsCache: LeagueStandingRow[] = [];
let lastLivePayload: BasketballLiveFeed | null = null;
let lastStandingsPayload: BasketballStandingsFeed | null = null;
let liveRequest: Promise<BasketballLiveFeed> | null = null;
let standingsRequest: Promise<BasketballStandingsFeed> | null = null;
let liveFetchedAt = 0;
let standingsFetchedAt = 0;
const BASKETBALL_CACHE_WINDOW_MS = 25_000;

export async function fetchBasketballLive(): Promise<BasketballLiveFeed> {
  if (lastLivePayload && Date.now() - liveFetchedAt < BASKETBALL_CACHE_WINDOW_MS) {
    return lastLivePayload;
  }

  if (liveRequest) {
    return liveRequest;
  }

  try {
    liveRequest = (async () => {
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
      lastLivePayload = payload;
      liveFetchedAt = Date.now();
      return payload;
    })();

    return await liveRequest;
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
  } finally {
    liveRequest = null;
  }
}

export async function fetchBasketballStandings(): Promise<BasketballStandingsFeed> {
  if (lastStandingsPayload && Date.now() - standingsFetchedAt < BASKETBALL_CACHE_WINDOW_MS) {
    return lastStandingsPayload;
  }

  if (standingsRequest) {
    return standingsRequest;
  }

  try {
    standingsRequest = (async () => {
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
      lastStandingsPayload = payload;
      standingsFetchedAt = Date.now();
      return payload;
    })();

    return await standingsRequest;
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
  } finally {
    standingsRequest = null;
  }
}
