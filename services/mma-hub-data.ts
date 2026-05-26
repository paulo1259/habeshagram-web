export type WebFighter = {
  id: string;
  name: string;
  nickname?: string;
  country: string;
  record?: string;
  weightClass: string;
  imageURL?: string;
  summary: string;
};

export type WebFightLineupItem = {
  id: string;
  fighterAName: string;
  fighterBName: string;
  weightClass: string;
  stakes?: string;
};

export type WebFightCard = {
  id: string;
  promotion: string;
  eventName: string;
  headline: string;
  venue: string;
  dateLabel: string;
  status: "live" | "upcoming" | "finished";
  weightClass: string;
  imageURL?: string;
  thumbnailURL?: string;
  redCorner: WebFighter;
  blueCorner: WebFighter;
  mainCardFights: WebFightLineupItem[];
  discussionPrompt?: string;
  relatedRoomTitle?: string;
  note: string;
};

export type WebUpcomingFightCard = {
  id: string;
  promotion: string;
  eventName: string;
  dateLabel: string;
  venue: string;
  headlineFight: string;
  status: "live" | "upcoming" | "finished";
  imageURL?: string;
  thumbnailURL?: string;
  mainCardFights: WebFightLineupItem[];
  discussionPrompt?: string;
  relatedRoomTitle?: string;
  note: string;
};

export type WebFightResult = {
  id: string;
  eventName: string;
  headline: string;
  weightClass: string;
  winnerName: string;
  loserName: string;
  method: string;
  round: string;
  timeLabel: string;
  thumbnailURL?: string;
  summary: string;
};

export type WebDiscussion = {
  id: string;
  title: string;
  summary: string;
  source: string;
  timeAgo: string;
  discussionPrompt?: string;
  relatedEventId?: string;
};

export type WebLiveRoomPromo = {
  id: string;
  title: string;
  topic: string;
  listeners: number;
  status: "live" | "scheduled";
};

export type WebWorldCupPromo = {
  enabled: boolean;
  title: string;
  subtitle: string;
  body: string;
  href: string;
  statusLabel: string;
};

export type WebFightPredictionMethod = "KO/TKO" | "Submission" | "Decision";

export type WebMMAPollOption = {
  id: string;
  label: string;
  fighterName?: string;
  method?: WebFightPredictionMethod;
};

export type WebMMAPredictionPoll = {
  pollId: string;
  eventId: string;
  fightTitle: string;
  fighterA: string;
  fighterB: string;
  closesAt: string;
  closesLabel: string;
  totalVotes: number;
  methods?: WebFightPredictionMethod[];
  relatedRoomTitle?: string;
  options: WebMMAPollOption[];
};

const belalMuhammad: WebFighter = {
  id: "belal-muhammad",
  name: "Belal Muhammad",
  country: "United States",
  weightClass: "Welterweight",
  summary:
    "Verified featured fighter from the UFC Fight Night main event on June 6. HabeshaGram is keeping the desk honest and discussion-first while the official card settles.",
};

const gabrielBonfim: WebFighter = {
  id: "gabriel-bonfim",
  name: "Gabriel Bonfim",
  country: "Brazil",
  weightClass: "Welterweight",
  summary:
    "Verified featured opponent from the same official UFC main event. The matchup matters because UFC has formally attached Bonfim to a former champion in a five-round headliner.",
};

const verifiedMainCardNotes: WebFightLineupItem[] = [
  {
    id: "ufc-june-06-featured",
    fighterAName: "Brendan Allen",
    fighterBName: "Edmen Shahbazyan",
    weightClass: "Middleweight",
    stakes: "Featured bout",
  },
];

export const verifiedUfcEvents: WebUpcomingFightCard[] = [
  {
    id: "ufc-fight-night-june-06-2026",
    promotion: "UFC",
    eventName: "UFC Fight Night: Muhammad vs Bonfim",
    dateLabel: "Sat Jun 6 | 8:00 PM EDT",
    venue: "Meta APEX, Las Vegas",
    headlineFight: "Belal Muhammad vs Gabriel Bonfim",
    status: "upcoming",
    mainCardFights: verifiedMainCardNotes,
    discussionPrompt:
      "Community discussion: does the former champion control the pace, or does the younger contender turn this into a statement night?",
    relatedRoomTitle: "June 6 fight-night room",
    note:
      "Verified on UFC.com. This is the clearest official fight card available right now, so it anchors the whole MMA desk.",
  },
  {
    id: "ufc-fight-night-oklahoma-city-2026",
    promotion: "Fight Night",
    eventName: "UFC Fight Night Oklahoma City",
    dateLabel: "Sat Jul 18 | Official UFC event",
    venue: "Paycom Center, Oklahoma City",
    headlineFight: "Fight card details coming soon.",
    status: "upcoming",
    mainCardFights: [],
    discussionPrompt:
      "Community discussion: which weight class should headline Oklahoma City once UFC reveals the card?",
    relatedRoomTitle: "Oklahoma City fight-week room",
    note:
      "Verified event announcement from UFC. Matchups are still pending official confirmation in the app.",
  },
  {
    id: "ufc-fight-night-abu-dhabi-2026",
    promotion: "Fight Night",
    eventName: "UFC Fight Night Abu Dhabi",
    dateLabel: "Sat Jul 25 | Official UFC event",
    venue: "Etihad Arena, Yas Island",
    headlineFight: "Fight card details coming soon.",
    status: "upcoming",
    mainCardFights: [],
    discussionPrompt:
      "Community discussion: what should UFC save for Abu Dhabi once the official matchups land?",
    relatedRoomTitle: "Abu Dhabi fight-week room",
    note:
      "Verified event announcement from UFC. Full card details are still pending.",
  },
];

