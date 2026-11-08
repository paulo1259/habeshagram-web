/**
 * Community events: the shape of a listing and the pure helpers around it.
 * The listings themselves live in Supabase (public.community_events); see
 * services/events-service.ts. This file has no imports so scripts/check-events
 * can load it on its own.
 */

/** Cities Zema has curated listings for. The database check on community_events.city must match. */
export const eventCities = ["Washington, DC", "Seattle"] as const;
export type EventCity = (typeof eventCities)[number];
export const isEventCity = (value: string | null | undefined): value is EventCity =>
  (eventCities as readonly string[]).includes(value ?? "");

/** Each city's events are shown, and entered, in its local time. */
export const cityTimeZone: Record<EventCity, string> = {
  "Washington, DC": "America/New_York",
  "Seattle": "America/Los_Angeles"
};

export const eventCategories = ["culture", "music", "community"] as const;
export type EventCategory = (typeof eventCategories)[number];

export type CommunityEvent = {
  id: string;
  title: string;
  city: EventCity;
  category: EventCategory;
  /** Local calendar date, YYYY-MM-DD. */
  date: string;
  timeZone: string;
  /** ISO instants. Never inferred: absent until the organizer announces a time. */
  start?: string;
  end?: string;
  venue: string;
  address?: string;
  organizer: string;
  summary: string;
  sourceName: string;
  sourceUrl: string;
  /** When an editor last confirmed the listing against its source, YYYY-MM-DD. */
  checkedOn: string;
};

/** Upcoming until its published end, or through its local date when no end is published. */
export function isUpcoming(event: CommunityEvent, now: Date): boolean {
  if (event.end) return Date.parse(event.end) > now.getTime();
  return event.date >= localDate(now, event.timeZone);
}

/** The calendar date (YYYY-MM-DD) at `now` in a time zone. */
export function localDate(now: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const part = (type: string) => parts.find((value) => value.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

/** Milliseconds the zone is ahead of UTC at `instant`. */
function zoneOffset(instant: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit"
  }).formatToParts(new Date(instant));
  const part = (type: string) => Number(parts.find((value) => value.type === type)!.value);
  return Date.UTC(part("year"), part("month") - 1, part("day"), part("hour"), part("minute"), part("second")) - instant;
}

/** A wall-clock date and time in a zone ("2026-11-14", "17:00") as an ISO instant. */
export function zonedTimeToIso(date: string, time: string, timeZone: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const wall = Date.UTC(year, month - 1, day, hour, minute);
  let instant = wall - zoneOffset(wall, timeZone);
  // Correct once more in case the first guess landed across a DST change.
  instant = wall - zoneOffset(instant, timeZone);
  return new Date(instant).toISOString();
}

export function eventDate(event: CommunityEvent, lang: "en" | "am") {
  return new Intl.DateTimeFormat(lang === "am" ? "am-ET" : "en-US", { timeZone: "UTC", month: "long", day: "numeric", year: "numeric" }).format(new Date(`${event.date}T12:00:00Z`));
}

/** The local start (and end) time, or null when the organizer hasn't announced one. */
export function eventTime(event: CommunityEvent, lang: "en" | "am"): string | null {
  if (!event.start) return null;
  const format = new Intl.DateTimeFormat(lang === "am" ? "am-ET" : "en-US", { timeZone: event.timeZone, hour: "numeric", minute: "2-digit", timeZoneName: "short" });
  return `${format.format(new Date(event.start))}${event.end ? ` – ${format.format(new Date(event.end))}` : ""}`;
}
