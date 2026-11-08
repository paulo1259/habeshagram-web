import { Suspense } from "react";
import type { Metadata } from "next";
import { EventsPage } from "@/components/events/events-page";
import type { CommunityEvent } from "@/lib/events/catalogue";
import { fetchUpcomingEvents } from "@/services/events-service";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Community events", description: "Explore Ethiopian and Eritrean community events in Washington, DC and Seattle, with sources and calendar reminders.", alternates: { canonical: "/events" } };

export default async function EventsRoute() {
  let events: CommunityEvent[] = [];
  let unavailable = false;
  try {
    const loaded = await fetchUpcomingEvents();
    if (loaded) events = loaded; else unavailable = true;
  } catch (error) {
    console.error("[events] could not load listings", error);
    unavailable = true;
  }
  return <Suspense fallback={<p className="p-8">Loading events…</p>}>
    <EventsPage events={events} unavailable={unavailable} initialNow={new Date().toISOString()} />
  </Suspense>;
}
