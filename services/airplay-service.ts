"use client";

import { supabase } from "@/lib/supabase";

/**
 * "Aired today" — what a station has actually played, as recorded every two
 * minutes by the `record-airplay` Edge Function (supabase/functions).
 *
 * Each row is one title: when it was first heard and when it was last seen.
 * A row seen within the last few minutes is what is on right now.
 */

export type AirplayEntry = {
  id: number;
  title: string;
  startedAt: Date;
  lastSeenAt: Date;
};

type AirplayRow = {
  id: number;
  title: string;
  started_at: string;
  last_seen_at: string;
};

/** The recorder runs every 2 minutes; anything seen within 5 is still on. */
export const ON_NOW_WINDOW_MS = 5 * 60 * 1000;

export const AIRPLAY_WINDOW_HOURS = 24;

export async function fetchAirplay(stationId: string): Promise<AirplayEntry[] | null> {
  if (!supabase) {
    return null;
  }

  const since = new Date(Date.now() - AIRPLAY_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("station_airplay")
    .select("id, title, started_at, last_seen_at")
    .eq("station_id", stationId)
    .gte("last_seen_at", since)
    .order("started_at", { ascending: false })
    .limit(300);

  if (error) {
    throw error;
  }

  return ((data ?? []) as AirplayRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    startedAt: new Date(row.started_at),
    lastSeenAt: new Date(row.last_seen_at)
  }));
}

export function isOnNow(entry: AirplayEntry, now = Date.now()) {
  return now - entry.lastSeenAt.getTime() < ON_NOW_WINDOW_MS;
}
