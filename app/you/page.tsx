import type { Metadata } from "next";
import { YouPage } from "@/components/library/you-page";

export const metadata: Metadata = {
  title: "You",
  description: "Your stations, the station you were last listening to, and stories saved for later.",
  // Personal page: nothing here for a search engine.
  robots: { index: false, follow: false }
};

export default function Page() {
  return <YouPage />;
}
