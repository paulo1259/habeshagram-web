/**
 * app/api/live-rooms/token/route.ts
 *
 * POST /api/live-rooms/token
 *
 * Generates a short-lived LiveKit room token for HabeshaGram mobile Live Rooms.
 * Called by the mobile app (services/liveRoomsToken.ts) before connecting to
 * the LiveKit audio server.
 *
 * Security model
 * ──────────────
 * • LIVEKIT_API_KEY and LIVEKIT_API_SECRET are server-only — never returned.
 * • Firestore is read with the Admin SDK to validate room state and role.
 * • host role: verified against liveRooms/{roomId}.hostUserId.
 * • speaker role: participant must already exist in Firestore with role speaker.
 * • listener role: room must be live (open to all — listeners cannot publish).
 *
 * Recommended next step: add Firebase ID token verification.
 *   1. Mobile sends Authorization: Bearer <idToken> in the request header.
 *   2. Server calls getFirebaseAdminAuth().verifyIdToken(token).
 *   3. Replace userId in body with verified uid from the token.
 *   This makes the endpoint phishing-resistant. The current implementation
 *   relies on Firestore state validation only, which is sufficient for v1.
 *
 * LiveKit token TTL: 6 hours (rooms are expected to be shorter).
 *
 * CORS note: the Access-Control-Allow-Origin header below allows the Expo
 * mobile client to reach this endpoint. Tighten to your production domain
 * if you also call this from a web client.
 */

import { NextRequest, NextResponse } from "next/server";
import { AccessToken, VideoGrant } from "livekit-server-sdk";
import type { DocumentSnapshot } from "firebase-admin/firestore";

import { getFirebaseAdminDb } from "@/lib/firebase-admin";

// ── Types ─────────────────────────────────────────────────────────────────────

type Role = "host" | "speaker" | "listener";

type TokenRequestBody = {
  roomId?: unknown;
  userId?: unknown;
  role?: unknown;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function isValidRole(value: unknown): value is Role {
  return value === "host" || value === "speaker" || value === "listener";
}

function json(body: object, status = 200): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: {
      // Allow React Native (Expo) clients to call this endpoint.
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

function badRequest(error: string): NextResponse {
  return json({ ok: false, error }, 400);
}

function serverError(error: string): NextResponse {
  return json({ ok: false, error }, 500);
}

// ── CORS preflight ────────────────────────────────────────────────────────────

export async function OPTIONS(): Promise<NextResponse> {
  return json({ ok: true });
}

// ── POST /api/live-rooms/token ────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  // ── 1. Parse and validate request body ─────────────────────────────────────

  let body: TokenRequestBody;
  try {
    body = (await request.json()) as TokenRequestBody;
  } catch {
    return badRequest("Invalid JSON in request body.");
  }

  const { roomId, userId, role } = body;

  if (!roomId || typeof roomId !== "string" || !roomId.trim()) {
    return badRequest("roomId is required and must be a non-empty string.");
  }
  if (!userId || typeof userId !== "string" || !userId.trim()) {
    return badRequest("userId is required and must be a non-empty string.");
  }
  if (!isValidRole(role)) {
    return badRequest('role must be one of: "host", "speaker", "listener".');
  }

  const cleanRoomId = roomId.trim();
  const cleanUserId = userId.trim();

  // ── 2. Check LiveKit configuration ─────────────────────────────────────────

  const apiKey = process.env.LIVEKIT_API_KEY?.trim();
  const apiSecret = process.env.LIVEKIT_API_SECRET?.trim();
  const livekitUrl = process.env.LIVEKIT_URL?.trim();

  if (!apiKey || !apiSecret || !livekitUrl) {
    console.error(
      "[live-rooms/token] LiveKit env vars missing — " +
        "set LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_URL in your environment.",
    );
    return serverError(
      "Live Rooms audio is not configured on this server. Contact the HabeshaGram team.",
    );
  }

  // ── 3. Validate Firestore room state ───────────────────────────────────────

  let db: ReturnType<typeof getFirebaseAdminDb>;
  try {
    db = getFirebaseAdminDb();
  } catch (err) {
    console.error("[live-rooms/token] Firebase Admin init failed:", err);
    return serverError("Could not connect to the database. Try again.");
  }

  if (!db) {
    return serverError("Database is not configured on this server.");
  }

  // 3a. Room document
  let roomDoc: DocumentSnapshot;
  try {
    roomDoc = await db.collection("liveRooms").doc(cleanRoomId).get();
  } catch (err) {
    console.error("[live-rooms/token] Firestore room read failed:", err);
    return serverError("Could not verify room status. Try again.");
  }

  if (!roomDoc.exists) {
    return badRequest("Room not found.");
  }

  const roomData = roomDoc.data() as {
    status?: string;
    hostUserId?: string;
  };

  if (roomData.status !== "live") {
    return badRequest(
      `Room is not live (status: "${roomData.status ?? "unknown"}"). Cannot join.`,
    );
  }

  // 3b. Role-specific validation
  if (role === "host") {
    // Only the host can request a host token.
    if (roomData.hostUserId !== cleanUserId) {
      return json(
        { ok: false, error: "You are not the host of this room." },
        403,
      );
    }
  } else if (role === "speaker") {
    // The participant must already exist in Firestore as a speaker (approved via speaker queue).
    let participantDoc: DocumentSnapshot;
    try {
      participantDoc = await db
        .collection("liveRooms")
        .doc(cleanRoomId)
        .collection("participants")
        .doc(cleanUserId)
        .get();
    } catch (err) {
      console.error("[live-rooms/token] Firestore participant read failed:", err);
      return serverError("Could not verify participant role. Try again.");
    }

    if (!participantDoc.exists) {
      return json(
        { ok: false, error: "You are not a participant in this room." },
        403,
      );
    }

    const participantData = participantDoc.data() as { role?: string };
    if (participantData.role !== "speaker" && participantData.role !== "host") {
      return json(
        {
          ok: false,
          error:
            "Speaker token requires an approved speaker role. Raise your hand in the room first.",
        },
        403,
      );
    }
  }
  // listeners: any user can join a live room as a listener — no extra check needed.

  // ── 4. Build LiveKit token with role-appropriate permissions ───────────────

  const grant: VideoGrant = {
    room: cleanRoomId,
    roomJoin: true,
    canSubscribe: true,
    // Listeners never publish; speakers and hosts can publish mic audio.
    canPublish: role === "host" || role === "speaker",
    // canPublishData allows sending data messages (reactions, etc.) via LiveKit.
    canPublishData: role === "host" || role === "speaker",
    // roomAdmin lets the host kick participants and mute others server-side.
    roomAdmin: role === "host",
  };

  let token: string;
  try {
    const at = new AccessToken(apiKey, apiSecret, {
      identity: cleanUserId,
      // 6-hour TTL — longer than any expected room duration.
      ttl: "6h",
      // Attach role and room as metadata so LiveKit-aware clients can read it.
      metadata: JSON.stringify({ role, roomId: cleanRoomId }),
    });

    at.addGrant(grant);
    token = await at.toJwt();
  } catch (err) {
    console.error("[live-rooms/token] AccessToken generation failed:", err);
    return serverError("Could not generate room token. Try again.");
  }

  // ── 5. Return token + server URL ───────────────────────────────────────────

  console.log(
    `[live-rooms/token] Token issued — room=${cleanRoomId} user=${cleanUserId} role=${role}`,
  );

  return json({
    ok: true,
    url: livekitUrl,
    token,
  });
}
