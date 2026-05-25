export type WebFighter = {
  id: string;
  name: string;
  nickname?: string;
  country: string;
  record: string;
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

const topuria: WebFighter = {
  id: "topuria",
  name: "Ilia Topuria",
  nickname: "El Matador",
  country: "Spain / Georgia",
  record: "16-0-0",
  weightClass: "Featherweight",
  summary:
    "The kind of finisher who changes the whole temperature of a fight card before the first walkout even starts."
};

const oliveira: WebFighter = {
  id: "oliveira",
  name: "Charles Oliveira",
  nickname: "Do Bronx",
  country: "Brazil",
  record: "35-10-0",
  weightClass: "Lightweight",
  summary:
    "Still one of the most dangerous closers in the sport, especially once the fight gets messy."
};

const tsarukyan: WebFighter = {
  id: "tsarukyan",
  name: "Arman Tsarukyan",
  country: "Armenia",
  record: "22-3-0",
  weightClass: "Lightweight",
  summary:
    "A pressure-heavy contender who makes every title-picture conversation feel more urgent."
};

const oliveiraTsarukyanMainCard: WebFightLineupItem[] = [
  {
    id: "309-co-main",
    fighterAName: "Valentina Shevchenko",
    fighterBName: "Manon Fiorot",
    weightClass: "Women's Flyweight",
    stakes: "Title eliminator energy"
  },
  {
    id: "309-feature",
    fighterAName: "Beneil Dariush",
    fighterBName: "Mateusz Gamrot",
    weightClass: "Lightweight",
    stakes: "Contender reset"
  },
  {
    id: "309-opener",
    fighterAName: "Nassourdine Imavov",
    fighterBName: "Roman Dolidze",
    weightClass: "Middleweight",
    stakes: "Main card opener"
  }
];

const omalleyMerabMainCard: WebFightLineupItem[] = [
  {
    id: "fn-omalley-co-main",
    fighterAName: "Arnold Allen",
    fighterBName: "Brian Ortega",
    weightClass: "Featherweight",
    stakes: "Five-round relevance"
  },
  {
    id: "fn-omalley-feature",
    fighterAName: "Shavkat Rakhmonov",
    fighterBName: "Ian Machado Garry",
    weightClass: "Welterweight",
    stakes: "Next title case"
  }
];

const whittakerChimaevMainCard: WebFightLineupItem[] = [
  {
    id: "fn-whittaker-co-main",
    fighterAName: "Magomed Ankalaev",
    fighterBName: "Jan Blachowicz",
    weightClass: "Light Heavyweight",
    stakes: "No. 1 contender pressure"
  },
  {
    id: "fn-whittaker-feature",
    fighterAName: "Alexa Grasso",
    fighterBName: "Natalia Silva",
    weightClass: "Women's Flyweight",
    stakes: "Statement fight"
  }
];

const featuredPoll: WebMMAPredictionPoll = {
  pollId: "poll-ufc-309-main-event",
  eventId: "ufc-309",
  fightTitle: "Oliveira vs Tsarukyan 2",
  fighterA: "Charles Oliveira",
  fighterB: "Arman Tsarukyan",
  closesAt: "2026-06-01T01:00:00.000Z",
  closesLabel: "Closes at walkout",
  totalVotes: 0,
  methods: ["KO/TKO", "Submission", "Decision"],
  relatedRoomTitle: "309 main card live room",
  options: [
    { id: "oliveira-ko", label: "Oliveira by KO/TKO", fighterName: "Charles Oliveira", method: "KO/TKO" },
    { id: "oliveira-sub", label: "Oliveira by Submission", fighterName: "Charles Oliveira", method: "Submission" },
    { id: "oliveira-dec", label: "Oliveira by Decision", fighterName: "Charles Oliveira", method: "Decision" },
    { id: "tsarukyan-ko", label: "Tsarukyan by KO/TKO", fighterName: "Arman Tsarukyan", method: "KO/TKO" },
    { id: "tsarukyan-sub", label: "Tsarukyan by Submission", fighterName: "Arman Tsarukyan", method: "Submission" },
    { id: "tsarukyan-dec", label: "Tsarukyan by Decision", fighterName: "Arman Tsarukyan", method: "Decision" }
  ]
};

export const mmaHub = {
  featuredFight: {
    id: "featured-fight",
    promotion: "UFC",
    eventName: "UFC 309",
    headline: "Oliveira vs Tsarukyan 2",
    venue: "Las Vegas, Nevada",
    dateLabel: "Sat 10:00 PM ET",
    status: "upcoming" as const,
    weightClass: "Lightweight",
    imageURL:
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80",
    thumbnailURL:
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=800&q=80",
    redCorner: oliveira,
    blueCorner: tsarukyan,
    mainCardFights: oliveiraTsarukyanMainCard,
    discussionPrompt:
      "Does this rematch decide the true next lightweight title challenger, or just reset the whole conversation again?",
    relatedRoomTitle: "309 main card live room",
    note:
      "A premium lightweight main event with title pressure, violence, and enough technical tension to drive the whole weekend."
  } satisfies WebFightCard,
  featuredPoll,
  upcomingFightCards: [
    {
      id: "ufc-309",
      promotion: "UFC",
      eventName: "UFC 309",
      dateLabel: "Sat 10:00 PM ET",
      venue: "Las Vegas, Nevada",
      headlineFight: "Oliveira vs Tsarukyan 2",
      status: "upcoming",
      imageURL:
        "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&w=1200&q=80",
      mainCardFights: oliveiraTsarukyanMainCard,
      discussionPrompt:
        "Which matchup below the main event has the best chance to steal the whole night?",
      relatedRoomTitle: "309 main card live room",
      note: "The sharpest fight-week card in the lineup, with real stakes and real finishing danger."
    },
    {
      id: "fight-night-omalley",
      promotion: "Fight Night",
      eventName: "UFC Fight Night: O'Malley vs Dvalishvili",
      dateLabel: "Next Wed 8:00 PM ET",
      venue: "Abu Dhabi, UAE",
      headlineFight: "O'Malley vs Dvalishvili",
      status: "upcoming",
      imageURL:
        "https://images.unsplash.com/photo-1564415315949-7a0c4c73aab4?auto=format&fit=crop&w=1200&q=80",
      mainCardFights: omalleyMerabMainCard,
      discussionPrompt:
        "Will volume and pace beat pure star power, or does O'Malley still own the biggest moments?",
      relatedRoomTitle: "Bantamweight after dark",
      note: "A style-clash main event that should light up the clip economy and the scorecard debates."
    },
    {
      id: "fight-night-whittaker",
      promotion: "Fight Night",
      eventName: "UFC Fight Night: Whittaker vs Chimaev",
      dateLabel: "Next Sat 9:00 PM ET",
      venue: "Riyadh, Saudi Arabia",
      headlineFight: "Whittaker vs Chimaev",
      status: "upcoming",
      imageURL:
        "https://images.unsplash.com/photo-1517438322307-e67111335449?auto=format&fit=crop&w=1200&q=80",
      mainCardFights: whittakerChimaevMainCard,
      discussionPrompt:
        "Is this the cleanest middleweight contender test of the whole season?",
      relatedRoomTitle: "Middleweight watch circle",
      note: "A middleweight card built for high-stakes reads, pressure, and instant discourse."
    }
  ] satisfies WebUpcomingFightCard[],
  recentResults: [
    {
      id: "result-topuria",
      eventName: "UFC 308",
      headline: "Topuria vs Holloway",
      weightClass: "Featherweight",
      winnerName: "Ilia Topuria",
      loserName: "Max Holloway",
      method: "KO/TKO",
      round: "R3",
      timeLabel: "2:41",
      thumbnailURL:
        "https://images.unsplash.com/photo-1511884642898-4c92249e20b6?auto=format&fit=crop&w=800&q=80",
      summary:
        "Topuria landed the sequence everyone spent the rest of the night replaying and pushed his rise into a bigger tier."
    },
    {
      id: "result-whittaker",
      eventName: "UFC Fight Night",
      headline: "Whittaker vs Costa",
      weightClass: "Middleweight",
      winnerName: "Robert Whittaker",
      loserName: "Paulo Costa",
      method: "Decision",
      round: "R5",
      timeLabel: "5:00",
      thumbnailURL:
        "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=800&q=80",
      summary:
        "Whittaker stayed cleaner for longer, then closed the fight with the kind of veteran control people trust."
    }
  ] satisfies WebFightResult[],
  trendingDiscussions: [
    {
      id: "discussion-1",
      title: "Is lightweight the real center of gravity in the UFC right now?",
      summary:
        "Contender depth, title uncertainty, and finishing danger keep pulling the biggest conversations back here.",
      source: "HabeshaGram MMA Desk",
      timeAgo: "18m",
      discussionPrompt:
        "If the belt is only part of the story, what really makes this division feel must-watch right now?",
      relatedEventId: "ufc-309"
    },
    {
      id: "discussion-2",
      title: "Fight Night cards are becoming better live-room events than some pay-per-views",
      summary:
        "Smaller cards are rewarding close watchers and producing sharper room audio than big-star autopilot weekends.",
      source: "Community Pulse",
      timeAgo: "52m",
      discussionPrompt:
        "Are Fight Night cards actually giving fans the best live-room experience right now?",
      relatedEventId: "fight-night-omalley"
    },
    {
      id: "discussion-3",
      title: "Who actually deserves the next bantamweight title shot?",
      summary:
        "The rankings, the momentum, and the clip economy are all pointing in slightly different directions.",
      source: "Fight Week Notes",
      timeAgo: "1h",
      discussionPrompt:
        "Who has the strongest real claim, not just the loudest clips, in the bantamweight queue?",
      relatedEventId: "fight-night-omalley"
    }
  ] satisfies WebDiscussion[],
  fighterSpotlight: topuria,
  liveRooms: [
    {
      id: "mma-room-1",
      title: "309 main card live room",
      topic: "Round-by-round reactions, scorecards, and the best diaspora fight-night takes.",
      listeners: 184,
      status: "live" as const
    },
    {
      id: "mma-room-2",
      title: "Bantamweight after dark",
      topic: "O'Malley, Merab, and everything that changes after the bell.",
      listeners: 96,
      status: "scheduled" as const
    }
  ] satisfies WebLiveRoomPromo[]
};

export const worldCupPromo: WebWorldCupPromo = {
  enabled: true,
  title: "World Cup Watch",
  subtitle: "A temporary tournament desk that can be promoted from Home without becoming permanent navigation clutter.",
  body:
    "Use this for fixtures, reactions, and special tournament rooms while the tournament is active, then switch it off cleanly later.",
  href: "/world-cup",
  statusLabel: "Temporary hub"
};
