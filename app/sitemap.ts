import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";
import { fetchEventIds } from "@/services/events-service";
import { radioStations } from "@/services/discovery-data";

type Route = {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
};

/** Every public route the site has. */
const routes: Route[] = [
  { path: "/", changeFrequency: "hourly", priority: 1 },
  { path: "/world-news", changeFrequency: "hourly", priority: 0.9 },
  { path: "/events", changeFrequency: "daily", priority: 0.8 },
  { path: "/radio", changeFrequency: "daily", priority: 0.8 },
  { path: "/login", changeFrequency: "yearly", priority: 0.3 },
  { path: "/signup", changeFrequency: "yearly", priority: 0.3 }
];

/** Re-read the event list hourly rather than on every crawl. */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  const stationRoutes: Route[] = radioStations.map((station) => ({
    path: `/radio/${station.id}`,
    changeFrequency: "daily",
    priority: 0.7
  }));

  const eventIds = await fetchEventIds().catch((error) => {
    console.error("[sitemap] could not load event ids", error);
    return [] as string[];
  });
  const eventRoutes: Route[] = eventIds.map((id) => ({
    path: `/events/${id}`,
    changeFrequency: "weekly",
    priority: 0.6
  }));

  return [...routes, ...stationRoutes, ...eventRoutes].map((route) => ({
    url: absoluteUrl(route.path),
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority
  }));
}
