import { LeagueStandingRow } from "@/types";

export type StandingsFeed = {
  standings: LeagueStandingRow[];
  source: "api" | "cache" | "empty";
  stale: boolean;
  fetchedAt: string;
  message?: string;
};

let standingsCache: LeagueStandingRow[] = [];

export async function fetchStandings(): Promise<StandingsFeed> {
  try {
    const response = await fetch("/api/football/standings", {
      method: "GET",
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Unable to fetch standings (${response.status}).`);
    }

    const payload = (await response.json()) as StandingsFeed;
    if (payload.standings?.length) {
      standingsCache = payload.standings;
    }
    return payload;
  } catch (error) {
    return {
      standings: standingsCache,
      source: "cache",
      stale: true,
      fetchedAt: new Date().toISOString(),
      message:
        error instanceof Error
          ? `Using the last successful table for now. ${error.message}`
          : "Using the last successful table for now."
    };
  }
}
