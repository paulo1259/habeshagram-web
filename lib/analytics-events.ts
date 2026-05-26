/**
 * lib/analytics-events.ts
 *
 * Firestore-backed event logger for HabeshaGram web.
 * Writes to the shared `analyticsEvents` collection, which the admin
 * /admin/insights page queries via the Firebase Admin SDK.
 *
 * This is intentionally separate from lib/analytics.ts (PostHog) — PostHog
 * handles web-level page analytics; this handles product events that appear
 * in the admin insights panel alongside mobile events.
 *
 * PRIVACY CONTRACT
 * ─────────────────────────────────────────────────────────────────────────────
 * ✅ Tracks: named product events, optional content IDs, platform, timestamp
 * ❌ Never tracks: message content, audio, search query text, device IDs,
 *    private conversations, microphone access, location data
 *
 * USAGE — always fire-and-forget:
 *   logEvent('home_view', user?.uid);
 *   logEvent('reel_like', user?.uid, { reelId: short.id });
 */

import { addDoc, collection, Timestamp } from "firebase/firestore";

import { firebaseDb } from "./firebase";

// ── Event catalogue ───────────────────────────────────────────────────────────

export type AnalyticsEventName =
  | "app_open"
  | "home_view"
  | "reels_open"
  | "reel_play"
  | "reel_like"
  | "radio_play"
  | "mma_hub_open"
  | "world_cup_hub_open"
  | "live_room_join"
  | "post_create"
  | "comment_create"
  | "follow_user"
  | "search_use";

export interface AnalyticsMetadata {
  reelId?: string;
  roomId?: string;
  matchId?: string;
  teamId?: string;
}

// ── Core logger ───────────────────────────────────────────────────────────────

/**
 * Write one analytics event to Firestore. Never throws, never blocks rendering.
 * SSR-safe: returns immediately if called server-side (window undefined).
 */
export function logEvent(
  event: AnalyticsEventName,
  userId?: string | null,
  metadata?: AnalyticsMetadata,
): void {
  if (typeof window === "undefined" || !firebaseDb) return;

  const doc: Record<string, unknown> = {
    event,
    timestamp: Timestamp.now(),
    platform: "web",
  };

  if (userId) doc.userId = userId;
  if (metadata && Object.keys(metadata).length > 0) doc.metadata = metadata;

  addDoc(collection(firebaseDb, "analyticsEvents"), doc).catch(() => {
    // silent — analytics must never break UX
  });
}
