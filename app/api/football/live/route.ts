import { NextResponse } from "next/server";
import {
  FootballProviderMatch,
  LiveMatchFeed,
  mapProviderMatchToLiveMatch,
  prioritizeLiveMatches
} from "@/services/live-match-service";

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

type ProviderBucket = "live" | "today" | "finished";

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

  const [liveMatches, fixtureMatches] = await Promise.all([
    tryFetchEndpointCandidates(liveCandidates, "live"),
    tryFetchEndpointCandidates(fixtureCandidates)
  ]);

  const merged = dedupeMatches([liveMatches, fixtureMatches]);
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
        ? `Coverage: ${liveMatches.length} live, ${todayMatches.length} today, ${finishedMatches.length} recent finals.`
        : "No live or nearby tracked-club matches are available right now."
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
