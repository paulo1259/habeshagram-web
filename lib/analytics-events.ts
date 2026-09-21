/**
 * lib/analytics-events.ts
 *
 * Product event logger for Zema web. Events go to PostHog alongside the
 * page-level analytics in lib/analytics.ts.
 *
 * The catalogue below is the whole vocabulary. Adding an event means adding it
 * here, which keeps names consistent and stops the dashboard filling up with
 * near-duplicates like `radio_play` / `radioPlay` / `play_radio`.
 *
 * PRIVACY CONTRACT
 * ─────────────────────────────────────────────────────────────────────────────
 * ✅ Tracks: named product events, station and story identifiers, durations,
 *    platform, timestamp, and the Supabase user id when signed in
 * ❌ Never tracks: email, names, search text, audio, precise location,
 *    device identifiers, or the content of anything a user types
 *
 * USAGE — always fire-and-forget:
 *   logEvent("radio_play", user?.id, { station_id: "ethio-fm-1078" });
 */

import { trackEvent } from "./analytics";

export type AnalyticsEventName =
  | "app_open"
  | "home_view"
  | "world_news_view"
  // Radio — fired from the radio hook, the only place that knows the truth
  | "radio_play"
  | "radio_listen"
  | "radio_error"
  | "radio_reconnect"
  | "sleep_timer_set"
  // News
  | "brief_viewed"
  | "story_opened"
  | "brief_listened"
  // Accounts
  | "station_favorited"
  | "story_saved";

export type AnalyticsMetadata = Record<string, string | number | boolean | null | undefined>;

/**
 * Record one product event. Never throws, never blocks rendering.
 * SSR-safe: returns immediately when called server-side.
 */
export function logEvent(
  event: AnalyticsEventName,
  userId?: string | null,
  metadata?: AnalyticsMetadata,
): void {
  if (typeof window === "undefined") return;

  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata ?? {})) {
    if (value !== undefined) clean[key] = value;
  }

  trackEvent(event, {
    platform: "web",
    ...(userId ? { user_id: userId } : {}),
    ...clean,
  });
}
