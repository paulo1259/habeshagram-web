import { FootballTeam, LiveMatch, LiveMatchEvent, LiveMatchStatus } from "@/types";

type FootballDataGoal = {
  minute?: number | null;
  injuryTime?: number | null;
  team?: { name?: string | null } | null;
  scorer?: { name?: string | null } | null;
  score?: { home?: number | null; away?: number | null } | null;
};

type FootballDataBooking = {
  minute?: number | null;
  team?: { name?: string | null } | null;
  player?: { name?: string | null } | null;
  card?: string | null;
};

type FootballDataMatch = {
  id: number;
  utcDate?: string | null;
  status?: string | null;
  minute?: number | string | null;
  injuryTime?: number | null;
  venue?: string | null;
  homeTeam?: { name?: string | null; shortName?: string | null; tla?: string | null } | null;
  awayTeam?: { name?: string | null; shortName?: string | null; tla?: string | null } | null;
  score?: {
    fullTime?: { home?: number | null; away?: number | null } | null;
    halfTime?: { home?: number | null; away?: number | null } | null;
  } | null;
  goals?: FootballDataGoal[] | null;
  bookings?: FootballDataBooking[] | null;
};

export type LiveMatchFeed = {
  matches: LiveMatch[];
  source: "api" | "cache" | "fallback";
  stale: boolean;
  fetchedAt: string;
  message?: string;
};

const fallbackLiveMatches: LiveMatch[] = [
  {
    id: "fallback-match-1",
    homeTeam: "Manchester United",
    awayTeam: "Chelsea",
    homeScore: 1,
    awayScore: 0,
    status: "LIVE",
    matchClock: "23'",
    venue: "Old Trafford",
    timeline: [
      {
        id: "fallback-match-1-goal",
        minute: "12'",
        team: "Manchester United",
        type: "goal",
        player: "Rashford",
        description: "Drives inside and finishes low across goal."
      }
    ]
  },
  {
    id: "fallback-match-2",
    homeTeam: "Arsenal",
    awayTeam: "Manchester City",
    homeScore: 0,
    awayScore: 0,
    status: "HT",
    matchClock: "Half-time",
    venue: "Emirates Stadium",
    timeline: [
      {
        id: "fallback-match-2-note",
        minute: "17'",
        team: "Arsenal",
        type: "yellow",
        player: "Rice",
        description: "Midfield battle is getting heated."
      }
    ]
  }
];

let liveMatchCache = fallbackLiveMatches;

const supportedTeamAliases: Record<FootballTeam, string[]> = {
  "Manchester United": ["manchester united", "man united", "man utd", "manchester united fc"],
  Arsenal: ["arsenal", "arsenal fc"],
  Chelsea: ["chelsea", "chelsea fc"],
  "Manchester City": ["manchester city", "man city", "manchester city fc"]
};

function normalizeTeamName(value?: string | null) {
  return (value ?? "").toLowerCase().replace(/fc\b/g, "").replace(/\s+/g, " ").trim();
}

function resolveFootballTeam(...candidates: Array<string | null | undefined>): FootballTeam | null {
  for (const candidate of candidates) {
    const normalized = normalizeTeamName(candidate);
    if (!normalized) {
      continue;
    }

    for (const [team, aliases] of Object.entries(supportedTeamAliases) as Array<[FootballTeam, string[]]>) {
      if (aliases.includes(normalized)) {
        return team;
      }
    }
  }

  return null;
}

function mapProviderStatus(status?: string | null): LiveMatchStatus | null {
  switch (status) {
    case "IN_PLAY":
      return "LIVE";
    case "PAUSED":
      return "HT";
    case "FINISHED":
      return "FT";
    case "TIMED":
    case "SCHEDULED":
      return "UPCOMING";
    default:
      return null;
  }
}

function formatKickoffLabel(utcDate?: string | null) {
  if (!utcDate) {
    return "Soon";
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(utcDate));
}

function formatMatchClock(match: FootballDataMatch, status: LiveMatchStatus) {
  if (status === "HT") {
    return "Half-time";
  }

  if (status === "FT") {
    return "Full-time";
  }

  if (status === "UPCOMING") {
    return formatKickoffLabel(match.utcDate);
  }

  const minute = typeof match.minute === "number" ? match.minute : Number(match.minute ?? 0);
  const injuryTime = match.injuryTime ?? 0;

  if (minute > 0 && injuryTime > 0) {
    return `${minute}+${injuryTime}'`;
  }

  if (minute > 0) {
    return `${minute}'`;
  }

  return "Live";
}

function describeGoal(goal: FootballDataGoal, team: FootballTeam) {
  const score = goal.score?.home != null && goal.score?.away != null
    ? ` ${goal.score.home}-${goal.score.away}.`
    : ".";
  return `${team} score${score}`;
}

