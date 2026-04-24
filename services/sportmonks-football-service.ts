import "server-only";

import {
  extractSportmonksArray,
  fetchSportmonks,
  getSportmonksPremierLeagueId,
  SportmonksApiEnvelope
} from "@/lib/sportmonks";
import { FootballTeam, LeagueStandingRow, LiveMatch, LiveMatchEvent, LiveMatchStatus } from "@/types";

type SportmonksParticipant = {
  id?: number | string | null;
  name?: string | null;
  short_code?: string | null;
  image_path?: string | null;
  meta?: {
    location?: string | null;
  } | null;
  location?: string | null;
};

type SportmonksScore = {
  id?: number | string | null;
  participant_id?: number | string | null;
  score?: {
    goals?: number | string | null;
    participant?: string | null;
  } | null;
  goals?: number | string | null;
  description?: string | null;
  type?: {
    name?: string | null;
    code?: string | null;
    developer_name?: string | null;
  } | null;
};

type SportmonksEvent = {
  id?: number | string | null;
  participant_id?: number | string | null;
  minute?: number | string | null;
  extra_minute?: number | string | null;
  player_name?: string | null;
  related_player_name?: string | null;
  player?: {
    display_name?: string | null;
    name?: string | null;
  } | null;
  type?: {
    name?: string | null;
    code?: string | null;
    developer_name?: string | null;
  } | null;
  result?: string | null;
  info?: string | null;
  addition?: string | null;
};

type SportmonksState = {
  short_name?: string | null;
  state?: string | null;
  name?: string | null;
  developer_name?: string | null;
};

type SportmonksPeriod = {
  counts_from?: number | string | null;
  ticks?: number | string | null;
  type?: {
    name?: string | null;
    code?: string | null;
    developer_name?: string | null;
  } | null;
};

type SportmonksFixture = {
  id?: number | string | null;
  league_id?: number | string | null;
  season_id?: number | string | null;
  round_id?: number | string | null;
  venue_id?: number | string | null;
  name?: string | null;
  starting_at?: string | null;
  result_info?: string | null;
  participants?: SportmonksParticipant[] | null;
  scores?: SportmonksScore[] | null;
  events?: SportmonksEvent[] | null;
  state?: SportmonksState | null;
  periods?: SportmonksPeriod[] | null;
  venue?: {
    name?: string | null;
  } | null;
  league?: {
    name?: string | null;
  } | null;
  round?: {
    name?: string | null;
  } | null;
};

type SportmonksStandingDetail = {
  value?: number | string | null;
  type_id?: number | string | null;
  type?: {
    code?: string | null;
    developer_name?: string | null;
    name?: string | null;
  } | null;
};

type SportmonksStanding = {
  id?: number | string | null;
  season_id?: number | string | null;
  participant_id?: number | string | null;
  position?: number | string | null;
  points?: number | string | null;
  participant?: SportmonksParticipant | null;
  details?: SportmonksStandingDetail[] | null;
};

type SportmonksLeague = {
  id?: number | string | null;
  currentSeason?: {
    id?: number | string | null;
  } | null;
  current_season_id?: number | string | null;
};

export type SportmonksLiveCoverage = {
  matches: LiveMatch[];
  diagnostics: {
    liveCount: number;
    windowCount: number;
  };
};

const TRACKED_TEAM_ALIASES: Record<FootballTeam, string[]> = {
  "Manchester United": ["manchester united", "man utd", "man united"],
  Arsenal: ["arsenal"],
  Chelsea: ["chelsea"],
  "Manchester City": ["manchester city", "man city"]
};
const TEAM_SHORT_LABEL: Record<FootballTeam, string> = {
  "Manchester United": "Man Utd",
  Arsenal: "Arsenal",
  Chelsea: "Chelsea",
  "Manchester City": "Man City"
};
const STANDING_MATCH_TYPES = new Set(["OVERALL_MATCHES", "overall-matches-played", "OVERALL_MATCHES_PLAYED"]);
const STANDING_POINTS_TYPES = new Set(["TOTAL_POINTS", "overall-points", "OVERALL_POINTS"]);
const STANDING_GOAL_DIFFERENCE_TYPES = new Set([
  "OVERALL_GOAL_DIFFERENCE",
  "goal-difference",
  "GOAL_DIFFERENCE"
]);

