import type { MetadataRoute } from "next";
import { siteDescription, siteName, siteTagline } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${siteName} — ${siteTagline}`,
    short_name: siteName,
    description: siteDescription,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b0908",
    theme_color: "#0b0908",
    categories: ["social", "news", "music", "entertainment"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ],
    shortcuts: [
      { name: "World News", url: "/world-news" },
      { name: "Radio", url: "/radio" },
      { name: "Create a post", url: "/create" }
    ]
  };
}
