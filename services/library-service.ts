import { supabase } from "@/lib/supabase";
import type { WorldNewsItem, WorldNewsSectionKey } from "@/types";

/**
 * A signed-in listener's library: favourite stations, the last station they
 * played, and stories saved for later. Row Level Security scopes every query
 * to the signed-in user, so none of these calls filter by user id on reads —
 * the database already refuses to return anyone else's rows.
 */

export type SavedStory = {
  id: string;
  headline: string;
  source: string;
  link: string;
  imageURL: string;
  section: WorldNewsSectionKey;
  publishedAt: string | null;
  savedAt: string;
};

type SavedStoryRow = {
  story_id: string;
  headline: string;
  source: string;
  link: string;
  image_url: string | null;
  section: WorldNewsSectionKey;
  published_at: string | null;
  saved_at: string;
};

function client() {
  if (!supabase) throw new Error("Accounts are not configured.");
  return supabase;
}

const isWebUrl = (value: string) => /^https?:\/\//i.test(value);

// ── favourites ───────────────────────────────────────────────────────────────

export async function fetchFavoriteStationIds(): Promise<string[]> {
  const { data, error } = await client()
    .from("favorite_stations")
    .select("station_id")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => row.station_id as string);
}

export async function addFavoriteStation(userId: string, stationId: string) {
  const { error } = await client()
    .from("favorite_stations")
    .upsert({ user_id: userId, station_id: stationId }, { onConflict: "user_id,station_id", ignoreDuplicates: true });
  if (error) throw error;
}

export async function removeFavoriteStation(userId: string, stationId: string) {
  const { error } = await client()
    .from("favorite_stations")
    .delete()
    .eq("user_id", userId)
    .eq("station_id", stationId);
  if (error) throw error;
}

// ── last station ─────────────────────────────────────────────────────────────

export async function fetchLastStationId(): Promise<string | null> {
  const { data, error } = await client().from("listening_state").select("station_id").maybeSingle();
  if (error) throw error;
  return (data?.station_id as string | undefined) ?? null;
}

export async function saveLastStationId(userId: string, stationId: string) {
  const { error } = await client()
    .from("listening_state")
    .upsert({ user_id: userId, station_id: stationId, updated_at: new Date().toISOString() });
  if (error) throw error;
}

// ── saved stories ────────────────────────────────────────────────────────────

export async function fetchSavedStories(): Promise<SavedStory[]> {
  const { data, error } = await client()
    .from("saved_stories")
    .select("story_id, headline, source, link, image_url, section, published_at, saved_at")
    .order("saved_at", { ascending: false })
    .limit(200);
  if (error) throw error;

  return ((data ?? []) as SavedStoryRow[]).map((row) => ({
    id: row.story_id,
    headline: row.headline,
    source: row.source,
    link: row.link,
    imageURL: row.image_url ?? "",
    section: row.section,
    publishedAt: row.published_at,
    savedAt: row.saved_at
  }));
}

export function toSavedStory(item: WorldNewsItem): SavedStory {
  const published = Date.parse(item.publishedAt);
  return {
    id: item.id.slice(0, 300),
    headline: item.headline.slice(0, 500),
    source: item.source.slice(0, 200),
    link: item.link,
    imageURL: isWebUrl(item.imageURL ?? "") ? item.imageURL : "",
    section: item.section,
    publishedAt: Number.isNaN(published) ? null : new Date(published).toISOString(),
    savedAt: new Date().toISOString()
  };
}

export async function addSavedStory(userId: string, story: SavedStory) {
  const { error } = await client()
    .from("saved_stories")
    .upsert(
      {
        user_id: userId,
        story_id: story.id,
        headline: story.headline,
        source: story.source,
        link: story.link,
        image_url: story.imageURL || null,
        section: story.section,
        published_at: story.publishedAt
      },
      { onConflict: "user_id,story_id", ignoreDuplicates: true }
    );
  if (error) throw error;
}

export async function removeSavedStory(userId: string, storyId: string) {
  const { error } = await client()
    .from("saved_stories")
    .delete()
    .eq("user_id", userId)
    .eq("story_id", storyId);
  if (error) throw error;
}
