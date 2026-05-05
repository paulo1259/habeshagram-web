import { NextRequest, NextResponse } from "next/server";

import { getFirebaseAdminDb } from "@/lib/firebase-admin";
import { sendExpoPushNotification } from "@/lib/push-notifications";
import { NotificationItem } from "@/types";

type PushRequestBody = {
  recipientUserId?: string;
  notificationId?: string;
};

function isNotificationLike(value: unknown): value is NotificationItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  // actorUsername, actorName, and actorHandle are all acceptable field names
  // depending on which code path created the notification in Firestore.
  const hasActorDisplay =
    typeof candidate.actorUsername === "string" ||
    typeof candidate.actorName === "string" ||
    typeof candidate.actorHandle === "string";

  return (
    typeof candidate.id === "string" &&
    typeof candidate.type === "string" &&
    typeof candidate.actorUserId === "string" &&
    hasActorDisplay
  );
}

export async function POST(request: NextRequest) {
  try {
    // Shared-secret auth: callers must supply the correct header value.
    // Set PUSH_NOTIFY_SECRET in your Vercel environment variables.
    const secret = process.env.PUSH_NOTIFY_SECRET;
    if (secret) {
      const provided = request.headers.get("x-push-notify-secret");
      if (!provided || provided !== secret) {
        return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
      }
    }

    const body = (await request.json()) as PushRequestBody;
    const recipientUserId = body.recipientUserId?.trim();
    const notificationId = body.notificationId?.trim();

    if (!recipientUserId || !notificationId) {
      return NextResponse.json({ ok: true, skipped: "missing-input" });
    }

    const db = getFirebaseAdminDb();
    const notificationSnapshot = await db
      .collection("users")
      .doc(recipientUserId)
      .collection("notifications")
      .doc(notificationId)
      .get();

    if (!notificationSnapshot.exists) {
      return NextResponse.json({ ok: true, skipped: "missing-notification" });
    }

    const notificationData = notificationSnapshot.data();

    if (!isNotificationLike(notificationData)) {
      return NextResponse.json({ ok: true, skipped: "invalid-notification" });
    }

    await sendExpoPushNotification(recipientUserId, notificationData);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[HabeshaGram][push] Push delivery failed.", error);
    return NextResponse.json({ ok: true, skipped: "push-error" });
  }
}
