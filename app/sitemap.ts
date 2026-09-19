import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

type Route = {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
};

/** Every public route the site has. */
const routes: Route[] = [
  { path: "/", changeFrequency: "hourly", priority: 1 },
  { path: "/world-news", changeFrequency: "hourly", priority: 0.9 },
  { path: "/radio", changeFrequency: "daily", priority: 0.8 },
  { path: "/login", changeFrequency: "yearly", priority: 0.3 },
  { path: "/signup", changeFrequency: "yearly", priority: 0.3 }
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return routes.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority
  }));
}
