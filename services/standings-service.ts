import { LeagueStandingRow } from "@/types";

export type StandingsFeed = {
  standings: LeagueStandingRow[];
  source: "api" | "cache" | "fallback";
  stale: boolean;
  fetchedAt: string;
  message?: string;
};

const fallbackStandings: LeagueStandingRow[] = [
  { position: 1, team: "Arsenal", teamTag: "Arsenal", tracked: true, played: 31, points: 71, goalDifference: 35 },
  { position: 2, team: "Manchester City", teamTag: "Manchester City", tracked: true, played: 31, points: 69, goalDifference: 31 },
  { position: 3, team: "Liverpool", played: 31, points: 67, goalDifference: 28 },
  { position: 4, team: "Chelsea", teamTag: "Chelsea", tracked: true, played: 31, points: 61, goalDifference: 18 },
  { position: 5, team: "Newcastle United", played: 31, points: 57, goalDifference: 14 },
  { position: 6, team: "Manchester United", teamTag: "Manchester United", tracked: true, played: 31, points: 54, goalDifference: 4 }
];

let standingsCache = fallbackStandings;

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
