/**
 * lib/analytics-events.ts
 *
 * Product event logger for Zema web.
 *
 * This used to write into a Firestore `analyticsEvents` collection that the
 * admin insights page read back. Both are gone, so events now go to PostHog
 * alongside the page-level analytics in lib/analytics.ts. The `logEvent`
 * signature is unchanged so callers did not need touching.
 *
 * PRIVACY CONTRACT
 * ─────────────────────────────────────────────────────────────────────────────
 * ✅ Tracks: named product events, optional content IDs, platform, timestamp
 * ❌ Never tracks: message content, audio, search query text, device IDs,
 *    private conversations, microphone access, location data
 *
 * USAGE — always fire-and-forget:
 *   logEvent('home_view', user?.id);
 */

import { trackEvent } from "./analytics";

export type AnalyticsEventName =
  | "app_open"
  | "home_view"
  | "radio_play"
  | "world_news_view";

export interface AnalyticsMetadata {
  stationId?: string;
  section?: string;
}

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

  trackEvent(event, {
    platform: "web",
    ...(userId ? { user_id: userId } : {}),
    ...(metadata ?? {}),
  });
}
