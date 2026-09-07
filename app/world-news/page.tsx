import type { Metadata } from "next";
import { WorldNewsPage } from "@/components/world-news/world-news-page";

export const metadata: Metadata = {
  title: "World News",
  description:
    "Ethiopia, East Africa, and Habesha diaspora headlines, refreshed from trusted feeds with an optional AI briefing.",
  alternates: { canonical: "/world-news" },
  openGraph: {
    title: "World News · HabeshaGram",
    description:
      "Ethiopia, East Africa, and Habesha diaspora headlines, refreshed from trusted feeds with an optional AI briefing.",
    url: "/world-news"
  }
};

export default function WorldNewsRoute() {
  return <WorldNewsPage />;
}