export const mmaCommunityPrompts: WebDiscussion[] = [
  {
    id: "mma-discussion-1",
    title: "Community discussion: what kind of win does Muhammad need?",
    summary:
      "This is a curated community prompt tied to the official June 6 main event, not a live-results feed.",
    source: "Curated community prompt",
    timeAgo: "Fight week",
    discussionPrompt:
      "Is a calm five-round win enough here, or does Muhammad need a statement finish to reset the narrative around him?",
    relatedEventId: "ufc-fight-night-june-06-2026",
  },
  {
    id: "mma-discussion-2",
    title: "Community discussion: which summer UFC stop should HabeshaGram rally around next?",
    summary:
      "Oklahoma City and Abu Dhabi are both official UFC events, but the best conversation may come from whichever room the community chooses to build first.",
    source: "Curated community prompt",
    timeAgo: "This week",
    discussionPrompt: "Which official summer event deserves the next Live Room watch circle?",
    relatedEventId: "ufc-fight-night-oklahoma-city-2026",
  },
  {
    id: "mma-discussion-3",
    title: "Community discussion: what makes a fight-night card worth showing up for?",
    summary:
      "Without fake score widgets or invented records, the conversation shifts toward style, stakes, and who people actually trust to deliver.",
    source: "Curated community prompt",
    timeAgo: "Now",
    discussionPrompt: "Do you need a famous main event, or just a matchup that promises real tension?",
  },
];

const mmaLiveRooms: WebLiveRoomPromo[] = [
  {
    id: "mma-room-1",
    title: "June 6 fight-night room",
    topic: "Official event watch circle for Muhammad vs Bonfim, with scorecard reactions and community predictions.",
    listeners: 184,
    status: "scheduled",
  },
  {
    id: "mma-room-2",
    title: "Summer UFC roadmap room",
    topic: "A lighter room for Oklahoma City, Abu Dhabi, and which verified UFC event deserves the next watch party.",
    listeners: 96,
    status: "scheduled",
  },
];

const featuredPoll: WebMMAPredictionPoll = {
  pollId: "poll-ufc-fight-night-june-06-main-event",
  eventId: "ufc-fight-night-june-06-2026",
  fightTitle: "Muhammad vs Bonfim",
  fighterA: "Belal Muhammad",
  fighterB: "Gabriel Bonfim",
  closesAt: "2026-06-07T00:00:00.000Z",
  closesLabel: "Closes before the main event",
  totalVotes: 0,
  methods: ["KO/TKO", "Submission", "Decision"],
  relatedRoomTitle: "June 6 fight-night room",
  options: [
    { id: "muhammad-ko", label: "Muhammad by KO/TKO", fighterName: "Belal Muhammad", method: "KO/TKO" },
    { id: "muhammad-sub", label: "Muhammad by Submission", fighterName: "Belal Muhammad", method: "Submission" },
    { id: "muhammad-dec", label: "Muhammad by Decision", fighterName: "Belal Muhammad", method: "Decision" },
    { id: "bonfim-ko", label: "Bonfim by KO/TKO", fighterName: "Gabriel Bonfim", method: "KO/TKO" },
    { id: "bonfim-sub", label: "Bonfim by Submission", fighterName: "Gabriel Bonfim", method: "Submission" },
    { id: "bonfim-dec", label: "Bonfim by Decision", fighterName: "Gabriel Bonfim", method: "Decision" },
  ],
};

export const mmaHub = {
  featuredFight: {
    id: "featured-fight-verified",
    promotion: "UFC",
    eventName: "UFC Fight Night: Muhammad vs Bonfim",
    headline: "Muhammad vs Bonfim",
    venue: "Meta APEX, Las Vegas",
    dateLabel: "Sat Jun 6 | 8:00 PM EDT",
    status: "upcoming" as const,
    weightClass: "Welterweight",
    redCorner: belalMuhammad,
    blueCorner: gabrielBonfim,
    mainCardFights: verifiedMainCardNotes,
    discussionPrompt:
      "Community discussion: does this official main event feel like a veteran control fight or a contender breakthrough spot?",
    relatedRoomTitle: "June 6 fight-night room",
    note:
      "Verified from the UFC official event page. HabeshaGram is centering the desk on one official headliner instead of pretending to know more than UFC has published.",
  } satisfies WebFightCard,
  featuredPoll,
  upcomingFightCards: verifiedUfcEvents,
  recentResults: [] as WebFightResult[],
  trendingDiscussions: mmaCommunityPrompts,
  fighterSpotlight: {
    id: "fighter-spotlight-muhammad",
    name: "Belal Muhammad",
    country: "United States",
    weightClass: "Welterweight",
    summary:
      "Community spotlight: the featured UFC event is built around Muhammad, so this week the conversation is less about records and more about what a former champion still looks like in a five-round headliner.",
  } satisfies WebFighter,
  liveRooms: mmaLiveRooms,
  sourceLabel: "Source: UFC official events / curated community prompts",
  communityLabel: "Community discussion",
};

export const worldCupPromo: WebWorldCupPromo = {
  enabled: true,
  title: "World Cup Watch",
  subtitle: "A temporary tournament desk promoted from Home, not a permanent nav commitment.",
  body:
    "Use this for verified FIFA fixtures, community prompts, and tournament rooms while the World Cup is active, then switch it off cleanly later.",
  href: "/world-cup",
  statusLabel: "Temporary hub",
};
