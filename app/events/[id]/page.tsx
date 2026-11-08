import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eventById, isUpcoming } from "@/lib/events/catalogue";
import { EventDetail } from "@/components/events/events-page";
export const dynamic = "force-dynamic";
export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const event = eventById(params.id);
  return event ? { title: event.title, description: event.summary, alternates: { canonical: `/events/${event.id}` } } : { title: "Event not found" };
}
export default function EventRoute({ params }: { params: { id: string } }) {
  const event = eventById(params.id);
  if (!event) notFound();
  return <EventDetail event={event} past={!isUpcoming(event, new Date())} />;
}
