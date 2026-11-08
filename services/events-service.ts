import { publicReader, supabase } from "@/lib/supabase";
import { cityTimeZone, isEventCity, type CommunityEvent, type EventCategory, type EventCity } from "@/lib/events/catalogue";

/**
 * Community events in Supabase (public.community_events, migration 0008).
 * Reads run on the server with no session, so they only ever see approved
 * listings. Suggestions are written from the browser as the signed-in user and
 * land as 'pending' until an editor approves them.
 */

type EventRow = {
  id: string;
  title: string;
  city: string;
  category: EventCategory;
  event_date: string;
  start_at: string | null;
  end_at: string | null;
  venue: string;
  address: string | null;
  organizer: string;
  summary: string;
  source_name: string;
  source_url: string;
  checked_on: string;
};

const COLUMNS = "id, title, city, category, event_date, start_at, end_at, venue, address, organizer, summary, source_name, source_url, checked_on";

function toEvent(row: EventRow): CommunityEvent | null {
  // A city the code doesn't know yet has no time zone to show it in; skip it.
  if (!isEventCity(row.city)) return null;
  return {
    id: row.id,
    title: row.title,
    city: row.city,
    category: row.category,
    date: row.event_date,
    timeZone: cityTimeZone[row.city],
    start: row.start_at ?? undefined,
    end: row.end_at ?? undefined,
    venue: row.venue,
    address: row.address ?? undefined,
    organizer: row.organizer,
    summary: row.summary,
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    checkedOn: row.checked_on
  };
}

const toEvents = (rows: EventRow[]) => rows.map(toEvent).filter((event): event is CommunityEvent => event !== null);

/**
 * Approved events from yesterday (UTC) on. The page trims anything that has
 * ended with isUpcoming, which knows each event's local time.
 * Returns null when Supabase isn't configured; throws when the query fails.
 */
export async function fetchUpcomingEvents(): Promise<CommunityEvent[] | null> {
  const db = publicReader();
  if (!db) return null;
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { data, error } = await db
    .from("community_events")
    .select(COLUMNS)
    .gte("event_date", since)
    .order("event_date", { ascending: true })
    .limit(200);
  if (error) throw error;
  return toEvents((data ?? []) as EventRow[]);
}

export async function fetchEvent(id: string): Promise<CommunityEvent | null> {
  const db = publicReader();
  if (!db || !/^[a-z0-9-]{3,100}$/.test(id)) return null;
  const { data, error } = await db.from("community_events").select(COLUMNS).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? toEvent(data as EventRow) : null;
}

/** Every approved event's id, for the sitemap. Past events keep their pages. */
export async function fetchEventIds(): Promise<string[]> {
  const db = publicReader();
  if (!db) return [];
  const { data, error } = await db.from("community_events").select("id").order("event_date", { ascending: false }).limit(1000);
  if (error) throw error;
  return (data ?? []).map((row) => row.id as string);
}

// ── suggestions ──────────────────────────────────────────────────────────────

export type EventSuggestion = {
  title: string;
  city: EventCity;
  category: EventCategory;
  date: string;
  /** ISO instants, already converted from the city's local time. */
  start?: string;
  end?: string;
  venue: string;
  address?: string;
  organizer: string;
  summary: string;
  sourceUrl: string;
};

/** A readable, unique id: "taste-of-ethiopian-coffee-2026-11-14-k3f9". */
export function suggestionId(title: string, date: string) {
  const slug = title.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "event";
  const random = Array.from(crypto.getRandomValues(new Uint8Array(3)), (byte) => (byte % 36).toString(36)).join("");
  return `${slug}-${date}-${random}`.replace(/-+/g, "-");
}

/** "www.eventbrite.com" → "eventbrite.com"; the editor can rename it when approving. */
const sourceName = (url: string) => new URL(url).hostname.replace(/^www\./, "").slice(0, 120);

export class SuggestionLimitError extends Error {}

export async function suggestEvent(input: EventSuggestion): Promise<void> {
  if (!supabase) throw new Error("Accounts are not configured.");
  const { error } = await supabase.from("community_events").insert({
    id: suggestionId(input.title, input.date),
    title: input.title,
    city: input.city,
    category: input.category,
    event_date: input.date,
    start_at: input.start ?? null,
    end_at: input.end ?? null,
    venue: input.venue,
    address: input.address || null,
    organizer: input.organizer,
    summary: input.summary,
    source_name: sourceName(input.sourceUrl),
    source_url: input.sourceUrl
  });
  // 42501: the insert policy refused it, which for a signed-in user means five are already waiting.
  if (error?.code === "42501") throw new SuggestionLimitError(error.message);
  if (error) throw error;
}
