import { NextResponse } from "next/server";
import { FootballTeam, LeagueStandingRow } from "@/types";

export const dynamic = "force-dynamic";

type StandingsFeed = {
  standings: LeagueStandingRow[];
  source: "api" | "cache" | "fallback";
  stale: boolean;
  fetchedAt: string;
  message?: string;
};

type SportApiStandingRow = {
  position?: number | null;
  rank?: number | null;
  played?: number | null;
  matches?: number | null;
  points?: number | null;
  goal_difference?: number | null;
  goalDifference?: number | null;
  team?: string | { name?: string | null } | null;
  team_name?: string | null;
};

const RAPID_API_HOST = process.env.SPORTAPI_RAPIDAPI_HOST?.trim() || "sportapi7.p.rapidapi.com";
const RAPID_API_BASE_URL = process.env.SPORTAPI_RAPIDAPI_BASE_URL?.trim() || `https://${RAPID_API_HOST}`;

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

function buildSportApiHeaders() {
  const apiKey = process.env.SPORTAPI_RAPIDAPI_KEY?.trim();

  if (!apiKey) {
    throw new Error("SPORTAPI_RAPIDAPI_KEY is missing on the server.");
  }

  return {
    "X-RapidAPI-Key": apiKey,
    "X-RapidAPI-Host": RAPID_API_HOST,
    Accept: "application/json"
  };
}

async function fetchSportApiJson(path: string, searchParams?: Record<string, string>) {
  const url = new URL(path, RAPID_API_BASE_URL.endsWith("/") ? RAPID_API_BASE_URL : `${RAPID_API_BASE_URL}/`);
  Object.entries(searchParams ?? {}).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url.toString(), {
    headers: buildSportApiHeaders(),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`SportAPI standings returned ${response.status} for ${url.pathname}.`);
  }

  return response.json();
}

function resolveTrackedTeam(name: string) {
  const normalized = name.toLowerCase().trim();

  for (const [team, aliases] of Object.entries(trackedTeams) as Array<[FootballTeam, string[]]>) {
    if (aliases.some((alias) => normalized.includes(alias) || alias.includes(normalized))) {
      return team;
    }
  }

  return undefined;
}

function extractStandingsRows(payload: unknown): SportApiStandingRow[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const record = payload as Record<string, unknown>;
  const directArray = [record.data, record.response, record.standings, record.table].find(Array.isArray);
  if (directArray) {
    return directArray as SportApiStandingRow[];
  }

  if (record.data && typeof record.data === "object") {
    const nested = record.data as Record<string, unknown>;
    const nestedArray = [nested.standings, nested.table, nested.rows].find(Array.isArray);
    if (nestedArray) {
      return nestedArray as SportApiStandingRow[];
    }
  }

  return [];
}

function mapStandingRow(row: SportApiStandingRow): LeagueStandingRow | null {
  const rawTeam =
    typeof row.team === "string"
      ? row.team
      : row.team?.name || row.team_name || "";

  const position = row.position ?? row.rank;

  if (!rawTeam || typeof position !== "number") {
    return null;
  }

  const teamTag = resolveTrackedTeam(rawTeam);

  return {
    position,
    team: rawTeam,
    teamTag,
    tracked: Boolean(teamTag),
    played: row.played ?? row.matches ?? 0,
    points: row.points ?? 0,
    goalDifference: row.goal_difference ?? row.goalDifference ?? 0
  };
}

async function fetchRelevantStandings() {
  const candidates: Array<{ path: string; params?: Record<string, string> }> = [
    { path: "/v1/standings", params: { league: "Premier League", country: "England" } },
    { path: "/v1/table", params: { league: "Premier League", country: "England" } },
    { path: "/api/v1/stage/standings", params: { tournament: "premier-league" } }
  ];

  for (const candidate of candidates) {
    try {
      const payload = await fetchSportApiJson(candidate.path, candidate.params);
      const rows = extractStandingsRows(payload)
        .map((row) => mapStandingRow(row))
        .filter((row): row is LeagueStandingRow => Boolean(row))
        .slice(0, 8);

      if (rows.length) {
        return rows;
      }
    } catch {
      // Keep trying known SportAPI standings shapes.
    }
  }

  return [];
}

export async function GET() {
  const apiKey = process.env.SPORTAPI_RAPIDAPI_KEY?.trim();

  if (!apiKey) {
    return NextResponse.json({
      standings: fallbackStandings,
      source: "fallback",
      stale: true,
      fetchedAt: new Date().toISOString(),
      message: "SPORTAPI_RAPIDAPI_KEY is missing on the server, so HabeshaGram is showing fallback Premier League standings."
    } satisfies StandingsFeed);
  }

  try {
    const standings = await fetchRelevantStandings();

    const payload: StandingsFeed = {
      standings: standings.length ? standings : fallbackStandings,
      source: "api",
      stale: false,
      fetchedAt: new Date().toISOString(),
      message: standings.length ? undefined : "SportAPI did not return a usable table, so HabeshaGram is showing the fallback standings."
    };

    lastSuccessfulPayload = payload;
    return NextResponse.json(payload);
  } catch (error) {
    if (lastSuccessfulPayload) {
      return NextResponse.json({
        ...lastSuccessfulPayload,
        source: "cache",
        stale: true,
        message: "Using the last successful SportAPI table while the standings provider recovers."
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
