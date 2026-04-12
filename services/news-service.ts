import { localNewsItems } from "@/services/discovery-data";
import { LocalNewsItem } from "@/types";

export async function getLocalNewsItems(): Promise<LocalNewsItem[]> {
  // TODO: Replace this seeded fallback with a real fetch layer when you connect
  // live entertainment / culture sources or an internal API route.
  return localNewsItems;
}
