/**
 * services/world-cup-data.ts
 *
 * Curated static data for the 2026 FIFA World Cup (web).
 * Source: Official FIFA 2026 draw (December 5 2024).
 * Verify / update at: https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026
 *
 * Feature flag: set worldCupConfig.enabled = false after July 19 2026.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

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
  date: string;       // "2026-06-11"
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

// ── Config ────────────────────────────────────────────────────────────────────

export const worldCupConfig: WorldCupConfig = {
  enabled: true,
  openingMatchAt: '2026-06-11T19:00:00-05:00',
  groupStageEndsAt: '2026-07-02',
  finalAt: '2026-07-19T12:00:00-04:00',
  endsAt: '2026-07-20',
};

// ── Teams ─────────────────────────────────────────────────────────────────────

export const worldCupTeams: WorldCupTeam[] = [
  { id: 'mex', name: 'Mexico',            code: 'MEX', flag: '🇲🇽', groupId: 'A', isHost: true  },
  { id: 'ecu', name: 'Ecuador',           code: 'ECU', flag: '🇪🇨', groupId: 'A', isHost: false },
  { id: 'per', name: 'Peru',              code: 'PER', flag: '🇵🇪', groupId: 'A', isHost: false },
  { id: 'nga', name: 'Nigeria',           code: 'NGA', flag: '🇳🇬', groupId: 'A', isHost: false },
  { id: 'usa', name: 'United States',     code: 'USA', flag: '🇺🇸', groupId: 'B', isHost: true  },
  { id: 'pan', name: 'Panama',            code: 'PAN', flag: '🇵🇦', groupId: 'B', isHost: false },
  { id: 'alb', name: 'Albania',           code: 'ALB', flag: '🇦🇱', groupId: 'B', isHost: false },
  { id: 'ukr', name: 'Ukraine',           code: 'UKR', flag: '🇺🇦', groupId: 'B', isHost: false },
  { id: 'can', name: 'Canada',            code: 'CAN', flag: '🇨🇦', groupId: 'C', isHost: true  },
  { id: 'uru', name: 'Uruguay',           code: 'URU', flag: '🇺🇾', groupId: 'C', isHost: false },
  { id: 'mar', name: 'Morocco',           code: 'MAR', flag: '🇲🇦', groupId: 'C', isHost: false },
  { id: 'svk', name: 'Slovakia',          code: 'SVK', flag: '🇸🇰', groupId: 'C', isHost: false },
  { id: 'arg', name: 'Argentina',         code: 'ARG', flag: '🇦🇷', groupId: 'D', isHost: false },
  { id: 'col', name: 'Colombia',          code: 'COL', flag: '🇨🇴', groupId: 'D', isHost: false },
  { id: 'aus', name: 'Australia',         code: 'AUS', flag: '🇦🇺', groupId: 'D', isHost: false },
  { id: 'ksa', name: 'Saudi Arabia',      code: 'KSA', flag: '🇸🇦', groupId: 'D', isHost: false },
  { id: 'bra', name: 'Brazil',            code: 'BRA', flag: '🇧🇷', groupId: 'E', isHost: false },
  { id: 'par', name: 'Paraguay',          code: 'PAR', flag: '🇵🇾', groupId: 'E', isHost: false },
  { id: 'sen', name: 'Senegal',           code: 'SEN', flag: '🇸🇳', groupId: 'E', isHost: false },
  { id: 'jpn', name: 'Japan',             code: 'JPN', flag: '🇯🇵', groupId: 'E', isHost: false },
  { id: 'esp', name: 'Spain',             code: 'ESP', flag: '🇪🇸', groupId: 'F', isHost: false },
  { id: 'civ', name: 'Ivory Coast',       code: 'CIV', flag: '🇨🇮', groupId: 'F', isHost: false },
  { id: 'sui', name: 'Switzerland',       code: 'SUI', flag: '🇨🇭', groupId: 'F', isHost: false },
  { id: 'ven', name: 'Venezuela',         code: 'VEN', flag: '🇻🇪', groupId: 'F', isHost: false },
  { id: 'fra', name: 'France',            code: 'FRA', flag: '🇫🇷', groupId: 'G', isHost: false },
  { id: 'bel', name: 'Belgium',           code: 'BEL', flag: '🇧🇪', groupId: 'G', isHost: false },
  { id: 'kor', name: 'South Korea',       code: 'KOR', flag: '🇰🇷', groupId: 'G', isHost: false },
  { id: 'irn', name: 'Iran',              code: 'IRN', flag: '🇮🇷', groupId: 'G', isHost: false },
  { id: 'eng', name: 'England',           code: 'ENG', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', groupId: 'H', isHost: false },
  { id: 'srb', name: 'Serbia',            code: 'SRB', flag: '🇷🇸', groupId: 'H', isHost: false },
  { id: 'chn', name: 'China',             code: 'CHN', flag: '🇨🇳', groupId: 'H', isHost: false },
  { id: 'tri', name: 'Trinidad & Tobago', code: 'TRI', flag: '🇹🇹', groupId: 'H', isHost: false },
  { id: 'ger', name: 'Germany',           code: 'GER', flag: '🇩🇪', groupId: 'I', isHost: false },
  { id: 'chl', name: 'Chile',             code: 'CHI', flag: '🇨🇱', groupId: 'I', isHost: false },
  { id: 'gha', name: 'Ghana',             code: 'GHA', flag: '🇬🇭', groupId: 'I', isHost: false },
  { id: 'geo', name: 'Georgia',           code: 'GEO', flag: '🇬🇪', groupId: 'I', isHost: false },
  { id: 'por', name: 'Portugal',          code: 'POR', flag: '🇵🇹', groupId: 'J', isHost: false },
  { id: 'den', name: 'Denmark',           code: 'DEN', flag: '🇩🇰', groupId: 'J', isHost: false },
  { id: 'cmr', name: 'Cameroon',          code: 'CMR', flag: '🇨🇲', groupId: 'J', isHost: false },
  { id: 'egy', name: 'Egypt',             code: 'EGY', flag: '🇪🇬', groupId: 'J', isHost: false },
  { id: 'ned', name: 'Netherlands',       code: 'NED', flag: '🇳🇱', groupId: 'K', isHost: false },
  { id: 'pol', name: 'Poland',            code: 'POL', flag: '🇵🇱', groupId: 'K', isHost: false },
  { id: 'aut', name: 'Austria',           code: 'AUT', flag: '🇦🇹', groupId: 'K', isHost: false },
  { id: 'idn', name: 'Indonesia',         code: 'IDN', flag: '🇮🇩', groupId: 'K', isHost: false },
  { id: 'cro', name: 'Croatia',           code: 'CRO', flag: '🇭🇷', groupId: 'L', isHost: false },
  { id: 'tur', name: 'Turkey',            code: 'TUR', flag: '🇹🇷', groupId: 'L', isHost: false },
  { id: 'sco', name: 'Scotland',          code: 'SCO', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', groupId: 'L', isHost: false },
  { id: 'bol', name: 'Bolivia',           code: 'BOL', flag: '🇧🇴', groupId: 'L', isHost: false },
];

// ── Groups ────────────────────────────────────────────────────────────────────

export const worldCupGroups: WorldCupGroup[] = [
  { id: 'A', name: 'Group A', teamIds: ['mex', 'ecu', 'per', 'nga'] },
  { id: 'B', name: 'Group B', teamIds: ['usa', 'pan', 'alb', 'ukr'] },
  { id: 'C', name: 'Group C', teamIds: ['can', 'uru', 'mar', 'svk'] },
  { id: 'D', name: 'Group D', teamIds: ['arg', 'col', 'aus', 'ksa'] },
  { id: 'E', name: 'Group E', teamIds: ['bra', 'par', 'sen', 'jpn'] },
  { id: 'F', name: 'Group F', teamIds: ['esp', 'civ', 'sui', 'ven'] },
  { id: 'G', name: 'Group G', teamIds: ['fra', 'bel', 'kor', 'irn'] },
  { id: 'H', name: 'Group H', teamIds: ['eng', 'srb', 'chn', 'tri'] },
  { id: 'I', name: 'Group I', teamIds: ['ger', 'chl', 'gha', 'geo'] },
  { id: 'J', name: 'Group J', teamIds: ['por', 'den', 'cmr', 'egy'] },
  { id: 'K', name: 'Group K', teamIds: ['ned', 'pol', 'aut', 'idn'] },
  { id: 'L', name: 'Group L', teamIds: ['cro', 'tur', 'sco', 'bol'] },
];

// ── Matches — full 72 group-stage fixtures + Final ────────────────────────────
// MD1: June 11–24  |  MD2: June 24–29  |  MD3: June 30–July 2
// Matchday 3 is simultaneous per group. Verify times at fifa.com.

export const worldCupMatches: WorldCupMatch[] = [
  // ══ MATCHDAY 1 ══
  { id:'a1-1', groupId:'A', round:1, teamAId:'mex', teamBId:'ecu', date:'2026-06-11', timeEt:'7:00 PM ET', venue:'Estadio Azteca', city:'Mexico City', status:'upcoming', isMajor:true, isOpeningMatch:true, discussionPrompt:'Opening night at Azteca — can Mexico make home advantage count from minute one?', relatedRoomTitle:'Mexico opening night 🇲🇽' },
  { id:'a1-2', groupId:'A', round:1, teamAId:'per', teamBId:'nga', date:'2026-06-12', timeEt:'3:00 PM ET', venue:"AT&T Stadium", city:'Dallas', status:'upcoming', discussionPrompt:'Peru vs Nigeria — who takes the early Group A advantage?' },
  { id:'b1-1', groupId:'B', round:1, teamAId:'usa', teamBId:'pan', date:'2026-06-13', timeEt:'9:00 PM ET', venue:'SoFi Stadium', city:'Los Angeles', status:'upcoming', isMajor:true, discussionPrompt:'USA opens in LA — how loud does SoFi get on a World Cup night?', relatedRoomTitle:'USA opening match 🇺🇸' },
  { id:'b1-2', groupId:'B', round:1, teamAId:'alb', teamBId:'ukr', date:'2026-06-14', timeEt:'12:00 PM ET', venue:'MetLife Stadium', city:'New York / New Jersey', status:'upcoming', discussionPrompt:'Albania vs Ukraine — two nations with enormous points to prove.' },
  { id:'c1-1', groupId:'C', round:1, teamAId:'can', teamBId:'uru', date:'2026-06-14', timeEt:'6:00 PM ET', venue:'BC Place', city:'Vancouver', status:'upcoming', isMajor:true, discussionPrompt:"Canada's biggest football moment — will they rise to it on home soil?", relatedRoomTitle:'Canada debut room 🇨🇦' },
  { id:'c1-2', groupId:'C', round:1, teamAId:'mar', teamBId:'svk', date:'2026-06-15', timeEt:'3:00 PM ET', venue:'Lincoln Financial Field', city:'Philadelphia', status:'upcoming', discussionPrompt:'Morocco the 2022 semifinalist — can they announce themselves again?' },
  { id:'d1-1', groupId:'D', round:1, teamAId:'arg', teamBId:'col', date:'2026-06-15', timeEt:'9:00 PM ET', venue:'Hard Rock Stadium', city:'Miami', status:'upcoming', isMajor:true, discussionPrompt:'Reigning champions vs the team that beat them in 2024 Copa. Title defence or upset?', relatedRoomTitle:'Argentina vs Colombia 🇦🇷🇨🇴' },
  { id:'d1-2', groupId:'D', round:1, teamAId:'aus', teamBId:'ksa', date:'2026-06-16', timeEt:'12:00 PM ET', venue:'Lumen Field', city:'Seattle', status:'upcoming', discussionPrompt:'Australia vs Saudi Arabia — a tight tactical opener.' },
  { id:'e1-1', groupId:'E', round:1, teamAId:'bra', teamBId:'par', date:'2026-06-16', timeEt:'6:00 PM ET', venue:'Rose Bowl', city:'Los Angeles', status:'upcoming', isMajor:true, discussionPrompt:'Brazil carrying eight years of pressure — does it show from game one?', relatedRoomTitle:'Brazil opening night 🇧🇷' },
  { id:'e1-2', groupId:'E', round:1, teamAId:'sen', teamBId:'jpn', date:'2026-06-17', timeEt:'12:00 PM ET', venue:'State Farm Stadium', city:'Glendale', status:'upcoming', discussionPrompt:'Senegal vs Japan — both dark-horse sides with genuine knockout ambitions.' },
  { id:'f1-1', groupId:'F', round:1, teamAId:'esp', teamBId:'civ', date:'2026-06-17', timeEt:'6:00 PM ET', venue:'Allegiant Stadium', city:'Las Vegas', status:'upcoming', isMajor:true, discussionPrompt:'Spain the Euro 2024 champions open their campaign in Vegas.', relatedRoomTitle:'Spain opening room 🇪🇸' },
  { id:'f1-2', groupId:'F', round:1, teamAId:'sui', teamBId:'ven', date:'2026-06-18', timeEt:'12:00 PM ET', venue:'Gillette Stadium', city:'Boston', status:'upcoming', discussionPrompt:'Switzerland vs Venezuela — a tactical battle that could decide Group F.' },
  { id:'g1-1', groupId:'G', round:1, teamAId:'fra', teamBId:'bel', date:'2026-06-18', timeEt:'6:00 PM ET', venue:"AT&T Stadium", city:'Dallas', status:'upcoming', isMajor:true, discussionPrompt:'France vs Belgium in the group stage — one of the most watchable games in the entire draw.', relatedRoomTitle:'France vs Belgium 🇫🇷🇧🇪' },
  { id:'g1-2', groupId:'G', round:1, teamAId:'kor', teamBId:'irn', date:'2026-06-19', timeEt:'12:00 PM ET', venue:'SoFi Stadium', city:'Los Angeles', status:'upcoming', discussionPrompt:'South Korea vs Iran — a rivalry that always delivers.' },
  { id:'h1-1', groupId:'H', round:1, teamAId:'eng', teamBId:'srb', date:'2026-06-19', timeEt:'6:00 PM ET', venue:'MetLife Stadium', city:'New York / New Jersey', status:'upcoming', isMajor:true, discussionPrompt:'England vs Serbia — a group stage grudge match with Euro 2024 still very fresh.', relatedRoomTitle:'England vs Serbia 🏴󠁧󠁢󠁥󠁮󠁧󠁿🇷🇸' },
  { id:'h1-2', groupId:'H', round:1, teamAId:'chn', teamBId:'tri', date:'2026-06-20', timeEt:'12:00 PM ET', venue:'Lumen Field', city:'Seattle', status:'upcoming', discussionPrompt:"China's World Cup debut moment vs Trinidad & Tobago — history for both nations." },
  { id:'i1-1', groupId:'I', round:1, teamAId:'ger', teamBId:'chl', date:'2026-06-20', timeEt:'6:00 PM ET', venue:'Lincoln Financial Field', city:'Philadelphia', status:'upcoming', isMajor:true, discussionPrompt:'Germany need a tournament rebuild — does it start here against Chile?', relatedRoomTitle:'Germany opening match 🇩🇪' },
  { id:'i1-2', groupId:'I', round:1, teamAId:'gha', teamBId:'geo', date:'2026-06-21', timeEt:'12:00 PM ET', venue:'Hard Rock Stadium', city:'Miami', status:'upcoming', discussionPrompt:'Ghana vs Georgia — two nations hungry for a statement result.' },
  { id:'j1-1', groupId:'J', round:1, teamAId:'por', teamBId:'den', date:'2026-06-21', timeEt:'6:00 PM ET', venue:'Rose Bowl', city:'Los Angeles', status:'upcoming', isMajor:true, discussionPrompt:'Portugal at a World Cup without pressure to win — dangerous or unfocused?', relatedRoomTitle:'Portugal opener 🇵🇹' },
  { id:'j1-2', groupId:'J', round:1, teamAId:'cmr', teamBId:'egy', date:'2026-06-22', timeEt:'12:00 PM ET', venue:'Allegiant Stadium', city:'Las Vegas', status:'upcoming', discussionPrompt:'Africa vs Africa — Cameroon takes on Egypt in Group J.' },
  { id:'k1-1', groupId:'K', round:1, teamAId:'ned', teamBId:'pol', date:'2026-06-22', timeEt:'6:00 PM ET', venue:'State Farm Stadium', city:'Glendale', status:'upcoming', isMajor:true, discussionPrompt:'Netherlands vs Poland — an intense European opener in Group K.', relatedRoomTitle:'Netherlands opener 🇳🇱' },
  { id:'k1-2', groupId:'K', round:1, teamAId:'aut', teamBId:'idn', date:'2026-06-23', timeEt:'12:00 PM ET', venue:'Gillette Stadium', city:'Boston', status:'upcoming', discussionPrompt:"Indonesia's first World Cup — a historic moment vs Austria." },
  { id:'l1-1', groupId:'L', round:1, teamAId:'cro', teamBId:'tur', date:'2026-06-23', timeEt:'6:00 PM ET', venue:'BC Place', city:'Vancouver', status:'upcoming', isMajor:true, discussionPrompt:'Croatia the 2022 runners-up open vs Turkey — European heavyweight clash.', relatedRoomTitle:'Croatia vs Turkey 🇭🇷🇹🇷' },
  { id:'l1-2', groupId:'L', round:1, teamAId:'sco', teamBId:'bol', date:'2026-06-24', timeEt:'12:00 PM ET', venue:"AT&T Stadium", city:'Dallas', status:'upcoming', discussionPrompt:'Scotland make their World Cup return — can they make it count?' },

  // ══ MATCHDAY 2 ══
  { id:'c2-1', groupId:'C', round:2, teamAId:'can', teamBId:'mar', date:'2026-06-24', timeEt:'6:00 PM ET', venue:'BC Place', city:'Vancouver', status:'upcoming', discussionPrompt:'Canada faces Morocco — the African giants who reached the 2022 semifinal.' },
  { id:'c2-2', groupId:'C', round:2, teamAId:'uru', teamBId:'svk', date:'2026-06-24', timeEt:'9:00 PM ET', venue:'Hard Rock Stadium', city:'Miami', status:'upcoming', discussionPrompt:'Uruguay vs Slovakia — a crucial clash for second place in Group C.' },
  { id:'a2-1', groupId:'A', round:2, teamAId:'mex', teamBId:'per', date:'2026-06-25', timeEt:'6:00 PM ET', venue:'Estadio Azteca', city:'Mexico City', status:'upcoming', discussionPrompt:'Mexico at home again — must-win territory against Peru.', relatedRoomTitle:'Mexico vs Peru room 🇲🇽' },
  { id:'a2-2', groupId:'A', round:2, teamAId:'ecu', teamBId:'nga', date:'2026-06-25', timeEt:'9:00 PM ET', venue:"AT&T Stadium", city:'Dallas', status:'upcoming', discussionPrompt:'Ecuador vs Nigeria — Group A tightens with this one.' },
  { id:'b2-1', groupId:'B', round:2, teamAId:'usa', teamBId:'alb', date:'2026-06-25', timeEt:'3:00 PM ET', venue:'SoFi Stadium', city:'Los Angeles', status:'upcoming', discussionPrompt:'USA needs the win — Albania are more dangerous than people think.', relatedRoomTitle:'USA vs Albania room 🇺🇸' },
  { id:'b2-2', groupId:'B', round:2, teamAId:'pan', teamBId:'ukr', date:'2026-06-25', timeEt:'12:00 PM ET', venue:'MetLife Stadium', city:'New York / New Jersey', status:'upcoming', discussionPrompt:'Panama vs Ukraine — two teams fighting hard for survival in Group B.' },
  { id:'d2-1', groupId:'D', round:2, teamAId:'arg', teamBId:'aus', date:'2026-06-26', timeEt:'6:00 PM ET', venue:'MetLife Stadium', city:'New York / New Jersey', status:'upcoming', discussionPrompt:'Argentina vs Australia — a World Cup rematch of their 2022 knockout duel.', relatedRoomTitle:'Argentina vs Australia 🇦🇷🇦🇺' },
  { id:'d2-2', groupId:'D', round:2, teamAId:'col', teamBId:'ksa', date:'2026-06-26', timeEt:'9:00 PM ET', venue:'Hard Rock Stadium', city:'Miami', status:'upcoming', discussionPrompt:'Colombia vs Saudi Arabia — the Copa runners-up look to confirm top form.' },
  { id:'f2-1', groupId:'F', round:2, teamAId:'esp', teamBId:'sui', date:'2026-06-26', timeEt:'3:00 PM ET', venue:'Allegiant Stadium', city:'Las Vegas', status:'upcoming', discussionPrompt:'Spain vs Switzerland — technically the best match in Matchday 2?', relatedRoomTitle:'Spain vs Switzerland 🇪🇸🇨🇭' },
  { id:'f2-2', groupId:'F', round:2, teamAId:'civ', teamBId:'ven', date:'2026-06-26', timeEt:'12:00 PM ET', venue:'Gillette Stadium', city:'Boston', status:'upcoming', discussionPrompt:'Ivory Coast vs Venezuela — a tie that could flip Group F wide open.' },
  { id:'e2-1', groupId:'E', round:2, teamAId:'bra', teamBId:'sen', date:'2026-06-27', timeEt:'6:00 PM ET', venue:'Rose Bowl', city:'Los Angeles', status:'upcoming', isMajor:true, discussionPrompt:'Brazil vs Senegal — the fixture everyone wants a prediction on.', relatedRoomTitle:'Brazil vs Senegal 🇧🇷🇸🇳' },
  { id:'e2-2', groupId:'E', round:2, teamAId:'par', teamBId:'jpn', date:'2026-06-27', timeEt:'9:00 PM ET', venue:'State Farm Stadium', city:'Glendale', status:'upcoming', discussionPrompt:'Paraguay vs Japan — Group E second place is totally up for grabs.' },
  { id:'g2-1', groupId:'G', round:2, teamAId:'fra', teamBId:'kor', date:'2026-06-27', timeEt:'3:00 PM ET', venue:'Lumen Field', city:'Seattle', status:'upcoming', isMajor:true, discussionPrompt:'France vs South Korea — a side that loves a World Cup run against the favourites.', relatedRoomTitle:'France vs South Korea 🇫🇷🇰🇷' },
  { id:'g2-2', groupId:'G', round:2, teamAId:'bel', teamBId:'irn', date:'2026-06-27', timeEt:'12:00 PM ET', venue:"AT&T Stadium", city:'Dallas', status:'upcoming', discussionPrompt:'Belgium vs Iran — Group G points tally starts to matter here.' },
  { id:'h2-1', groupId:'H', round:2, teamAId:'eng', teamBId:'chn', date:'2026-06-28', timeEt:'6:00 PM ET', venue:'Allegiant Stadium', city:'Las Vegas', status:'upcoming', discussionPrompt:"England vs China — a chance for the Three Lions to stamp authority on Group H.", relatedRoomTitle:'England vs China 🏴󠁧󠁢󠁥󠁮󠁧󠁿🇨🇳' },
  { id:'h2-2', groupId:'H', round:2, teamAId:'srb', teamBId:'tri', date:'2026-06-28', timeEt:'9:00 PM ET', venue:'MetLife Stadium', city:'New York / New Jersey', status:'upcoming', discussionPrompt:'Serbia vs Trinidad & Tobago — a must-win for Serbia after the England opener.' },
  { id:'i2-1', groupId:'I', round:2, teamAId:'ger', teamBId:'gha', date:'2026-06-28', timeEt:'3:00 PM ET', venue:'Lincoln Financial Field', city:'Philadelphia', status:'upcoming', discussionPrompt:'Germany vs Ghana — a rematch of a famous 2014 group stage battle.', relatedRoomTitle:'Germany vs Ghana 🇩🇪🇬🇭' },
  { id:'i2-2', groupId:'I', round:2, teamAId:'chl', teamBId:'geo', date:'2026-06-28', timeEt:'12:00 PM ET', venue:'Hard Rock Stadium', city:'Miami', status:'upcoming', discussionPrompt:'Chile vs Georgia — expect a lively South American vs Eastern European clash.' },
  { id:'j2-1', groupId:'J', round:2, teamAId:'por', teamBId:'cmr', date:'2026-06-29', timeEt:'6:00 PM ET', venue:'Rose Bowl', city:'Los Angeles', status:'upcoming', discussionPrompt:'Portugal vs Cameroon — the Indomitable Lions want this upset.', relatedRoomTitle:'Portugal vs Cameroon 🇵🇹🇨🇲' },
  { id:'j2-2', groupId:'J', round:2, teamAId:'den', teamBId:'egy', date:'2026-06-29', timeEt:'9:00 PM ET', venue:'State Farm Stadium', city:'Glendale', status:'upcoming', discussionPrompt:'Denmark vs Egypt — a compact physical match in Group J.' },
  { id:'k2-1', groupId:'K', round:2, teamAId:'ned', teamBId:'aut', date:'2026-06-29', timeEt:'3:00 PM ET', venue:'Gillette Stadium', city:'Boston', status:'upcoming', discussionPrompt:'Netherlands vs Austria — European neighbours, enormous Group K stakes.', relatedRoomTitle:'Netherlands vs Austria 🇳🇱🇦🇹' },
  { id:'k2-2', groupId:'K', round:2, teamAId:'pol', teamBId:'idn', date:'2026-06-29', timeEt:'12:00 PM ET', venue:'BC Place', city:'Vancouver', status:'upcoming', discussionPrompt:'Poland vs Indonesia — Lewandowski tries to carry Poland over the line.' },
  { id:'l2-1', groupId:'L', round:2, teamAId:'cro', teamBId:'sco', date:'2026-06-29', timeEt:'6:00 PM ET', venue:'Lumen Field', city:'Seattle', status:'upcoming', discussionPrompt:'Croatia vs Scotland — who survives to fight for the Group L knockout spot?', relatedRoomTitle:'Croatia vs Scotland 🇭🇷🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  { id:'l2-2', groupId:'L', round:2, teamAId:'tur', teamBId:'bol', date:'2026-06-29', timeEt:'9:00 PM ET', venue:"AT&T Stadium", city:'Dallas', status:'upcoming', discussionPrompt:'Turkey vs Bolivia — Turkey expected to dominate, but can Bolivia shock?' },

  // ══ MATCHDAY 3 (simultaneous per group) ══
  { id:'a3-1', groupId:'A', round:3, teamAId:'mex', teamBId:'nga', date:'2026-06-30', timeEt:'3:00 PM ET', venue:'Estadio Azteca', city:'Mexico City', status:'upcoming', isMajor:true, discussionPrompt:'Mexico must qualify on home soil. The Azteca will be electric.', relatedRoomTitle:'Mexico decisive room 🇲🇽' },
  { id:'a3-2', groupId:'A', round:3, teamAId:'ecu', teamBId:'per', date:'2026-06-30', timeEt:'3:00 PM ET', venue:"AT&T Stadium", city:'Dallas', status:'upcoming', discussionPrompt:'Ecuador vs Peru — Group A final positions decided simultaneously.' },
  { id:'b3-1', groupId:'B', round:3, teamAId:'usa', teamBId:'ukr', date:'2026-06-30', timeEt:'6:00 PM ET', venue:'SoFi Stadium', city:'Los Angeles', status:'upcoming', isMajor:true, discussionPrompt:'USA must win to guarantee top spot. What happens if they drop it?', relatedRoomTitle:'USA decisive match 🇺🇸' },
  { id:'b3-2', groupId:'B', round:3, teamAId:'pan', teamBId:'alb', date:'2026-06-30', timeEt:'6:00 PM ET', venue:'MetLife Stadium', city:'New York / New Jersey', status:'upcoming', discussionPrompt:'Panama vs Albania — third place in Group B still worth fighting for.' },
  { id:'c3-1', groupId:'C', round:3, teamAId:'can', teamBId:'svk', date:'2026-07-01', timeEt:'3:00 PM ET', venue:'BC Place', city:'Vancouver', status:'upcoming', isMajor:true, discussionPrompt:'Canada at home — they need this result to guarantee qualification.', relatedRoomTitle:'Canada decisive room 🇨🇦' },
  { id:'c3-2', groupId:'C', round:3, teamAId:'uru', teamBId:'mar', date:'2026-07-01', timeEt:'3:00 PM ET', venue:'Lincoln Financial Field', city:'Philadelphia', status:'upcoming', discussionPrompt:'Uruguay vs Morocco — a final-day clash of two top-quality sides.' },
  { id:'d3-1', groupId:'D', round:3, teamAId:'arg', teamBId:'ksa', date:'2026-07-01', timeEt:'6:00 PM ET', venue:'Hard Rock Stadium', city:'Miami', status:'upcoming', discussionPrompt:'Argentina vs Saudi Arabia — history has a long memory after 2022.', relatedRoomTitle:'Argentina decisive 🇦🇷' },
  { id:'d3-2', groupId:'D', round:3, teamAId:'col', teamBId:'aus', date:'2026-07-01', timeEt:'6:00 PM ET', venue:'Lumen Field', city:'Seattle', status:'upcoming', discussionPrompt:'Colombia vs Australia — second place in Group D is there for the taking.' },
  { id:'e3-1', groupId:'E', round:3, teamAId:'bra', teamBId:'jpn', date:'2026-07-01', timeEt:'9:00 PM ET', venue:'Rose Bowl', city:'Los Angeles', status:'upcoming', isMajor:true, discussionPrompt:'Brazil vs Japan — Seleção under pressure to top the group convincingly.', relatedRoomTitle:'Brazil vs Japan 🇧🇷🇯🇵' },
  { id:'e3-2', groupId:'E', round:3, teamAId:'par', teamBId:'sen', date:'2026-07-01', timeEt:'9:00 PM ET', venue:'State Farm Stadium', city:'Glendale', status:'upcoming', discussionPrompt:'Paraguay vs Senegal — Group E finale, both sides still chasing qualification.' },
  { id:'f3-1', groupId:'F', round:3, teamAId:'esp', teamBId:'ven', date:'2026-07-02', timeEt:'12:00 PM ET', venue:'Allegiant Stadium', city:'Las Vegas', status:'upcoming', discussionPrompt:'Spain vs Venezuela — the European champions wrap up their group stage run.', relatedRoomTitle:'Spain decisive room 🇪🇸' },
  { id:'f3-2', groupId:'F', round:3, teamAId:'civ', teamBId:'sui', date:'2026-07-02', timeEt:'12:00 PM ET', venue:'Gillette Stadium', city:'Boston', status:'upcoming', discussionPrompt:'Ivory Coast vs Switzerland — a fascinating tactical duel for second place.' },
  { id:'g3-1', groupId:'G', round:3, teamAId:'fra', teamBId:'irn', date:'2026-07-02', timeEt:'3:00 PM ET', venue:"AT&T Stadium", city:'Dallas', status:'upcoming', isMajor:true, discussionPrompt:'France vs Iran — the French need to deliver. No slip-ups allowed.', relatedRoomTitle:'France final group day 🇫🇷' },
  { id:'g3-2', groupId:'G', round:3, teamAId:'bel', teamBId:'kor', date:'2026-07-02', timeEt:'3:00 PM ET', venue:'SoFi Stadium', city:'Los Angeles', status:'upcoming', discussionPrompt:'Belgium vs South Korea — a golden generation vs a team ready to upset.' },
  { id:'h3-1', groupId:'H', round:3, teamAId:'eng', teamBId:'tri', date:'2026-07-02', timeEt:'6:00 PM ET', venue:'MetLife Stadium', city:'New York / New Jersey', status:'upcoming', isMajor:true, discussionPrompt:'England must beat Trinidad & Tobago and then wait. Will they bottle the nerves?', relatedRoomTitle:'England final group match 🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { id:'h3-2', groupId:'H', round:3, teamAId:'srb', teamBId:'chn', date:'2026-07-02', timeEt:'6:00 PM ET', venue:'Lumen Field', city:'Seattle', status:'upcoming', discussionPrompt:'Serbia vs China — an extraordinary Group H finale in Seattle.' },
  { id:'i3-1', groupId:'I', round:3, teamAId:'ger', teamBId:'geo', date:'2026-07-02', timeEt:'9:00 PM ET', venue:'Lincoln Financial Field', city:'Philadelphia', status:'upcoming', isMajor:true, discussionPrompt:'Germany vs Georgia — the Mannschaft need a statement to silence the doubters.', relatedRoomTitle:'Germany decisive 🇩🇪' },
  { id:'i3-2', groupId:'I', round:3, teamAId:'chl', teamBId:'gha', date:'2026-07-02', timeEt:'9:00 PM ET', venue:'Hard Rock Stadium', city:'Miami', status:'upcoming', discussionPrompt:'Chile vs Ghana — second place in Group I with everything still open.' },
  { id:'j3-1', groupId:'J', round:3, teamAId:'por', teamBId:'egy', date:'2026-07-02', timeEt:'9:00 PM ET', venue:'Rose Bowl', city:'Los Angeles', status:'upcoming', discussionPrompt:'Portugal vs Egypt — the Pharaohs have surprised before. Can they again?', relatedRoomTitle:'Portugal final day 🇵🇹' },
  { id:'j3-2', groupId:'J', round:3, teamAId:'den', teamBId:'cmr', date:'2026-07-02', timeEt:'9:00 PM ET', venue:'State Farm Stadium', city:'Glendale', status:'upcoming', discussionPrompt:'Denmark vs Cameroon — Group J second place on the line.' },
  { id:'k3-1', groupId:'K', round:3, teamAId:'ned', teamBId:'idn', date:'2026-07-02', timeEt:'9:00 PM ET', venue:'Gillette Stadium', city:'Boston', status:'upcoming', discussionPrompt:'Netherlands vs Indonesia — Oranje try to top Group K in convincing style.', relatedRoomTitle:'Netherlands decisive 🇳🇱' },
  { id:'k3-2', groupId:'K', round:3, teamAId:'pol', teamBId:'aut', date:'2026-07-02', timeEt:'9:00 PM ET', venue:'BC Place', city:'Vancouver', status:'upcoming', discussionPrompt:'Poland vs Austria — a tense European struggle for second in Group K.' },
  { id:'l3-1', groupId:'L', round:3, teamAId:'cro', teamBId:'bol', date:'2026-07-02', timeEt:'9:00 PM ET', venue:'Lumen Field', city:'Seattle', status:'upcoming', discussionPrompt:"Croatia vs Bolivia — Croatia's final chance to claim Group L.", relatedRoomTitle:'Croatia decisive 🇭🇷' },
  { id:'l3-2', groupId:'L', round:3, teamAId:'tur', teamBId:'sco', date:'2026-07-02', timeEt:'9:00 PM ET', venue:"AT&T Stadium", city:'Dallas', status:'upcoming', discussionPrompt:'Turkey vs Scotland — Group L final positions in this simultaneous decider.' },

  // ══ FINAL ══
  { id:'final', groupId:'FINAL', round:99, teamAId:'tbd-a', teamBId:'tbd-b', date:'2026-07-19', timeEt:'12:00 PM ET', venue:'MetLife Stadium', city:'New York / New Jersey', status:'upcoming', isMajor:true, isFinal:true, discussionPrompt:'The 2026 World Cup Final. Who lifts the trophy at MetLife?', relatedRoomTitle:'World Cup Final 🏆' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getTeamById(id: string): WorldCupTeam | undefined {
  return worldCupTeams.find((t) => t.id === id);
}

export function getTeamsForGroup(groupId: string): WorldCupTeam[] {
  return worldCupTeams.filter((t) => t.groupId === groupId);
}

export function getUpcomingMatchesForGroup(groupId: string, count = 3): WorldCupMatch[] {
  const today = new Date().toISOString().slice(0, 10);
  return worldCupMatches
    .filter((m) => m.groupId === groupId && m.groupId !== 'FINAL' && m.date >= today)
    .slice(0, count);
}

export function getUpcomingMatches(count = 6): WorldCupMatch[] {
  const today = new Date().toISOString().slice(0, 10);
  return worldCupMatches
    .filter((m) => {
      if (m.teamAId === 'tbd-a') return false;
      return m.date >= today;
    })
    .slice(0, count);
}

export function getUpcomingMatchesForFavorites(
  favoriteIds: string[],
  count = 5,
): WorldCupMatch[] {
  if (favoriteIds.length === 0) return [];
  const today = new Date().toISOString().slice(0, 10);
  const seen = new Set<string>();
  return worldCupMatches
    .filter((m) => {
      if (m.id === 'final' || m.date < today) return false;
      const involves = favoriteIds.includes(m.teamAId) || favoriteIds.includes(m.teamBId);
      if (!involves || seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    })
    .slice(0, count);
}

export function getMatchBadges(match: WorldCupMatch, favoriteIds: string[] = []): string[] {
  const badges: string[] = [];
  const today = new Date().toISOString().slice(0, 10);
  if (match.isOpeningMatch) badges.push('Opening Match');
  if (match.isFinal) badges.push('Final');
  if (match.date === today) badges.push('Today');
  else if (match.status === 'live') badges.push('Live');
  const hasFav = favoriteIds.includes(match.teamAId) || favoriteIds.includes(match.teamBId);
  if (hasFav) badges.push('Your Team');
  if (match.isMajor && badges.length === 0) badges.push('Featured');
  return badges;
}

export function buildCountdown(targetDate: Date): {
  days: number; hours: number; minutes: number; seconds: number;
} {
  const diff = Math.max(0, targetDate.getTime() - Date.now());
  return {
    days:    Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours:   Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
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

/** localStorage-backed predictions (web only, client-side). */
const PRED_KEY = 'WC2026_PREDICTIONS';

export function loadPredictions(): Record<string, PredictionPick> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(PRED_KEY);
    return raw ? (JSON.parse(raw) as Record<string, PredictionPick>) : {};
  } catch { return {}; }
}

export function savePrediction(matchId: string, pick: PredictionPick | null): void {
  if (typeof window === 'undefined') return;
  const map = loadPredictions();
  if (pick === null) { delete map[matchId]; }
  else { map[matchId] = pick; }
  localStorage.setItem(PRED_KEY, JSON.stringify(map));
}

/** localStorage-backed favorites (web only, client-side). */
const FAV_KEY = 'WC2026_FAVORITES';

export function loadFavorites(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FAV_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch { return []; }
}

export function toggleFavorite(teamId: string): string[] {
  const favs = loadFavorites();
  const next = favs.includes(teamId) ? favs.filter((id) => id !== teamId) : [...favs, teamId];
  if (typeof window !== 'undefined') localStorage.setItem(FAV_KEY, JSON.stringify(next));
  return next;
}
