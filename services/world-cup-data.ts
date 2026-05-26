export type MatchStatus = 'upcoming' | 'live' | 'finished' | 'final';

export type WorldCupTeam = {
  id: string;
  name: string;
  code: string;
  flag: string;
  groupId: string;
  isHost: boolean;
};

export type WorldCupGroup = {
  id: string;
  name: string;
  teamIds: string[];
};

export type WorldCupMatch = {
  id: string;
  groupId: string;
  round: number;
  teamAId: string;
  teamBId: string;
  date: string;
  timeEt: string;
  venue: string;
  city: string;
  status: MatchStatus;
  scoreA?: number;
  scoreB?: number;
  discussionPrompt?: string;
  relatedRoomTitle?: string;
  isMajor?: boolean;
  isOpeningMatch?: boolean;
  isFinal?: boolean;
};

export type WorldCupConfig = {
  enabled: boolean;
  openingMatchAt: string;
  groupStageEndsAt: string;
  finalAt: string;
  endsAt: string;
};

export type PredictionPick = 'home' | 'draw' | 'away';

export const worldCupSourceLabel = 'Source: FIFA official fixtures';
export const worldCupCurationLabel =
  'Curated from official FIFA fixtures. Check FIFA for final kickoff details.';

export const worldCupConfig: WorldCupConfig = {
  enabled: true,
  openingMatchAt: '2026-06-11T00:00:00.000Z',
  groupStageEndsAt: '2026-07-19',
  finalAt: '2026-07-19T00:00:00.000Z',
  endsAt: '2026-07-20',
};

export const verifiedHostCities = [
  'Atlanta',
  'Boston',
  'Dallas',
  'Guadalajara',
  'Houston',
  'Kansas City',
  'Los Angeles',
  'Mexico City',
  'Miami',
  'Monterrey',
  'New York New Jersey',
  'Philadelphia',
  'San Francisco Bay Area',
  'Seattle',
  'Toronto',
  'Vancouver',
];

export const worldCupTeams: WorldCupTeam[] = [
  { id: 'mex', name: 'Mexico', code: 'MEX', flag: '🇲🇽', groupId: 'HOST', isHost: true },
  { id: 'rsa', name: 'South Africa', code: 'RSA', flag: '🇿🇦', groupId: 'HOST', isHost: false },
  { id: 'usa', name: 'United States', code: 'USA', flag: '🇺🇸', groupId: 'HOST', isHost: true },
  { id: 'par', name: 'Paraguay', code: 'PAR', flag: '🇵🇾', groupId: 'HOST', isHost: false },
  { id: 'can', name: 'Canada', code: 'CAN', flag: '🇨🇦', groupId: 'HOST', isHost: true },
  { id: 'bih', name: 'Bosnia and Herzegovina', code: 'BIH', flag: '🇧🇦', groupId: 'HOST', isHost: false },
];

export const worldCupGroups: WorldCupGroup[] = [];

export const verifiedWorldCupFixtures: WorldCupMatch[] = [
  {
    id: 'opening-match',
    groupId: 'Official',
    round: 1,
    teamAId: 'mex',
    teamBId: 'rsa',
    date: '2026-06-11',
    timeEt: 'Official kickoff on FIFA schedule',
    venue: 'Mexico City Stadium',
    city: 'Mexico City',
    status: 'upcoming',
    isMajor: true,
    isOpeningMatch: true,
    discussionPrompt: 'Community discussion: how much should opening-night energy matter for Mexico?',
    relatedRoomTitle: 'Opening match watch room',
  },
  {
    id: 'usa-opener',
    groupId: 'Official',
    round: 1,
    teamAId: 'usa',
    teamBId: 'par',
    date: '2026-06-12',
    timeEt: 'Official kickoff on FIFA schedule',
    venue: 'Official FIFA venue',
    city: 'Los Angeles',
    status: 'upcoming',
    isMajor: true,
    discussionPrompt: 'Community discussion: what should a United States opening-night performance feel like in Los Angeles?',
    relatedRoomTitle: 'USA opening-night room',
  },
  {
    id: 'can-opener',
    groupId: 'Official',
    round: 1,
    teamAId: 'can',
    teamBId: 'bih',
    date: '2026-06-12',
    timeEt: 'Official kickoff on FIFA schedule',
    venue: 'Toronto Stadium',
    city: 'Toronto',
    status: 'upcoming',
    isMajor: true,
    discussionPrompt: 'Community discussion: what would a strong Canada opening night change around the tournament mood?',
    relatedRoomTitle: 'Canada opening-night room',
  },
  {
    id: 'final',
    groupId: 'Final',
    round: 99,
    teamAId: 'tbd-a',
    teamBId: 'tbd-b',
    date: '2026-07-19',
    timeEt: 'Official kickoff on FIFA schedule',
    venue: 'New York New Jersey Stadium',
    city: 'New York New Jersey',
    status: 'upcoming',
    isMajor: true,
    isFinal: true,
    discussionPrompt: 'Community discussion: which nation feels built for the final stretch of the tournament?',
    relatedRoomTitle: 'World Cup final room',
  },
];

