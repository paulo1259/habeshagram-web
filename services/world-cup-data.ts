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

/**
 * Trust model:
 * - worldCupGroups + worldCupTeams come from the FIFA official final draw.
 * - verifiedWorldCupFixtures stays intentionally limited to fixtures FIFA has
 *   already published clearly enough for the app to stand behind.
 * - We do not regenerate the full round-robin schedule from the groups.
 */
export const worldCupSourceLabel = 'Source: FIFA official fixtures';
export const worldCupCurationLabel =
  'Curated from official FIFA fixtures. Check FIFA for final kickoff details.';
export const worldCupGroupsSourceLabel = 'Groups from FIFA official final draw.';

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
  { id: 'mex', name: 'Mexico', code: 'MEX', flag: '🇲🇽', groupId: 'A', isHost: true },
  { id: 'kor', name: 'South Korea', code: 'KOR', flag: '🇰🇷', groupId: 'A', isHost: false },
  { id: 'rsa', name: 'South Africa', code: 'RSA', flag: '🇿🇦', groupId: 'A', isHost: false },
  { id: 'uefa-d', name: 'UEFA Playoff D winner', code: 'UEFA-D', flag: '🏴', groupId: 'A', isHost: false },
  { id: 'can', name: 'Canada', code: 'CAN', flag: '🇨🇦', groupId: 'B', isHost: true },
  { id: 'bih', name: 'Bosnia and Herzegovina', code: 'BIH', flag: '🇧🇦', groupId: 'Official', isHost: false },
  { id: 'sui', name: 'Switzerland', code: 'SUI', flag: '🇨🇭', groupId: 'B', isHost: false },
  { id: 'qat', name: 'Qatar', code: 'QAT', flag: '🇶🇦', groupId: 'B', isHost: false },
  { id: 'uefa-a', name: 'UEFA Playoff A winner', code: 'UEFA-A', flag: '🏴', groupId: 'B', isHost: false },
  { id: 'bra', name: 'Brazil', code: 'BRA', flag: '🇧🇷', groupId: 'C', isHost: false },
  { id: 'mar', name: 'Morocco', code: 'MAR', flag: '🇲🇦', groupId: 'C', isHost: false },
  { id: 'sco', name: 'Scotland', code: 'SCO', flag: '🏴', groupId: 'C', isHost: false },
  { id: 'hai', name: 'Haiti', code: 'HAI', flag: '🇭🇹', groupId: 'C', isHost: false },
  { id: 'usa', name: 'United States', code: 'USA', flag: '🇺🇸', groupId: 'D', isHost: true },
  { id: 'par', name: 'Paraguay', code: 'PAR', flag: '🇵🇾', groupId: 'D', isHost: false },
  { id: 'aus', name: 'Australia', code: 'AUS', flag: '🇦🇺', groupId: 'D', isHost: false },
  { id: 'uefa-c', name: 'UEFA Playoff C winner', code: 'UEFA-C', flag: '🏴', groupId: 'D', isHost: false },
  { id: 'ger', name: 'Germany', code: 'GER', flag: '🇩🇪', groupId: 'E', isHost: false },
  { id: 'ecu', name: 'Ecuador', code: 'ECU', flag: '🇪🇨', groupId: 'E', isHost: false },
  { id: 'civ', name: 'Ivory Coast', code: 'CIV', flag: '🇨🇮', groupId: 'E', isHost: false },
  { id: 'cuw', name: 'Curacao', code: 'CUW', flag: '🇨🇼', groupId: 'E', isHost: false },
  { id: 'ned', name: 'Netherlands', code: 'NED', flag: '🇳🇱', groupId: 'F', isHost: false },
  { id: 'jpn', name: 'Japan', code: 'JPN', flag: '🇯🇵', groupId: 'F', isHost: false },
  { id: 'tun', name: 'Tunisia', code: 'TUN', flag: '🇹🇳', groupId: 'F', isHost: false },
  { id: 'uefa-b', name: 'UEFA Playoff B winner', code: 'UEFA-B', flag: '🏴', groupId: 'F', isHost: false },
  { id: 'bel', name: 'Belgium', code: 'BEL', flag: '🇧🇪', groupId: 'G', isHost: false },
  { id: 'irn', name: 'Iran', code: 'IRN', flag: '🇮🇷', groupId: 'G', isHost: false },
  { id: 'egy', name: 'Egypt', code: 'EGY', flag: '🇪🇬', groupId: 'G', isHost: false },
  { id: 'nzl', name: 'New Zealand', code: 'NZL', flag: '🇳🇿', groupId: 'G', isHost: false },
  { id: 'esp', name: 'Spain', code: 'ESP', flag: '🇪🇸', groupId: 'H', isHost: false },
  { id: 'uru', name: 'Uruguay', code: 'URU', flag: '🇺🇾', groupId: 'H', isHost: false },
  { id: 'ksa', name: 'Saudi Arabia', code: 'KSA', flag: '🇸🇦', groupId: 'H', isHost: false },
  { id: 'cpv', name: 'Cape Verde', code: 'CPV', flag: '🇨🇻', groupId: 'H', isHost: false },
  { id: 'fra', name: 'France', code: 'FRA', flag: '🇫🇷', groupId: 'I', isHost: false },
  { id: 'sen', name: 'Senegal', code: 'SEN', flag: '🇸🇳', groupId: 'I', isHost: false },
  { id: 'nor', name: 'Norway', code: 'NOR', flag: '🇳🇴', groupId: 'I', isHost: false },
  { id: 'playoff-2', name: 'Inter-confederation Playoff 2 winner', code: 'ICP-2', flag: '🌍', groupId: 'I', isHost: false },
  { id: 'arg', name: 'Argentina', code: 'ARG', flag: '🇦🇷', groupId: 'J', isHost: false },
  { id: 'aut', name: 'Austria', code: 'AUT', flag: '🇦🇹', groupId: 'J', isHost: false },
  { id: 'alg', name: 'Algeria', code: 'ALG', flag: '🇩🇿', groupId: 'J', isHost: false },
  { id: 'jor', name: 'Jordan', code: 'JOR', flag: '🇯🇴', groupId: 'J', isHost: false },
  { id: 'por', name: 'Portugal', code: 'POR', flag: '🇵🇹', groupId: 'K', isHost: false },
  { id: 'col', name: 'Colombia', code: 'COL', flag: '🇨🇴', groupId: 'K', isHost: false },
  { id: 'uzb', name: 'Uzbekistan', code: 'UZB', flag: '🇺🇿', groupId: 'K', isHost: false },
  { id: 'playoff-1', name: 'Inter-confederation Playoff 1 winner', code: 'ICP-1', flag: '🌍', groupId: 'K', isHost: false },
  { id: 'eng', name: 'England', code: 'ENG', flag: '🏴', groupId: 'L', isHost: false },
  { id: 'cro', name: 'Croatia', code: 'CRO', flag: '🇭🇷', groupId: 'L', isHost: false },
  { id: 'pan', name: 'Panama', code: 'PAN', flag: '🇵🇦', groupId: 'L', isHost: false },
  { id: 'gha', name: 'Ghana', code: 'GHA', flag: '🇬🇭', groupId: 'L', isHost: false },
];