function normalizeText(value?: string | null) {
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

function toIdString(value: unknown) {
  return value == null ? "" : String(value);
}

function resolveTrackedTeam(...candidates: Array<string | null | undefined>) {
  for (const candidate of candidates) {
    const normalized = normalizeText(candidate);

    if (!normalized) {
      continue;
    }

    for (const [team, aliases] of Object.entries(TRACKED_TEAM_ALIASES) as Array<[FootballTeam, string[]]>) {
      if (aliases.some((alias) => normalized.includes(alias) || alias.includes(normalized))) {
        return team;
      }
    }
  }

  return undefined;
}

async function fetchSportmonksJson<T>(
  path: string,
  params: Record<string, string> = {}
): Promise<SportmonksApiEnvelope<T>> {
  return fetchSportmonks<T>(path, params);
}

async function fetchSportmonksPaginated<T>(
  path: string,
  params: Record<string, string> = {},
  maxPages = 4
) {
  const results: T[] = [];
  let currentPage = 1;

  while (currentPage <= maxPages) {
    const payload = await fetchSportmonksJson<T>(path, {
      ...params,
      page: String(currentPage)
    });

    results.push(...extractSportmonksArray(payload));

    const pagination = payload.meta?.pagination;
    const hasMore = Boolean(pagination?.has_more);
    const totalPages = pagination?.total_pages ?? currentPage;

    if (!hasMore && currentPage >= totalPages) {
      break;
    }

    currentPage += 1;
  }

  return results;
}

function formatDateOffset(offsetDays: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function getParticipantByLocation(participants: SportmonksParticipant[] = [], target: "home" | "away") {
  return participants.find((participant) => {
    const location = normalizeText(participant.meta?.location ?? participant.location);
    return target === "home"
      ? location === "home" || location === "localteam"
      : location === "away" || location === "visitorteam";
  });
}

function getFixtureParticipants(fixture: SportmonksFixture) {
  const participants = fixture.participants ?? [];
  const home = getParticipantByLocation(participants, "home") ?? participants[0];
  const away = getParticipantByLocation(participants, "away") ?? participants[1];

  return { home, away };
}

function getParticipantGoals(scores: SportmonksScore[] = [], participantId: string) {
  return scores
    .filter((score) => toIdString(score.participant_id) === participantId)
    .reduce((maxGoals, score) => {
      const nextGoals = parseNumber(score.score?.goals ?? score.goals);
      return Math.max(maxGoals, nextGoals);
    }, 0);
}

function mapFixtureStatus(fixture: SportmonksFixture): LiveMatchStatus {
  const stateText = normalizeText(
    fixture.state?.short_name ??
      fixture.state?.developer_name ??
      fixture.state?.name ??
      fixture.state?.state
  );

  if (
    ["live", "inplay", "in_play", "1h", "2h"].includes(stateText) ||
    stateText.includes("live")
  ) {
    return "LIVE";
  }

  if (["ht", "half-time", "halftime"].includes(stateText) || stateText.includes("half")) {
    return "HT";
  }

  if (
    ["ft", "finished", "full-time", "full time"].includes(stateText) ||
    stateText.includes("finished") ||
    stateText.includes("ended")
  ) {
    return "FT";
  }

  return "UPCOMING";
}

function getFixtureMinute(fixture: SportmonksFixture) {
  const eventMinute = (fixture.events ?? []).reduce((maxMinute, event) => {
    return Math.max(maxMinute, parseNumber(event.minute));
  }, 0);

  const periodMinute = (fixture.periods ?? []).reduce((maxMinute, period) => {
    return Math.max(maxMinute, parseNumber(period.counts_from ?? period.ticks));
  }, 0);

  return Math.max(eventMinute, periodMinute);
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

function formatMatchClock(status: LiveMatchStatus, minute: number, kickoffAt?: string | null) {
  if (status === "LIVE" || status === "HT") {
    return minute > 0 ? `${minute}'` : status;
  }

  if (status === "FT") {
    return "FT";
  }

  return formatKickoffLabel(kickoffAt);
}

function mapEventType(event: SportmonksEvent): LiveMatchEvent["type"] | null {
  const typeText = normalizeText(
    event.type?.developer_name ?? event.type?.code ?? event.type?.name ?? event.result ?? event.info
  );

  if (typeText.includes("goal")) {
    return "goal";
  }

  if (typeText.includes("yellow")) {
    return "yellow";
  }

  if (typeText.includes("red")) {
    return "red";
  }

  return null;
}

function mapFixtureTimeline(
  fixture: SportmonksFixture,
  match: Pick<LiveMatch, "homeTeam" | "awayTeam">
) {
  const participants = fixture.participants ?? [];

  return (fixture.events ?? [])
    .map((event, index) => {
      const type = mapEventType(event);

      if (!type) {
        return null;
      }

      const participant = participants.find(
        (item) => toIdString(item.id) === toIdString(event.participant_id)
      );
      const team =
        resolveTrackedTeam(participant?.name, participant?.short_code) ?? match.homeTeam;
      const minute = parseNumber(event.minute);
      const extraMinute = parseNumber(event.extra_minute);
      const minuteLabel =
        minute > 0 ? `${minute}${extraMinute > 0 ? `+${extraMinute}` : ""}'` : "Live";
      const player =
        event.player_name?.trim() ||
        event.player?.display_name?.trim() ||
        event.player?.name?.trim() ||
        "Match event";
      const description =
        event.info?.trim() ||
        event.result?.trim() ||
        event.addition?.trim() ||
        event.type?.name?.trim() ||
        "Live match update";

      return {
        id: String(event.id ?? `${fixture.id ?? "fixture"}-${index}`),
        minute: minuteLabel,
        team,
        type,
        player,
        description
      } satisfies LiveMatchEvent;
    })
    .filter((event): event is LiveMatchEvent => Boolean(event))
    .slice(0, 10);
}

function mapSportmonksFixtureToLiveMatch(fixture: SportmonksFixture): LiveMatch | null {
  const { home, away } = getFixtureParticipants(fixture);
  const homeTeam = resolveTrackedTeam(home?.name, home?.short_code);
  const awayTeam = resolveTrackedTeam(away?.name, away?.short_code);

  if (!homeTeam || !awayTeam) {
    return null;
  }

  const scores = fixture.scores ?? [];
  const status = mapFixtureStatus(fixture);
  const kickoffAt = fixture.starting_at ?? undefined;
  const match = {
    id: String(fixture.id ?? `${homeTeam}-${awayTeam}-${kickoffAt ?? "fixture"}`),
    homeTeam,
    awayTeam,
    homeScore: getParticipantGoals(scores, toIdString(home?.id)),
    awayScore: getParticipantGoals(scores, toIdString(away?.id)),
    status,
    matchClock: formatMatchClock(status, getFixtureMinute(fixture), kickoffAt),
    venue:
      fixture.venue?.name?.trim() ||
      fixture.league?.name?.trim() ||
      fixture.round?.name?.trim() ||
      "Premier League venue",
    kickoffAt,
    timeline: [] as LiveMatchEvent[]
  } satisfies LiveMatch;

  match.timeline = mapFixtureTimeline(fixture, match);
  return match;
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

      return `${TEAM_SHORT_LABEL[a.homeTeam]}${TEAM_SHORT_LABEL[a.awayTeam]}`.localeCompare(
        `${TEAM_SHORT_LABEL[b.homeTeam]}${TEAM_SHORT_LABEL[b.awayTeam]}`
      );
    })
    .slice(0, 8);
}

function getStandingDetailValue(details: SportmonksStandingDetail[] = [], acceptedCodes: Set<string>) {
  const detail = details.find((item) => {
    const code = item.type?.code ?? item.type?.developer_name ?? item.type?.name ?? "";
    return acceptedCodes.has(code);
  });

  return parseNumber(detail?.value);
}

function mapSportmonksStandingToRow(row: SportmonksStanding): LeagueStandingRow | null {
  const teamName = row.participant?.name?.trim() || row.participant?.short_code?.trim();
  const position = parseNumber(row.position);

  if (!teamName || !position) {
    return null;
  }

  const details = row.details ?? [];
  const points = parseNumber(row.points) || getStandingDetailValue(details, STANDING_POINTS_TYPES);
  const played = getStandingDetailValue(details, STANDING_MATCH_TYPES);
  const goalDifference = getStandingDetailValue(details, STANDING_GOAL_DIFFERENCE_TYPES);
  const teamTag = resolveTrackedTeam(row.participant?.name, row.participant?.short_code);

  return {
    position,
    team: row.participant?.short_code?.trim() || teamName,
    teamTag,
    tracked: Boolean(teamTag),
    played,
    points,
    goalDifference
  };
}

async function fetchCurrentSeasonId(leagueId: number) {
  const payload = await fetchSportmonksJson<SportmonksLeague>(`/leagues/${leagueId}`, {
    include: "currentSeason"
  });
  const league = extractSportmonksArray(payload)[0];

  return parseNumber(league?.currentSeason?.id ?? league?.current_season_id);
}

export async function fetchSportmonksLiveCoverage(): Promise<SportmonksLiveCoverage> {
  const leagueId = getSportmonksPremierLeagueId();
  const include = "scores;participants;events;state;periods;venue";
  const filters = `fixtureLeagues:${leagueId}`;
  let livescores: SportmonksFixture[] = [];

  try {
    const livePayload = await fetchSportmonksJson<SportmonksFixture>("/livescores", {
      include,
      filters
    });
    livescores = extractSportmonksArray(livePayload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (!message.includes("/livescores")) {
      throw error;
    }

    const inplayPayload = await fetchSportmonksJson<SportmonksFixture>("/livescores/inplay", {
      include,
      filters
    });
    livescores = extractSportmonksArray(inplayPayload);
  }

  const fixtures = await fetchSportmonksPaginated<SportmonksFixture>(
    `/fixtures/between/${formatDateOffset(-1)}/${formatDateOffset(1)}`,
    {
      include,
      filters,
      per_page: "50",
      order: "asc"
    }
  );

  const merged = new Map<string, SportmonksFixture>();

  [...livescores, ...fixtures].forEach((fixture) => {
    const key = String(fixture.id ?? fixture.name ?? fixture.starting_at ?? Math.random());
    if (!merged.has(key)) {
      merged.set(key, fixture);
    }
  });

  const matches = prioritizeLiveMatches(
    [...merged.values()]
      .map((fixture) => mapSportmonksFixtureToLiveMatch(fixture))
      .filter((match): match is LiveMatch => Boolean(match))
  );

  return {
    matches,
    diagnostics: {
      liveCount: livescores.length,
      windowCount: fixtures.length
    }
  };
}

export async function fetchSportmonksStandings(): Promise<LeagueStandingRow[]> {
  const leagueId = getSportmonksPremierLeagueId();
  const include = "participant;details.type";

  const livePayload = await fetchSportmonksJson<SportmonksStanding>(`/standings/live/leagues/${leagueId}`, {
    include
  });
  let standings = extractSportmonksArray(livePayload);

  if (!standings.length) {
    const currentSeasonId = await fetchCurrentSeasonId(leagueId);

    if (currentSeasonId) {
      const seasonPayload = await fetchSportmonksJson<SportmonksStanding>(
        `/standings/seasons/${currentSeasonId}`,
        {
          include
        }
      );
      standings = extractSportmonksArray(seasonPayload);
    }
  }

  return standings
    .map((row) => mapSportmonksStandingToRow(row))
    .filter((row): row is LeagueStandingRow => Boolean(row))
    .sort((a, b) => a.position - b.position)
    .slice(0, 8);
}
