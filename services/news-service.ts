import { breakingItems, dailyDebatePrompts, footballBuzzItems, localNewsItems } from "@/services/discovery-data";
import { BreakingItem, DailyDebatePrompt, FootballNewsItem, FootballTeam, LocalNewsItem } from "@/types";

export async function getLocalNewsItems(): Promise<LocalNewsItem[]> {
  // TODO: Replace this seeded fallback with a real fetch layer when you connect
  // live entertainment / culture sources or an internal API route.
  return localNewsItems;
}

export async function getFootballBuzzItems(): Promise<FootballNewsItem[]> {
  // TODO: Replace this seeded fallback with a real football/news fetch layer or
  // an internal API route when live sources are connected.
  return footballBuzzItems;
}

export async function getFootballBuzzByTeam(team: FootballTeam): Promise<FootballNewsItem[]> {
  const items = await getFootballBuzzItems();
  return items.filter((item) => item.team === team);
}

export async function getBreakingItems(team?: FootballTeam): Promise<BreakingItem[]> {
  try {
    const query = team ? `?team=${encodeURIComponent(team)}` : "";
    const response = await fetch(`/api/news/breaking${query}`, {
      method: "GET",
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Breaking feed request failed with ${response.status}.`);
    }

    const payload = (await response.json()) as { items?: BreakingItem[] };
    return payload.items?.length
      ? payload.items
      : team
        ? breakingItems.filter((item) => item.team === team || !item.team)
        : breakingItems;
  } catch {
    return team ? breakingItems.filter((item) => item.team === team || !item.team) : breakingItems;
  }
}

export async function getDailyDebates(team?: FootballTeam): Promise<DailyDebatePrompt[]> {
  // TODO: Replace this seeded layer with editorial CMS or API-backed prompts when the content layer matures.
  const items = team
    ? dailyDebatePrompts.filter((item) => item.team === team || !item.team)
    : dailyDebatePrompts;

  if (!items.length) {
    return [];
  }

  const daySeed = new Date().getUTCDate() + new Date().getUTCMonth() * 31;
  const startIndex = daySeed % items.length;
  const rotated = [...items.slice(startIndex), ...items.slice(0, startIndex)];
  return rotated.slice(0, Math.min(team ? 3 : 4, rotated.length));
}
