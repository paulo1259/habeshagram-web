import { FootballTeam, LiveMatch, MatchdayAlert, MatchdayFixture, Post } from "@/types";

function getStatusRank(status: LiveMatch["status"]) {
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

function sortMatchesForMatchday(matches: LiveMatch[]) {
  return [...matches].sort((a, b) => {
    const rankDiff = getStatusRank(a.status) - getStatusRank(b.status);
    if (rankDiff !== 0) {
      return rankDiff;
    }

    if (a.status === "FT" && b.status === "FT") {
      return +new Date(b.kickoffAt ?? 0) - +new Date(a.kickoffAt ?? 0);
    }

    return +new Date(a.kickoffAt ?? 0) - +new Date(b.kickoffAt ?? 0);
  });
}

export function getTodayFixtures(liveMatches?: LiveMatch[]) {
  if (!liveMatches?.length) {
    return [];
  }

  const liveAsFixtures: MatchdayFixture[] = sortMatchesForMatchday(liveMatches).map((match, index) => ({
    id: `live-${match.id}`,
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
    kickoffAt: match.kickoffAt ?? new Date().toISOString(),
    venue: match.venue,
    status:
      match.status === "FT"
        ? "finished"
        : match.status === "UPCOMING"
          ? "upcoming"
          : "live",
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    featured: index === 0,
    heatSignal: match.heatSignal
  }));
  return liveAsFixtures.slice(0, 4);
}

export function getFeaturedMatch(liveMatches?: LiveMatch[]) {
  const fixtures = getTodayFixtures(liveMatches);
  return fixtures[0] ?? null;
}

export function getMatchdayGroups(liveMatches?: LiveMatch[]) {
  const fixtures = getTodayFixtures(liveMatches);

  return {
    live: fixtures.filter((fixture) => fixture.status === "live").slice(0, 3),
    upcoming: fixtures.filter((fixture) => fixture.status === "upcoming").slice(0, 3),
    results: fixtures.filter((fixture) => fixture.status === "finished").slice(0, 3)
  };
}

export function getMatchdayAlerts() {
  return [] as MatchdayAlert[];
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

export function getMostActiveFanbaseToday(posts: Post[], liveMatches: LiveMatch[] = []) {
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

export function getTopActiveFanbasesToday(posts: Post[], liveMatches: LiveMatch[] = [], limit = 3) {
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

  return [...scores.values()].sort((a, b) => b.score - a.score).slice(0, limit);
}
