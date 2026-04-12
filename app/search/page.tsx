import { SearchPageClient } from "@/components/search/search-page-client";

export default function SearchPage({
  searchParams
}: {
  searchParams?: { q?: string };
}) {
  return <SearchPageClient initialQuery={searchParams?.q || ""} />;
}
