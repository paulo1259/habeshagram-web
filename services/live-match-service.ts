import { FootballTeam, LiveMatch, LiveMatchEvent, LiveMatchStatus } from "@/types";

export type LiveMatchFeed = {
  matches: LiveMatch[];
  source: "api" | "cache" | "fallback";
  stale: boolean;
  fetchedAt: string;
  message?: string;
};

export type FootballProviderTeam = {
  name?: string | null;
};

export type FootballProviderScore = {
  home?: number | string | null;
  away?: number | string | null;
};

export type FootballProviderIncident = {
  id?: string | number | null;
  minute?: number | string | null;
  team?: string | null;
  type?: string | null;
  player?: string | null;
  description?: string | null;
};

export type FootballProviderMatch = {
  match_id?: string | number | null;
  id?: string | number | null;
  sport?: string | null;
  league?: string | null;
  competition?: string | null;
  leagueName?: string | null;
  status?: string | null;
  minute?: number | string | null;
  start_time?: string | null;
  kickoff_at?: string | null;
  date?: string | null;
  timestamp?: string | null;
  venue?: string | null;
  home_team?: string | null;
  away_team?: string | null;
  homeTeam?: FootballProviderTeam | string | null;
  awayTeam?: FootballProviderTeam | string | null;
  homeScore?: number | string | null;
  awayScore?: number | string | null;
  score?: FootballProviderScore | string | null;
  goals?: FootballProviderScore | string | null;
  events?: FootballProviderIncident[] | null;
  timeline?: FootballProviderIncident[] | null;
};

const trackedClubAliases: Record<FootballTeam, string[]> = {
  "Manchester United": ["manchester united", "man united", "man utd"],
  Arsenal: ["arsenal"],
  Chelsea: ["chelsea"],
  "Manchester City": ["manchester city", "man city"]
};

const teamShortLabel: Record<FootballTeam, string> = {
  "Manchester United": "Man Utd",
  Arsenal: "Arsenal",
  Chelsea: "Chelsea",
  "Manchester City": "Man City"
};

const fallbackLiveMatches: LiveMatch[] = [
  {
    id: "fallback-live-chelsea-city",
    homeTeam: "Chelsea",
    awayTeam: "Manchester City",
    homeScore: 1,
    awayScore: 2,
    status: "LIVE",
    matchClock: "56'",
    venue: "Stamford Bridge",
    kickoffAt: new Date(Date.now() - 1000 * 60 * 56).toISOString(),
    timeline: [
      {
        id: "fallback-event-1",
        minute: "19'",
        team: "Manchester City",
        type: "goal",
        player: "Haaland",
        description: "Haaland puts Man City ahead from a cutback."
      },
      {
        id: "fallback-event-2",
        minute: "41'",
        team: "Chelsea",
        type: "goal",
        player: "Palmer",
        description: "Palmer curls Chelsea level and the reactions explode."
      },
      {
        id: "fallback-event-3",
        minute: "54'",
        team: "Manchester City",
        type: "goal",
        player: "Foden",
        description: "Foden restores the lead with a sharp finish."
      }
    ]
  },
  {
    id: "fallback-upcoming-arsenal-united",
    homeTeam: "Arsenal",
    awayTeam: "Manchester United",
    homeScore: 0,
    awayScore: 0,
    status: "UPCOMING",
    matchClock: "Kickoff 7:30 PM",
    venue: "Emirates Stadium",
    kickoffAt: new Date(Date.now() + 1000 * 60 * 135).toISOString(),
    timeline: []
  },
  {
    id: "fallback-finished-united-chelsea",
    homeTeam: "Manchester United",
    awayTeam: "Chelsea",
    homeScore: 3,
    awayScore: 1,
    status: "FT",
    matchClock: "FT",
    venue: "Old Trafford",
    kickoffAt: new Date(Date.now() - 1000 * 60 * 125).toISOString(),
    timeline: [
      {
        id: "fallback-event-4",
        minute: "12'",
        team: "Manchester United",
        type: "goal",
        player: "Bruno Fernandes",
        description: "Bruno opens the scoring from the penalty spot."
      },
      {
        id: "fallback-event-5",
        minute: "76'",
        team: "Chelsea",
        type: "red",
        player: "Disasi",
        description: "Chelsea go down to ten after a late red card."
      }
    ]
  }
];

function normalizeName(value?: string | null) {
  return (value ?? "").trim().toLowerCase();
}

function parseNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function getTeamName(team: FootballProviderMatch["homeTeam"]) {
  if (!team) {
    return undefined;
  }

  if (typeof team === "string") {
    return team;
  }

  return team.name ?? undefined;
}

function getScoreValue(score: FootballProviderMatch["score"] | number | string | null | undefined, side: "home" | "away") {
  if (typeof score === "number") {
    return score;
  }

  if (typeof score === "string") {
    const [home, away] = score.split(/[-:]/).map((value) => parseNumber(value.trim()));
    return side === "home" ? home : away;
  }

  if (score && typeof score === "object") {
    return parseNumber(score[side]);
  }

  return 0;
}

export function resolveTrackedTeam(value?: string | null) {
  const normalized = normalizeName(value);

  if (!normalized) {
    return undefined;
  }

  for (const [team, aliases] of Object.entries(trackedClubAliases) as Array<[FootballTeam, string[]]>) {
    if (aliases.some((alias) => normalized.includes(alias) || alias.includes(normalized))) {
      return team;
    }
  }

  return undefined;
}

