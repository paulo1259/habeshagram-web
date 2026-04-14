import { NextResponse } from "next/server";
import { FootballTeam, LeagueStandingRow } from "@/types";

export const dynamic = "force-dynamic";

type FootballDataStandingTeam = {
  name?: string | null;
  shortName?: string | null;
  tla?: string | null;
};

type FootballDataStandingRow = {
  position?: number | null;
  playedGames?: number | null;
  points?: number | null;
  goalDifference?: number | null;
  team?: FootballDataStandingTeam | null;
};

type StandingsFeed = {
  standings: LeagueStandingRow[];
  source: "api" | "cache" | "fallback";
  stale: boolean;
  fetchedAt: string;
  message?: string;
};

const trackedTeams: Record<FootballTeam, string[]> = {
  "Manchester United": ["manchester united", "man utd", "man united"],
  Arsenal: ["arsenal"],
  Chelsea: ["chelsea"],
  "Manchester City": ["manchester city", "man city"]
};

const fallbackStandings: LeagueStandingRow[] = [
  { position: 1, team: "Arsenal", teamTag: "Arsenal", tracked: true, played: 31, points: 71, goalDifference: 35 },
  { position: 2, team: "Manchester City", teamTag: "Manchester City", tracked: true, played: 31, points: 69, goalDifference: 31 },
  { position: 3, team: "Liverpool", played: 31, points: 67, goalDifference: 28 },
  { position: 4, team: "Chelsea", teamTag: "Chelsea", tracked: true, played: 31, points: 61, goalDifference: 18 },
  { position: 5, team: "Newcastle United", played: 31, points: 57, goalDifference: 14 },
  { position: 6, team: "Manchester United", teamTag: "Manchester United", tracked: true, played: 31, points: 54, goalDifference: 4 }
];

let lastSuccessfulPayload: StandingsFeed | null = null;

function resolveTrackedTeam(...candidates: Array<string | null | undefined>) {
  for (const candidate of candidates) {
    const normalized = (candidate ?? "").toLowerCase().trim();

    if (!normalized) {
      continue;
    }

    for (const [team, aliases] of Object.entries(trackedTeams) as Array<[FootballTeam, string[]]>) {
      if (aliases.some((alias) => normalized.includes(alias) || alias.includes(normalized))) {
        return team;
      }
    }
  }

  return undefined;
}

function mapStandingRow(row: FootballDataStandingRow): LeagueStandingRow | null {
  if (!row.team?.name || typeof row.position !== "number") {
    return null;
  }

  const teamTag = resolveTrackedTeam(row.team.name, row.team.shortName, row.team.tla);

  return {
    position: row.position,
    team: row.team.shortName || row.team.name,
    teamTag,
    tracked: Boolean(teamTag),
    played: row.playedGames ?? 0,
    points: row.points ?? 0,
    goalDifference: row.goalDifference ?? 0
  };
}

export async function GET() {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY?.trim();

  if (!apiKey) {
    return NextResponse.json({
      standings: fallbackStandings,
      source: "fallback",
      stale: true,
      fetchedAt: new Date().toISOString(),
      message: "FOOTBALL_DATA_API_KEY is missing on the server, so HabeshaGram is showing fallback Premier League standings."
    } satisfies StandingsFeed);
  }

  try {
    const response = await fetch("https://api.football-data.org/v4/competitions/PL/standings", {
      headers: {
        "X-Auth-Token": apiKey
      },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`football-data.org standings returned ${response.status}.`);
    }

    const data = (await response.json()) as {
      standings?: Array<{ type?: string; table?: FootballDataStandingRow[] }>;
    };

    const table = data.standings?.find((standing) => standing.type === "TOTAL")?.table ?? [];
    const mapped = table
      .map((row) => mapStandingRow(row))
      .filter((row): row is LeagueStandingRow => Boolean(row))
      .slice(0, 8);

    const payload: StandingsFeed = {
      standings: mapped.length ? mapped : fallbackStandings,
      source: "api",
      stale: false,
      fetchedAt: new Date().toISOString(),
      message: mapped.length ? undefined : "No standings were returned, so HabeshaGram is showing the fallback table."
    };

    lastSuccessfulPayload = payload;
    return NextResponse.json(payload);
  } catch (error) {
    if (lastSuccessfulPayload) {
      return NextResponse.json({
        ...lastSuccessfulPayload,
        source: "cache",
        stale: true,
        message: "Using the last successful Premier League table while football-data.org recovers."
      } satisfies StandingsFeed);
    }

    return NextResponse.json({
      standings: fallbackStandings,
      source: "fallback",
      stale: true,
      fetchedAt: new Date().toISOString(),
      message:
        error instanceof Error
          ? `Standings are temporarily unavailable. ${error.message}`
          : "Standings are temporarily unavailable."
    } satisfies StandingsFeed);
  }
}
