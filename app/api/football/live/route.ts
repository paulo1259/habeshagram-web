import { NextResponse } from "next/server";
import {
  FootballProviderMatch,
  LiveMatchFeed,
  mapProviderMatchToLiveMatch,
  prioritizeLiveMatches
} from "@/services/live-match-service";
import { FootballTeam } from "@/types";

export const dynamic = "force-dynamic";

const RAPID_API_HOST =
  process.env.FREE_API_LIVE_FOOTBALL_DATA_RAPIDAPI_HOST?.trim() ||
  "free-api-live-football-data.p.rapidapi.com";
const RAPID_API_BASE_URL =
  process.env.FREE_API_LIVE_FOOTBALL_DATA_RAPIDAPI_BASE_URL?.trim() ||
  `https://${RAPID_API_HOST}`;
const TRACKED_TEAM_KEYWORDS = [
  "manchester united",
  "man utd",
  "arsenal",
  "chelsea",
  "manchester city",
  "man city"
];
const FOOTBALL_DATA_BASE_URL = "https://api.football-data.org/v4";
const TRACKED_TEAM_ALIASES: Record<FootballTeam, string[]> = {
  "Manchester United": ["manchester united", "man united", "man utd"],
  Arsenal: ["arsenal"],
  Chelsea: ["chelsea"],
  "Manchester City": ["manchester city", "man city"]
};

type ProviderBucket = "live" | "today" | "finished";
type FootballDataTeam = {
  name?: string | null;
  shortName?: string | null;
  tla?: string | null;
};

type FootballDataMatch = {
  id?: number | null;
  utcDate?: string | null;
  status?: string | null;
  minute?: number | null;
  venue?: string | null;
  homeTeam?: FootballDataTeam | null;
  awayTeam?: FootballDataTeam | null;
  score?: {
    fullTime?: { home?: number | null; away?: number | null } | null;
  } | null;
};

let lastSuccessfulPayload: LiveMatchFeed | null = null;

function formatDateOffset(offsetDays: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function buildProviderHeaders() {
  const apiKey = process.env.FREE_API_LIVE_FOOTBALL_DATA_RAPIDAPI_KEY?.trim();

  if (!apiKey) {
    throw new Error("FREE_API_LIVE_FOOTBALL_DATA_RAPIDAPI_KEY is missing on the server.");
  }

  return {
    "X-RapidAPI-Key": apiKey,
    "X-RapidAPI-Host": RAPID_API_HOST,
    Accept: "application/json"
  };
}

function buildFootballDataHeaders() {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("FOOTBALL_DATA_API_KEY is missing on the server.");
  }

  return {
    "X-Auth-Token": apiKey,
    Accept: "application/json"
  };
}