export const worldCupMatches = verifiedWorldCupFixtures;

export const worldCupCommunityPrompts = [
  {
    id: 'wc-prompt-1',
    title: 'Opening night atmosphere',
    body: 'Community discussion: what would settle nerves for Mexico right away on the official opening night?',
  },
  {
    id: 'wc-prompt-2',
    title: 'Host nations under pressure',
    body: 'Community discussion: which host nation has the most to prove in the first verified round of fixtures?',
  },
  {
    id: 'wc-prompt-3',
    title: 'Watch-room planning',
    body: 'Community discussion: which official tournament night should HabeshaGram rally around first?',
  },
];

export function getTeamById(id: string): WorldCupTeam | undefined {
  return worldCupTeams.find((team) => team.id === id);
}

export function getTeamsForGroup(groupId: string): WorldCupTeam[] {
  return worldCupTeams.filter((team) => team.groupId === groupId);
}

export function getUpcomingMatchesForGroup(groupId: string, count = 3): WorldCupMatch[] {
  return worldCupMatches.filter((match) => match.groupId === groupId).slice(0, count);
}

export function getUpcomingMatches(count = 6): WorldCupMatch[] {
  return worldCupMatches.slice(0, count);
}

export function getUpcomingMatchesForFavorites(
  favoriteIds: string[],
  count = 5,
): WorldCupMatch[] {
  if (favoriteIds.length === 0) {
    return [];
  }

  return worldCupMatches
    .filter(
      (match) =>
        favoriteIds.includes(match.teamAId) || favoriteIds.includes(match.teamBId),
    )
    .slice(0, count);
}

export function getMatchBadges(match: WorldCupMatch, favoriteIds: string[] = []): string[] {
  const badges: string[] = [];

  if (match.isOpeningMatch) {
    badges.push('Opening Match');
  }

  if (match.isFinal) {
    badges.push('Final');
  }

  if (
    favoriteIds.includes(match.teamAId) ||
    favoriteIds.includes(match.teamBId)
  ) {
    badges.push('Your Team');
  }

  if (match.isMajor && badges.length === 0) {
    badges.push('Featured');
  }

  return badges;
}

export function buildCountdown(targetDate: Date): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const diff = Math.max(0, targetDate.getTime() - Date.now());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
  };
}

export function isTournamentLive(): boolean {
  const now = new Date();
  return now >= new Date(worldCupConfig.openingMatchAt) && now <= new Date(worldCupConfig.endsAt);
}

export function isTournamentOver(): boolean {
  return new Date() > new Date(worldCupConfig.endsAt);
}

const PRED_KEY = 'WC2026_PREDICTIONS';
const FAV_KEY = 'WC2026_FAVS';

export function loadPredictions(): Record<string, PredictionPick> {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = localStorage.getItem(PRED_KEY);
    return raw ? (JSON.parse(raw) as Record<string, PredictionPick>) : {};
  } catch {
    return {};
  }
}

export function savePrediction(matchId: string, pick: PredictionPick | null): void {
  if (typeof window === 'undefined') {
    return;
  }

  const predictions = loadPredictions();
  if (pick === null) {
    delete predictions[matchId];
  } else {
    predictions[matchId] = pick;
  }

  localStorage.setItem(PRED_KEY, JSON.stringify(predictions));
}

export function loadFavorites(): string[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = localStorage.getItem(FAV_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function toggleFavorite(teamId: string): string[] {
  const favorites = loadFavorites();
  const next = favorites.includes(teamId)
    ? favorites.filter((favorite) => favorite !== teamId)
    : [...favorites, teamId];

  if (typeof window !== 'undefined') {
    localStorage.setItem(FAV_KEY, JSON.stringify(next));
  }

  return next;
}
