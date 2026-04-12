import { FootballTeam } from "@/types";

export type TeamSlug =
  | "manchester-united"
  | "arsenal"
  | "chelsea"
  | "manchester-city";

export type TeamHubConfig = {
  slug: TeamSlug;
  team: FootballTeam;
  badge: string;
  accentText: string;
  accentRing: string;
  heroGradient: string;
  badgeGradient: string;
  surfaceTint: string;
  moodLabel: string;
  moodValue: string;
  moodDescription: string;
  debatePrompts: string[];
};

export const teamHubConfigs: Record<TeamSlug, TeamHubConfig> = {
  "manchester-united": {
    slug: "manchester-united",
    team: "Manchester United",
    badge: "MU",
    accentText: "text-red-700",
    accentRing: "ring-red-200",
    heroGradient: "from-red-700 via-red-600 to-orange-500",
    badgeGradient: "from-red-700 to-orange-500",
    surfaceTint: "bg-red-50/70",
    moodLabel: "Fan mood",
    moodValue: "Loud but hopeful",
    moodDescription: "Every lineup starts a debate, and every win feels like the start of something bigger.",
    debatePrompts: [
      "Does United need more control in midfield or more risk in the final third?",
      "Which player is getting judged too harshly in Addis group chats this week?",
      "What would make this season feel like real progress to fans?"
    ]
  },
  arsenal: {
    slug: "arsenal",
    team: "Arsenal",
    badge: "AFC",
    accentText: "text-rose-700",
    accentRing: "ring-rose-200",
    heroGradient: "from-rose-700 via-red-600 to-amber-400",
    badgeGradient: "from-rose-700 to-red-500",
    surfaceTint: "bg-rose-50/80",
    moodLabel: "Matchday vibe",
    moodValue: "Confident with nerves",
    moodDescription: "Arsenal fans are dreaming big, but every fixture still feels like a season-defining conversation.",
    debatePrompts: [
      "Which Arsenal player is carrying the biggest pressure in the title race?",
      "What is the one thing this squad still needs to go fully elite?",
      "Are fans enjoying the football more than the results right now?"
    ]
  },
  chelsea: {
    slug: "chelsea",
    team: "Chelsea",
    badge: "CFC",
    accentText: "text-blue-700",
    accentRing: "ring-blue-200",
    heroGradient: "from-blue-800 via-blue-700 to-sky-500",
    badgeGradient: "from-blue-800 to-sky-500",
    surfaceTint: "bg-blue-50/80",
    moodLabel: "Fan mood",
    moodValue: "Chaotic optimism",
    moodDescription: "Chelsea timelines move fast: one rumor sparks belief, one bad half starts a full squad audit.",
    debatePrompts: [
      "Which Chelsea youngster deserves more trust right now?",
      "Is the project actually taking shape, or are fans still waiting to see it?",
      "What kind of signing would calm the fan base the fastest?"
    ]
  },
  "manchester-city": {
    slug: "manchester-city",
    team: "Manchester City",
    badge: "MC",
    accentText: "text-sky-700",
    accentRing: "ring-sky-200",
    heroGradient: "from-sky-700 via-cyan-500 to-blue-400",
    badgeGradient: "from-sky-700 to-cyan-400",
    surfaceTint: "bg-sky-50/80",
    moodLabel: "Matchday vibe",
    moodValue: "Calm but demanding",
    moodDescription: "Even comfortable wins still turn into detailed conversations about standards, control, and the next challenge.",
    debatePrompts: [
      "What part of City's game still feels underrated by casual fans?",
      "Does dominance ever make the fan mood too calm, or is that the whole point?",
      "Which fixture actually makes City supporters nervous this month?"
    ]
  }
};

export const footballTeams = Object.values(teamHubConfigs).map((config) => config.team);

export function getTeamHubConfig(slug: TeamSlug) {
  return teamHubConfigs[slug];
}

export function getTeamSlug(team: FootballTeam): TeamSlug {
  return (
    Object.values(teamHubConfigs).find((config) => config.team === team)?.slug ?? "manchester-united"
  );
}
