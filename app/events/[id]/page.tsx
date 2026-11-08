import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isUpcoming } from "@/lib/events/catalogue";
import { EventDetail } from "@/components/events/events-page";
import { fetchEvent } from "@/services/events-service";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const event = await fetchEvent(params.id).catch(() => null);
  return event ? { title: event.title, description: event.summary, alternates: { canonical: `/events/${event.id}` } } : { title: "Event not found" };
}

export default async function EventRoute({ params }: { params: { id: string } }) {
  const event = await fetchEvent(params.id);
  if (!event) notFound();
  return <EventDetail event={event} past={!isUpcoming(event, new Date())} />;
}
