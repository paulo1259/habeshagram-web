import type { Metadata } from "next";
import { SearchPageClient } from "@/components/search/search-page-client";

export const metadata: Metadata = {
  title: "Search",
  description: "Find people, posts, and hashtags across the HabeshaGram community.",
  alternates: { canonical: "/search" }
};

export default function SearchPage({
  searchParams
}: {
  searchParams?: { q?: string };
}) {
  return <SearchPageClient initialQuery={searchParams?.q || ""} />;
}
