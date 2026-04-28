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

export type BalldontlieTeam = {
  id?: number | null;
  city?: string | null;
  name?: string | null;
  full_name?: string | null;
  abbreviation?: string | null;
  conference?: string | null;
  division?: string | null;
};

export type ApiBasketballGame = {
  id?: number | string | null;
  date?: string | null;
  season?: number | null;
  status?: string | null;
  period?: number | null;
  time?: string | null;
  datetime?: string | null;
  postseason?: boolean | null;
  home_team_score?: number | null;
  visitor_team_score?: number | null;
  home_team?: BalldontlieTeam | null;
  visitor_team?: BalldontlieTeam | null;
};

export type ApiBasketballStanding = {
  team?: BalldontlieTeam | null;
  conference?: string | null;
  conference_rank?: number | null;
  division?: string | null;
  division_rank?: number | null;
  wins?: number | null;
  losses?: number | null;
  season?: number | null;
};

export type ApiBasketballPayload<T> = {
  data?: T[];
  meta?: {
    next_cursor?: number | null;
    per_page?: number | null;
  } | null;
};

export function extractApiBasketballResponse<T>(payload: ApiBasketballPayload<T> | null | undefined) {
  if (!payload || !Array.isArray(payload.data)) {
    return [];
  }

  return payload.data;
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
  const status = (game.status ?? "").trim();
  const normalized = status.toLowerCase();

  if (
    normalized.includes("qtr") ||
    normalized.includes("quarter") ||
    normalized.includes("ot") ||
    normalized.includes("live") ||
    /^\d/.test(status)
  ) {
    return "LIVE";
  }

  if (normalized.includes("half")) {
    return "HT";
  }

  if (normalized.includes("final")) {
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
  const rawStatus = (game.status ?? "").trim();

  if (status === "LIVE") {
    return rawStatus || "LIVE";
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
  const homeTeam = game.home_team?.full_name?.trim() || game.home_team?.name?.trim();
  const awayTeam = game.visitor_team?.full_name?.trim() || game.visitor_team?.name?.trim();

  if (!homeTeam || !awayTeam) {
    return null;
  }

  const kickoffAt = game.datetime?.trim() || game.date?.trim() || undefined;
  const status = mapBasketballStatus(game);

  return {
    id: String(game.id ?? `${homeTeam}-${awayTeam}-${kickoffAt ?? "game"}`),
    league: game.postseason ? "NBA Playoffs" : "NBA",
    country: "USA",
    homeTeam,
    awayTeam,
    homeScore: parseNumber(game.home_team_score),
    awayScore: parseNumber(game.visitor_team_score),
    status,
    matchClock: formatMatchClock(status, game, kickoffAt),
    venue: "NBA arena",
    kickoffAt,
    timeline: []
  };
}

export function mapApiBasketballStandingToRow(row: ApiBasketballStanding): LeagueStandingRow | null {
  const team = row.team?.full_name?.trim() || row.team?.name?.trim();
  const position = parseNumber(row.conference_rank ?? row.division_rank);

  if (!team || !position) {
    return null;
  }

  const wins = parseNumber(row.wins);
  const losses = parseNumber(row.losses);

  return {
    position,
    team,
    played: wins + losses,
    points: wins,
    goalDifference: wins - losses
  };
}