export const worldCupGroups: WorldCupGroup[] = [
  { id: 'A', name: 'Group A', teamIds: ['mex', 'kor', 'rsa', 'uefa-d'] },
  { id: 'B', name: 'Group B', teamIds: ['can', 'sui', 'qat', 'uefa-a'] },
  { id: 'C', name: 'Group C', teamIds: ['bra', 'mar', 'sco', 'hai'] },
  { id: 'D', name: 'Group D', teamIds: ['usa', 'par', 'aus', 'uefa-c'] },
  { id: 'E', name: 'Group E', teamIds: ['ger', 'ecu', 'civ', 'cuw'] },
  { id: 'F', name: 'Group F', teamIds: ['ned', 'jpn', 'tun', 'uefa-b'] },
  { id: 'G', name: 'Group G', teamIds: ['bel', 'irn', 'egy', 'nzl'] },
  { id: 'H', name: 'Group H', teamIds: ['esp', 'uru', 'ksa', 'cpv'] },
  { id: 'I', name: 'Group I', teamIds: ['fra', 'sen', 'nor', 'playoff-2'] },
  { id: 'J', name: 'Group J', teamIds: ['arg', 'aut', 'alg', 'jor'] },
  { id: 'K', name: 'Group K', teamIds: ['por', 'col', 'uzb', 'playoff-1'] },
  { id: 'L', name: 'Group L', teamIds: ['eng', 'cro', 'pan', 'gha'] },
];

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
