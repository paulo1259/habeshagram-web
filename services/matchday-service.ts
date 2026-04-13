import { getInitialLiveMatches } from "@/services/live-match-service";
import { FootballTeam, LiveMatch, MatchdayAlert, MatchdayFixture, Post } from "@/types";

const today = new Date();
const baseDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

function createUtcTime(hoursFromNow: number, minutes = 0) {
  const next = new Date(baseDate);
  next.setUTCHours(next.getUTCHours() + hoursFromNow, minutes, 0, 0);
  return next.toISOString();
}

const seededFixtures: MatchdayFixture[] = [
  {
    id: "fixture-1",
    homeTeam: "Manchester United",
    awayTeam: "Chelsea",
    kickoffAt: createUtcTime(2, 15),
    venue: "Old Trafford",
    status: "upcoming",
    featured: true
  },
  {
    id: "fixture-2",
    homeTeam: "Arsenal",
    awayTeam: "Manchester City",
    kickoffAt: createUtcTime(5, 30),
    venue: "Emirates Stadium",
    status: "upcoming",
    featured: true
  },
  {
    id: "fixture-3",
    homeTeam: "Chelsea",
    awayTeam: "Manchester City",
    kickoffAt: createUtcTime(-1, 45),
    venue: "Stamford Bridge",
    status: "live",
    homeScore: 1,
    awayScore: 2
  },
  {
    id: "fixture-4",
    homeTeam: "Arsenal",
    awayTeam: "Manchester United",
    kickoffAt: createUtcTime(-6, 0),
    venue: "Emirates Stadium",
    status: "finished",
    homeScore: 2,
    awayScore: 1
  }
];

const seededAlerts: MatchdayAlert[] = [
  {
    id: "alert-1",
    badge: "GOAL",
    headline: "Palmer levels the mood and Chelsea fans are flooding the timeline",
    detail: "The matchday center is ready for instant reactions as soon as the noise spikes.",
    timestamp: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
    team: "Chelsea"
  },
  {
    id: "alert-2",
    badge: "RED CARD",
    headline: "Arsenal debate explodes after a big sending-off moment in seeded match chatter",
    detail: "This is mock for now, but the UI is ready for real in-app football alerts later.",
    timestamp: new Date(Date.now() - 1000 * 60 * 16).toISOString(),
    team: "Arsenal"
  },
  {
    id: "alert-3",
    badge: "BREAKING",
    headline: "Manchester United lineup whispers are already dominating Habesha group chats",
    detail: "Club updates, big moments, and live energy can all share the same surface here.",
    timestamp: new Date(Date.now() - 1000 * 60 * 28).toISOString(),
    team: "Manchester United"
  }
];

export function getTodayFixtures(liveMatches?: LiveMatch[]) {
  // TODO: Replace this seeded fixture layer with a real fixture/scores API when matchday data goes live.
  if (!liveMatches?.length) {
    return seededFixtures;
  }

  const liveFixtureIds = new Set(liveMatches.map((match) => `${match.homeTeam}-${match.awayTeam}`));
  const liveAsFixtures: MatchdayFixture[] = liveMatches.map((match, index) => ({
    id: `live-${match.id}`,
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    kickoffAt: createUtcTime(index - 1, 30),
    venue: match.venue,
    status: match.status === "FT" ? "finished" : "live",
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    featured: index === 0
  }));

  const remaining = seededFixtures.filter(
    (fixture) => !liveFixtureIds.has(`${fixture.homeTeam}-${fixture.awayTeam}`)
  );

  return [...liveAsFixtures, ...remaining].slice(0, 4);
}

export function getMatchdayAlerts() {
  // TODO: Swap this seeded alert stream for real event-based match and club alerts when live data is connected.
  return seededAlerts;
}

export function formatKickoffCountdown(kickoffAt: string) {
  const diffMs = new Date(kickoffAt).getTime() - Date.now();
  if (diffMs <= 0) {
    return "Kickoff underway";
  }

  const totalMinutes = Math.max(1, Math.round(diffMs / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (!hours) {
    return `Kickoff in ${minutes}m`;
  }

  return `Kickoff in ${hours}h ${minutes}m`;
}

export function formatFixtureTime(kickoffAt: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(kickoffAt));
}

export function getMostActiveFanbaseToday(posts: Post[], liveMatches: LiveMatch[] = getInitialLiveMatches()) {
  const activeTeams = new Set(liveMatches.flatMap((match) => [match.homeTeam, match.awayTeam]));
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const scores = new Map<FootballTeam, { team: FootballTeam; activityCount: number; score: number }>();

  posts.forEach((post) => {
    if (!post.teamTag || !activeTeams.has(post.teamTag)) {
      return;
    }

    if (new Date(post.createdAt) < startOfDay) {
      return;
    }

    const current = scores.get(post.teamTag) ?? { team: post.teamTag, activityCount: 0, score: 0 };
    current.activityCount += 1;
    current.score += 1 + post.likeCount * 0.4 + post.commentCount * 0.8;
    scores.set(post.teamTag, current);
  });

  return [...scores.values()].sort((a, b) => b.score - a.score)[0] ?? null;
}
