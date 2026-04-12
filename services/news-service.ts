import { footballBuzzItems, localNewsItems } from "@/services/discovery-data";
import { FootballNewsItem, FootballTeam, LocalNewsItem } from "@/types";

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
