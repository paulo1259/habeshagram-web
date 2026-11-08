import { Suspense } from "react";
import type { Metadata } from "next";
import { EventsPage } from "@/components/events/events-page";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Community events", description: "Explore Ethiopian and Eritrean community events in Washington, DC and Seattle, with sources and calendar reminders.", alternates: { canonical: "/events" } };
export default function EventsRoute() { return <Suspense fallback={<p className="p-8">Loading events…</p>}><EventsPage initialNow={new Date().toISOString()} /></Suspense>; }