function mapGoals(goals: FootballDataGoal[] | null | undefined): LiveMatchEvent[] {
  const events: LiveMatchEvent[] = [];

  (goals ?? []).forEach((goal, index) => {
    const team = resolveFootballTeam(goal.team?.name);
    if (!team || goal.minute == null) {
      return;
    }

    events.push({
      id: `goal-${index}-${goal.minute}`,
      minute: `${goal.minute}'`,
      team,
      type: "goal",
      player: goal.scorer?.name ?? `${team} scorer`,
      description: describeGoal(goal, team)
    });
  });

  return events;
}

function mapBookings(bookings: FootballDataBooking[] | null | undefined): LiveMatchEvent[] {
  const events: LiveMatchEvent[] = [];

  (bookings ?? []).forEach((booking, index) => {
    const team = resolveFootballTeam(booking.team?.name);
    if (!team || booking.minute == null) {
      return;
    }

    const isRed = (booking.card ?? "").toUpperCase().includes("RED");

    events.push({
      id: `booking-${index}-${booking.minute}`,
      minute: `${booking.minute}'`,
      team,
      type: isRed ? "red" : "yellow",
      player: booking.player?.name ?? `${team} player`,
      description: isRed ? "Shown a red card." : "Booked by the referee."
    });
  });

  return events;
}

function buildTimeline(match: FootballDataMatch, homeTeam: FootballTeam): LiveMatchEvent[] {
  const mappedTimeline = [...mapGoals(match.goals), ...mapBookings(match.bookings)].sort(
    (a, b) => Number.parseInt(a.minute, 10) - Number.parseInt(b.minute, 10)
  );

  if (mappedTimeline.length) {
    return mappedTimeline.slice(-6);
  }

  const status = mapProviderStatus(match.status);

  if (status === "UPCOMING") {
    return [
      {
        id: `note-${match.id}`,
        minute: "KO",
        team: homeTeam,
        type: "yellow",
        player: "Matchday Desk",
        description: `Kickoff is scheduled for ${formatKickoffLabel(match.utcDate)}.`
      }
    ];
  }

  if (status === "FT") {
    return [
      {
        id: `note-${match.id}`,
        minute: "FT",
        team: homeTeam,
        type: "goal",
        player: "Matchday Desk",
        description: "Final score confirmed by football-data.org."
      }
    ];
  }

  return [
    {
      id: `note-${match.id}`,
      minute: formatMatchClock(match, status ?? "LIVE"),
      team: homeTeam,
      type: "yellow",
      player: "Matchday Desk",
      description: "Live match data is updating from football-data.org."
    }
  ];
}

function getScoreValue(value?: number | null) {
  return typeof value === "number" ? value : 0;
}

export function mapFootballDataMatchToLiveMatch(match: FootballDataMatch): LiveMatch | null {
  const homeTeam = resolveFootballTeam(
    match.homeTeam?.name,
    match.homeTeam?.shortName,
    match.homeTeam?.tla
  );
  const awayTeam = resolveFootballTeam(
    match.awayTeam?.name,
    match.awayTeam?.shortName,
    match.awayTeam?.tla
  );

  if (!homeTeam || !awayTeam) {
    return null;
  }

  const status = mapProviderStatus(match.status);
  if (!status) {
    return null;
  }

  return {
    id: `fd-${match.id}`,
    homeTeam,
    awayTeam,
    homeScore: getScoreValue(match.score?.fullTime?.home),
    awayScore: getScoreValue(match.score?.fullTime?.away),
    status,
    matchClock: formatMatchClock(match, status),
    venue: match.venue ?? "Premier League venue",
    timeline: buildTimeline(match, homeTeam)
  };
}

function getStatusPriority(status: LiveMatchStatus) {
  switch (status) {
    case "LIVE":
      return 0;
    case "HT":
      return 1;
    case "UPCOMING":
      return 2;
    case "FT":
      return 3;
    default:
      return 4;
  }
}

export function prioritizeLiveMatches(matches: LiveMatch[]) {
  return [...matches]
    .sort((a, b) => {
      const statusDelta = getStatusPriority(a.status) - getStatusPriority(b.status);
      if (statusDelta !== 0) {
        return statusDelta;
      }

      return a.homeTeam.localeCompare(b.homeTeam);
    })
    .slice(0, 4);
}

export function getFallbackLiveMatches() {
  return fallbackLiveMatches;
}

export function getInitialLiveMatches() {
  return liveMatchCache;
}

export function getNextLiveMatches() {
  return liveMatchCache;
}

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
      liveMatchCache = payload.matches;
    }
    return payload;
  } catch (error) {
    return {
      matches: liveMatchCache,
      source: "cache",
      stale: true,
      fetchedAt: new Date().toISOString(),
      message:
        error instanceof Error
          ? `Using the last successful live update for now. ${error.message}`
          : "Using the last successful live update for now."
    };
  }
}
