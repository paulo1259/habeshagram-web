export type WebFighter = {
  id: string;
  name: string;
  nickname?: string;
  country: string;
  record: string;
  weightClass: string;
  summary: string;
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
  redCorner: WebFighter;
  blueCorner: WebFighter;
  note: string;
};

export type WebFightResult = {
  id: string;
  eventName: string;
  headline: string;
  winnerName: string;
  loserName: string;
  method: string;
  round: string;
  timeLabel: string;
  summary: string;
};

export type WebDiscussion = {
  id: string;
  title: string;
  summary: string;
  source: string;
  timeAgo: string;
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
    redCorner: oliveira,
    blueCorner: tsarukyan,
    note:
      "A premium lightweight main event with title pressure, violence, and enough technical tension to drive the whole weekend."
  },
  upcomingFightCards: [
    {
      id: "ufc-309",
      title: "UFC 309",
      dateLabel: "Sat 10:00 PM ET",
      venue: "Las Vegas, Nevada",
      headlineFight: "Oliveira vs Tsarukyan 2",
      note: "The sharpest fight-week card in the lineup, with real stakes and real finishing danger."
    },
    {
      id: "fight-night-omalley",
      title: "UFC Fight Night",
      dateLabel: "Next Wed 8:00 PM ET",
      venue: "Abu Dhabi, UAE",
      headlineFight: "O'Malley vs Dvalishvili",
      note: "A style-clash main event that should light up the clip economy and the scorecard debates."
    },
    {
      id: "fight-night-whittaker",
      title: "UFC Fight Night",
      dateLabel: "Next Sat 9:00 PM ET",
      venue: "Riyadh, Saudi Arabia",
      headlineFight: "Whittaker vs Chimaev",
      note: "A middleweight card built for high-stakes reads, pressure, and instant discourse."
    }
  ],
  recentResults: [
    {
      id: "result-topuria",
      eventName: "UFC 308",
      headline: "Topuria vs Holloway",
      winnerName: "Ilia Topuria",
      loserName: "Max Holloway",
      method: "KO/TKO",
      round: "R3",
      timeLabel: "2:41",
      summary:
        "Topuria landed the sequence everyone spent the rest of the night replaying and pushed his rise into a bigger tier."
    },
    {
      id: "result-whittaker",
      eventName: "UFC Fight Night",
      headline: "Whittaker vs Costa",
      winnerName: "Robert Whittaker",
      loserName: "Paulo Costa",
      method: "Decision",
      round: "R5",
      timeLabel: "5:00",
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
      timeAgo: "18m"
    },
    {
      id: "discussion-2",
      title: "Fight Night cards are becoming better live-room events than some pay-per-views",
      summary:
        "Smaller cards are rewarding close watchers and producing sharper room audio than big-star autopilot weekends.",
      source: "Community Pulse",
      timeAgo: "52m"
    },
    {
      id: "discussion-3",
      title: "Who actually deserves the next bantamweight title shot?",
      summary:
        "The rankings, the momentum, and the clip economy are all pointing in slightly different directions.",
      source: "Fight Week Notes",
      timeAgo: "1h"
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
