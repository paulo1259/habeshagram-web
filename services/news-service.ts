import { footballBuzzItems } from "@/services/discovery-data";
import { getEditorialLocalHighlights } from "@/services/editorial-content-service";
import { getDailyDebatePrompts } from "@/services/daily-debate-service";
import { BreakingItem, DailyDebatePrompt, FootballNewsItem, FootballTeam, LocalNewsItem } from "@/types";

export async function getLocalNewsItems(): Promise<LocalNewsItem[]> {
  return getEditorialLocalHighlights();
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
    return payload.items ?? [];
  } catch {
    return [];
  }
}

export async function getDailyDebates(team?: FootballTeam): Promise<DailyDebatePrompt[]> {
  return getDailyDebatePrompts(team);
}
