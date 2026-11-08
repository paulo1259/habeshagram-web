import type { Metadata } from "next";
import { SuggestEventPage } from "@/components/events/suggest-event-page";

export const metadata: Metadata = {
  title: "Suggest an event",
  description: "Tell Zema about an Ethiopian or Eritrean community event in Washington, DC or Seattle.",
  alternates: { canonical: "/events/suggest" }
};

export default function SuggestEventRoute() {
  return <SuggestEventPage />;
}