async function fetchProviderJson(path: string, searchParams?: Record<string, string>) {
  const url = new URL(path, RAPID_API_BASE_URL.endsWith("/") ? RAPID_API_BASE_URL : `${RAPID_API_BASE_URL}/`);
  Object.entries(searchParams ?? {}).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url.toString(), {
    headers: buildProviderHeaders(),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Free API Live Football Data returned ${response.status} for ${url.pathname}.`);
  }

  return response.json();
}

async function fetchFootballDataMatches(searchParams?: Record<string, string>) {
  const url = new URL("/competitions/PL/matches", `${FOOTBALL_DATA_BASE_URL}/`);
  Object.entries(searchParams ?? {}).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url.toString(), {
    headers: buildFootballDataHeaders(),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`football-data.org returned ${response.status} for ${url.pathname}.`);
  }

  const payload = (await response.json()) as { matches?: FootballDataMatch[] };
  return Array.isArray(payload.matches) ? payload.matches : [];
}

function extractMatchesFromPayload(payload: unknown): FootballProviderMatch[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const record = payload as Record<string, unknown>;
  const direct = [record.data, record.response, record.matches, record.events].find(Array.isArray);
  if (direct) {
    return direct as FootballProviderMatch[];
  }

  if (record.data && typeof record.data === "object") {
    const nested = record.data as Record<string, unknown>;
    const nestedArray = [nested.matches, nested.events, nested.items].find(Array.isArray);
    if (nestedArray) {
      return nestedArray as FootballProviderMatch[];
    }
  }

  return [];
}

function includesTrackedTeam(match: FootballProviderMatch) {
  const teamText = [
    match.home_team,
    typeof match.homeTeam === "string" ? match.homeTeam : match.homeTeam?.name,
    match.away_team,
    typeof match.awayTeam === "string" ? match.awayTeam : match.awayTeam?.name
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return TRACKED_TEAM_KEYWORDS.some((keyword) => teamText.includes(keyword));
}

function normalizeStatus(value?: string | null) {
  return (value ?? "").toLowerCase().trim();
}

function matchesTrackedClub(name?: string | null) {
  const normalized = normalizeStatus(name);

  if (!normalized) {
    return false;
  }

  return Object.values(TRACKED_TEAM_ALIASES).some((aliases) =>
    aliases.some((alias) => normalized.includes(alias) || alias.includes(normalized))
  );
}

function getBucket(match: FootballProviderMatch): ProviderBucket {
  const status = normalizeStatus(match.status);

  if (status.includes("live") || status.includes("playing") || ["1h", "2h", "ht"].includes(status)) {
    return "live";
  }

  if (
    status.includes("finished") ||
    status.includes("final") ||
    status.includes("ft") ||
    status.includes("completed") ||
    status.includes("ended")
  ) {
    return "finished";
  }

  return "today";
}

function mapFootballDataMatchToProviderMatch(match: FootballDataMatch): FootballProviderMatch | null {
  const homeName = match.homeTeam?.name?.trim() || match.homeTeam?.shortName?.trim();
  const awayName = match.awayTeam?.name?.trim() || match.awayTeam?.shortName?.trim();

  if (!homeName || !awayName) {
    return null;
  }

  return {
    match_id: match.id ?? `${homeName}-${awayName}-${match.utcDate ?? "fixture"}`,
    id: match.id ?? undefined,
    league: "Premier League",
    leagueName: "Premier League",
    status: match.status ?? "TIMED",
    minute: match.minute ?? undefined,
    start_time: match.utcDate ?? undefined,
    kickoff_at: match.utcDate ?? undefined,
    date: match.utcDate ?? undefined,
    timestamp: match.utcDate ?? undefined,
    venue: match.venue ?? undefined,
    home_team: homeName,
    away_team: awayName,
    homeTeam: homeName,
    awayTeam: awayName,
    homeScore: match.score?.fullTime?.home ?? 0,
    awayScore: match.score?.fullTime?.away ?? 0
  };
}

function buildMatchKey(match: Pick<FootballProviderMatch, "match_id" | "id" | "home_team" | "away_team" | "start_time" | "date">) {
  return String(match.match_id ?? match.id ?? `${match.home_team}-${match.away_team}-${match.start_time ?? match.date}`);
}

function mergeProviderMatches(primary: FootballProviderMatch[], liveEnrichments: FootballProviderMatch[]) {
  const enrichedByKey = new Map(liveEnrichments.map((match) => [buildMatchKey(match), match]));

  return primary.map((match) => {
    const enrichment = enrichedByKey.get(buildMatchKey(match));

    if (!enrichment) {
      return match;
    }

    return {
      ...match,
      ...enrichment,
      home_team: match.home_team,
      away_team: match.away_team,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      start_time: match.start_time ?? enrichment.start_time,
      kickoff_at: match.kickoff_at ?? enrichment.kickoff_at,
      date: match.date ?? enrichment.date,
      timestamp: match.timestamp ?? enrichment.timestamp,
      venue: enrichment.venue ?? match.venue,
      status: enrichment.status ?? match.status,
      homeScore: enrichment.homeScore ?? match.homeScore,
      awayScore: enrichment.awayScore ?? match.awayScore
    };
  });
}

async function tryFetchEndpointCandidates(
  candidates: Array<{ path: string; params?: Record<string, string> }>,
  bucket?: ProviderBucket
) {
  for (const candidate of candidates) {
    try {
      const payload = await fetchProviderJson(candidate.path, candidate.params);
      const matches = extractMatchesFromPayload(payload)
        .filter(includesTrackedTeam)
        .map((match) => ({
          ...match,
          status:
            match.status ??
            (bucket === "live" ? "LIVE" : bucket === "finished" ? "FT" : bucket === "today" ? "NS" : undefined)
        }));

      if (matches.length) {
        return matches;
      }
    } catch {
      // Keep trying the known route shapes for this bucket.
    }
  }

  return [];
}

function dedupeMatches(groups: FootballProviderMatch[][]) {
  const deduped = new Map<string, FootballProviderMatch>();

  groups.forEach((group) => {
    group.forEach((match) => {
      const key = String(
        match.match_id ?? match.id ?? `${match.home_team}-${match.away_team}-${match.start_time ?? match.date}`
      );

      if (!deduped.has(key)) {
        deduped.set(key, match);
      }
    });
  });

  return [...deduped.values()];
}

function splitMatchesByBucket(matches: FootballProviderMatch[]) {
  return {
    live: matches.filter((match) => getBucket(match) === "live"),
    today: matches.filter((match) => getBucket(match) === "today"),
    finished: matches.filter((match) => getBucket(match) === "finished")
  };
}

function selectCoverageMatches(allMatches: ReturnType<typeof prioritizeLiveMatches>) {
  const live = allMatches.filter((match) => match.status === "LIVE" || match.status === "HT");
  const upcoming = allMatches.filter((match) => match.status === "UPCOMING");
  const finished = allMatches.filter((match) => match.status === "FT");

  const selected = [...live.slice(0, 4), ...upcoming.slice(0, 4), ...finished.slice(0, 4)];
  const deduped = new Map(selected.map((match) => [match.id, match]));

  if (deduped.size < 12) {
    allMatches.forEach((match) => {
      if (deduped.size >= 12 || deduped.has(match.id)) {
        return;
      }

      deduped.set(match.id, match);
    });
  }

  return allMatches.filter((match) => deduped.has(match.id));
}

async function fetchCoverageMatches() {
  const today = formatDateOffset(0);
  const yesterday = formatDateOffset(-1);
  const tomorrow = formatDateOffset(1);

  const liveCandidates: Array<{ path: string; params?: Record<string, string> }> = [
    { path: "/football-current-live" },
    { path: "/football-current-live", params: { date: today } }
  ];

  const fixtureCandidates: Array<{ path: string; params?: Record<string, string> }> = [
    { path: "/football-matches", params: { dateFrom: yesterday, dateTo: tomorrow } },
    { path: "/football-matches", params: { date: yesterday } },
    { path: "/football-matches", params: { date: today } },
    { path: "/football-matches", params: { date: tomorrow } },
    { path: "/football-scheduled-events", params: { date: today } },
    { path: "/football-scheduled-events", params: { date: tomorrow } }
  ];

  const [liveMatches, footballDataMatches] = await Promise.all([
    tryFetchEndpointCandidates(liveCandidates, "live"),
    fetchFootballDataMatches({ dateFrom: yesterday, dateTo: tomorrow })
  ]);

  const mappedFootballDataMatches = footballDataMatches
    .filter((match) => matchesTrackedClub(match.homeTeam?.name) || matchesTrackedClub(match.awayTeam?.name))
    .map((match) => mapFootballDataMatchToProviderMatch(match))
    .filter((match): match is FootballProviderMatch => Boolean(match));

  const merged = dedupeMatches([mergeProviderMatches(mappedFootballDataMatches, liveMatches)]);
  const split = splitMatchesByBucket(merged);

  return {
    liveMatches,
    todayMatches: split.today,
    finishedMatches: split.finished,
    merged
  };
}

export async function GET() {
  const apiKey = process.env.FREE_API_LIVE_FOOTBALL_DATA_RAPIDAPI_KEY?.trim();

  if (!apiKey) {
    return NextResponse.json({
      matches: [],
      source: "empty",
      stale: true,
      fetchedAt: new Date().toISOString(),
      message:
        "Live football data is not configured on the server yet."
    } satisfies LiveMatchFeed);
  }

  try {
    const { merged, liveMatches, todayMatches, finishedMatches } = await fetchCoverageMatches();
    const mapped = selectCoverageMatches(
      prioritizeLiveMatches(
      merged
        .map((match) => mapProviderMatchToLiveMatch(match))
        .filter((match): match is NonNullable<typeof match> => Boolean(match))
      )
    );

    const payload: LiveMatchFeed = {
      matches: mapped,
      source: "api",
      stale: false,
      fetchedAt: new Date().toISOString(),
      message: mapped.length
        ? `football-data.org coverage: ${liveMatches.length} live enrichments, ${todayMatches.length} upcoming fixtures, ${finishedMatches.length} recent finals.`
        : "No tracked-club football fixtures or recent finals are available right now."
    };

    lastSuccessfulPayload = payload;
    return NextResponse.json(payload);
  } catch (error) {
    if (lastSuccessfulPayload) {
      return NextResponse.json({
        ...lastSuccessfulPayload,
        source: "cache",
        stale: true,
        message: "Using the last successful Free API Live Football Data update while the provider recovers."
      } satisfies LiveMatchFeed);
    }

    return NextResponse.json({
      matches: [],
      source: "empty",
      stale: true,
      fetchedAt: new Date().toISOString(),
      message:
        error instanceof Error
          ? `Live football data is temporarily unavailable. ${error.message}`
          : "Live football data is temporarily unavailable."
    } satisfies LiveMatchFeed);
  }
}
