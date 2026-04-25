import { LeagueStandingRow, LiveMatchStatus } from "@/types";

export type BasketballLiveEvent = {
  id: string;
  minute: string;
  team: string;
  type: "score" | "foul" | "period";
  player: string;
  description: string;
};

export type BasketballLiveMatch = {
  id: string;
  league: string;
  country?: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: LiveMatchStatus;
  matchClock: string;
  venue: string;
  kickoffAt?: string;
  timeline: BasketballLiveEvent[];
};

export type BasketballLiveFeed = {
  matches: BasketballLiveMatch[];
  source: "api" | "cache" | "empty";
  stale: boolean;
  fetchedAt: string;
  message?: string;
};

export type BasketballStandingsFeed = {
  standings: LeagueStandingRow[];
  source: "api" | "cache" | "empty";
  stale: boolean;
  fetchedAt: string;
  message?: string;
};

export type ApiBasketballGame = {
  id?: number | string | null;
  date?: string | null;
  time?: string | null;
  timestamp?: number | null;
  datetime?: string | null;
  clock?: string | null;
  country?: { name?: string | null } | null;
  league?: { id?: number | string | null; name?: string | null; season?: string | number | null } | null;
  status?: { long?: string | null; short?: string | null; timer?: string | number | null } | null;
  teams?: {
    home?: { name?: string | null } | null;
    away?: { name?: string | null } | null;
  } | null;
  home?: { name?: string | null; score?: number | string | null } | null;
  away?: { name?: string | null; score?: number | string | null } | null;
  game?: {
    status?: string | null;
    clock?: string | null;
    arena?: string | null;
  } | null;
  scores?: {
    home?: { total?: number | string | null } | null;
    away?: { total?: number | string | null } | null;
  } | null;
  arena?: { name?: string | null; city?: string | null; country?: string | null } | null;
};

export type ApiBasketballStanding = {
  position?: number | null;
  group?: { name?: string | null } | null;
  team?: { name?: string | null } | null;
  games?: {
    played?: number | null;
    win?: { total?: number | null } | null;
    lose?: { total?: number | null } | null;
  } | null;
  points?: number | { for?: number | null; against?: number | null } | null;
};

export type ApiBasketballPayload<T> = {
  response?: T[];
  games?: T[];
  scoreboard?: T[];
  result?: T[];
  errors?: unknown;
};

export function extractApiBasketballResponse<T>(payload: ApiBasketballPayload<T> | null | undefined) {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload.response)) {
    return payload.response;
  }

  if (Array.isArray(payload.games)) {
    return payload.games;
  }

  if (Array.isArray(payload.scoreboard)) {
    return payload.scoreboard;
  }

  if (Array.isArray(payload.result)) {
    return payload.result;
  }

  return [];
}

function parseNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function mapBasketballStatus(game: ApiBasketballGame): LiveMatchStatus {
  const short = (game.status?.short ?? game.game?.status ?? "").toString().trim().toUpperCase();
  const long = (game.status?.long ?? game.game?.status ?? "").toString().trim().toLowerCase();

  if (
    ["Q1", "Q2", "Q3", "Q4", "OT", "LIVE"].includes(short) ||
    long.includes("live") ||
    long.includes("progress")
  ) {
    return "LIVE";
  }

  if (["HT", "HALFTIME"].includes(short) || long.includes("half")) {
    return "HT";
  }

  if (["FT", "AOT", "ENDED", "FINISHED"].includes(short) || long.includes("finished") || long.includes("final")) {
    return "FT";
  }

  return "UPCOMING";
}

function formatKickoffLabel(kickoffAt?: string | null) {
  if (!kickoffAt) {
    return "Tip-off soon";
  }

  return `Tip-off ${new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(kickoffAt))}`;
}

function formatMatchClock(status: LiveMatchStatus, game: ApiBasketballGame, kickoffAt?: string | null) {
  const timer = game.status?.timer ?? game.clock ?? game.game?.clock;
  const short = (game.status?.short ?? game.game?.status ?? "").toString().trim().toUpperCase();

  if (status === "LIVE") {
    if (timer != null && `${timer}`.trim()) {
      return `${timer}`;
    }

    return short || "LIVE";
  }

  if (status === "HT") {
    return "Halftime";
  }

  if (status === "FT") {
    return "FT";
  }

  return formatKickoffLabel(kickoffAt);
}

function getStatusPriority(status: LiveMatchStatus) {
  if (status === "LIVE") {
    return 0;
  }

  if (status === "UPCOMING") {
    return 1;
  }

  if (status === "FT") {
    return 2;
  }

  return 3;
}

export function prioritizeBasketballMatches(matches: BasketballLiveMatch[]) {
  return [...matches].sort((a, b) => {
    const statusDiff = getStatusPriority(a.status) - getStatusPriority(b.status);
    if (statusDiff !== 0) {
      return statusDiff;
    }

    if (a.status === "FT" && b.status === "FT") {
      return +new Date(b.kickoffAt ?? 0) - +new Date(a.kickoffAt ?? 0);
    }

    const timeDiff = +new Date(a.kickoffAt ?? 0) - +new Date(b.kickoffAt ?? 0);
    if (timeDiff !== 0) {
      return timeDiff;
    }

    return `${a.homeTeam}${a.awayTeam}`.localeCompare(`${b.homeTeam}${b.awayTeam}`);
  });
}

export function mapApiBasketballGameToLiveMatch(game: ApiBasketballGame): BasketballLiveMatch | null {
  const homeTeam = game.teams?.home?.name?.trim() || game.home?.name?.trim();
  const awayTeam = game.teams?.away?.name?.trim() || game.away?.name?.trim();

  if (!homeTeam || !awayTeam) {
    return null;
  }

  const kickoffAt =
    game.datetime?.trim() ||
    game.date?.trim() ||
    (typeof game.timestamp === "number" ? new Date(game.timestamp * 1000).toISOString() : undefined);
  const status = mapBasketballStatus(game);
  const arenaBits = [game.arena?.name ?? game.game?.arena, game.arena?.city, game.arena?.country].filter(Boolean);

  return {
    id: String(game.id ?? `${homeTeam}-${awayTeam}-${kickoffAt ?? "game"}`),
    league: game.league?.name?.trim() || "Basketball",
    country: game.country?.name?.trim() || undefined,
    homeTeam,
    awayTeam,
    homeScore: parseNumber(game.scores?.home?.total ?? game.home?.score),
    awayScore: parseNumber(game.scores?.away?.total ?? game.away?.score),
    status,
    matchClock: formatMatchClock(status, game, kickoffAt),
    venue: arenaBits.length ? arenaBits.join(", ") : "Basketball arena",
    kickoffAt,
    timeline: []
  };
}

export function mapApiBasketballStandingToRow(row: ApiBasketballStanding): LeagueStandingRow | null {
  const team = row.team?.name?.trim();
  const position = parseNumber(row.position);

  if (!team || !position) {
    return null;
  }

  const pointsFor = typeof row.points === "object" && row.points ? parseNumber(row.points.for) : 0;
  const pointsAgainst = typeof row.points === "object" && row.points ? parseNumber(row.points.against) : 0;
  const wins = parseNumber(row.games?.win?.total);

  return {
    position,
    team,
    played: parseNumber(row.games?.played),
    points: typeof row.points === "number" ? parseNumber(row.points) : wins,
    goalDifference: pointsFor - pointsAgainst
  };
}