function mapIncidentType(type?: string | null): LiveMatchEvent["type"] | null {
  const normalized = normalizeName(type);

  if (normalized.includes("goal")) {
    return "goal";
  }

  if (normalized.includes("yellow")) {
    return "yellow";
  }

  if (normalized.includes("red")) {
    return "red";
  }

  return null;
}

function formatKickoffLabel(kickoffAt?: string | null) {
  if (!kickoffAt) {
    return "Kickoff soon";
  }

  return `Kickoff ${new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(kickoffAt))}`;
}

function formatMatchClock(status: LiveMatchStatus, minute: number | null | undefined, kickoffAt?: string | null) {
  if (status === "LIVE" || status === "HT") {
    return minute && minute > 0 ? `${minute}'` : status;
  }

  if (status === "FT") {
    return "FT";
  }

  return formatKickoffLabel(kickoffAt);
}

function mapStatus(status?: string | null): LiveMatchStatus {
  const normalized = normalizeName(status);

  if (
    ["live", "in_play", "inplay", "1h", "2h"].includes(normalized) ||
    normalized.includes("live") ||
    normalized.includes("playing")
  ) {
    return "LIVE";
  }

  if (["ht", "half-time", "halftime", "paused"].includes(normalized) || normalized.includes("half")) {
    return "HT";
  }

  if (
    ["ft", "finished", "full-time", "full time", "completed"].includes(normalized) ||
    normalized.includes("final") ||
    normalized.includes("ended")
  ) {
    return "FT";
  }

  return "UPCOMING";
}

function getIncidentTeam(match: Pick<LiveMatch, "homeTeam" | "awayTeam">, incident: FootballProviderIncident) {
  const resolved = resolveTrackedTeam(incident.team);
  if (resolved) {
    return resolved;
  }

  return match.homeTeam;
}

function mapTimeline(match: Pick<LiveMatch, "homeTeam" | "awayTeam">, source: FootballProviderMatch) {
  const incidents = source.events ?? source.timeline ?? [];

  return incidents
    .map((incident, index) => {
      const type = mapIncidentType(incident.type);

      if (!type) {
        return null;
      }

      return {
        id: String(incident.id ?? `${source.match_id ?? source.id ?? "match"}-${index}`),
        minute: parseNumber(incident.minute) > 0 ? `${parseNumber(incident.minute)}'` : "Live",
        team: getIncidentTeam(match, incident),
        type,
        player: incident.player?.trim() || "Match event",
        description: incident.description?.trim() || incident.type?.trim() || "Live match update"
      } satisfies LiveMatchEvent;
    })
    .filter((event): event is LiveMatchEvent => Boolean(event))
    .slice(0, 8);
}

export function mapProviderMatchToLiveMatch(source: FootballProviderMatch): LiveMatch | null {
  const homeTeam = resolveTrackedTeam(source.home_team ?? getTeamName(source.homeTeam));
  const awayTeam = resolveTrackedTeam(source.away_team ?? getTeamName(source.awayTeam));

  if (!homeTeam || !awayTeam) {
    return null;
  }

  const kickoffAt = source.start_time ?? source.kickoff_at ?? source.date ?? source.timestamp ?? undefined;
  const status = mapStatus(source.status);
  const mappedMatch = {
    id: String(source.match_id ?? source.id ?? `${homeTeam}-${awayTeam}-${kickoffAt ?? "fixture"}`),
    homeTeam,
    awayTeam,
    homeScore:
      source.homeScore != null
        ? parseNumber(source.homeScore)
        : getScoreValue(source.score ?? source.goals, "home"),
    awayScore:
      source.awayScore != null
        ? parseNumber(source.awayScore)
        : getScoreValue(source.score ?? source.goals, "away"),
    status,
    matchClock: formatMatchClock(status, parseNumber(source.minute), kickoffAt),
    venue: source.venue?.trim() || source.leagueName?.trim() || source.league?.trim() || "Premier League venue",
    kickoffAt,
    timeline: [] as LiveMatchEvent[]
  } satisfies LiveMatch;

  mappedMatch.timeline = mapTimeline(mappedMatch, source);
  return mappedMatch;
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

export function prioritizeLiveMatches(matches: LiveMatch[]) {
  return [...matches]
    .sort((a, b) => {
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

      return `${teamShortLabel[a.homeTeam]}${teamShortLabel[a.awayTeam]}`.localeCompare(
        `${teamShortLabel[b.homeTeam]}${teamShortLabel[b.awayTeam]}`
      );
    })
    .slice(0, 8);
}

export function getFallbackLiveMatches() {
  return fallbackLiveMatches;
}

export function getInitialLiveMatches() {
  return fallbackLiveMatches;
}

let liveMatchesCache = fallbackLiveMatches;

export async function fetchLiveMatches(): Promise<LiveMatchFeed> {
  try {
    const response = await fetch("/api/football/live", {
      method: "GET",
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Unable to fetch live matches (${response.status}).`);
    }

    const payload = (await response.json()) as LiveMatchFeed;
    if (payload.matches?.length) {
      liveMatchesCache = payload.matches;
    }
    return payload;
  } catch (error) {
    return {
      matches: liveMatchesCache,
      source: "cache",
      stale: true,
      fetchedAt: new Date().toISOString(),
      message:
        error instanceof Error
          ? `Using the last successful live match snapshot for now. ${error.message}`
          : "Using the last successful live match snapshot for now."
    };
  }
}
