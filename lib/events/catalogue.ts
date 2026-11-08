/** Cities Zema has curated listings for. Add a city here before listing its events. */
export const eventCities = ["Washington, DC", "Seattle"] as const;
export type EventCity = (typeof eventCities)[number];
export const isEventCity = (value: string | null | undefined): value is EventCity =>
  (eventCities as readonly string[]).includes(value ?? "");

export type CommunityEvent = {
  id: string;
  title: string;
  city: EventCity;
  category: "culture" | "music" | "community";
  date: string;
  timeZone: string;
  start?: string;
  end?: string;
  venue: string;
  address?: string;
  organizer: string;
  summary: string;
  sourceName: string;
  sourceUrl: string;
  checkedOn: string;
};

/** Editorial catalogue. Keep original sources, explicit offsets, and review dates.
 * Never infer a start time or ticket price. Expired listings leave discovery automatically.
 */
export const communityEvents: CommunityEvent[] = [
  {
    id: "taste-of-ethiopian-coffee-2026", title: "Taste of Ethiopian Coffee",
    city: "Washington, DC", category: "culture", date: "2026-11-14", timeZone: "America/New_York",
    start: "2026-11-14T17:00:00-05:00", end: "2026-11-14T21:00:00-05:00",
    venue: "Embassy of Ethiopia", address: "3506 International Dr NW, Washington, DC 20008",
    organizer: "Robe Coffee",
    summary: "An evening exploring Ethiopian coffee through tastings, ceremony and conversations with the coffee community.",
    sourceName: "Ethiopique", sourceUrl: "https://ethiopique.com/event/taste-of-ethiopian-coffee-2/", checkedOn: "2026-11-07"
  },
  {
    id: "meet-the-eris-seattle-november-2026", title: "Meet The Eri’s Seattle",
    city: "Seattle", category: "music", date: "2026-11-28", timeZone: "America/Los_Angeles",
    start: "2026-11-28T22:00:00-08:00",
    venue: "Union N Eritrean and Ethiopian Bar and Restaurant", address: "8824 Renton Avenue South, Seattle, WA 98118",
    organizer: "3ritreanRaider", summary: "A Seattle nightlife gathering for Eritreans and friends. Check the ticket listing for admission requirements and availability.",
    sourceName: "Eventbrite", sourceUrl: "https://www.eventbrite.com/e/meet-the-eris-seattle-1128-tickets-2004029421948", checkedOn: "2026-11-07"
  },
  {
    id: "tigray-seattle-christmas-2026", title: "Christmas Celebration",
    city: "Seattle", category: "community", date: "2026-12-19", timeZone: "America/Los_Angeles",
    venue: "Tigray Community Center, Seattle", organizer: "Tigray Community Seattle",
    summary: "A community holiday gathering with food, cultural performances and activities for children. The organizer has published the date; the start time is not yet listed.",
    sourceName: "Tigray Community Seattle", sourceUrl: "https://tcseattle.org/events", checkedOn: "2026-11-07"
  }
];

export function eventById(id: string) { return communityEvents.find((event) => event.id === id); }

export function isUpcoming(event: CommunityEvent, now: Date): boolean {
  if (event.end) return Date.parse(event.end) > now.getTime();
  // If no end is published, retain the listing through its local calendar date.
  const parts = new Intl.DateTimeFormat("en", { timeZone: event.timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const part = (type: string) => parts.find((value) => value.type === type)!.value;
  return event.date >= `${part("year")}-${part("month")}-${part("day")}`;
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
