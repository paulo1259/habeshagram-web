import "server-only";

import { getFirebaseAdminDb } from "@/lib/firebase-admin";
import { NotificationItem } from "@/types";

const EXPO_PUSH_ENDPOINT = "https://exp.host/--/api/v2/push/send";

type PushPayload = {
  title: string;
  body: string;
  data: Record<string, string>;
};

function isExpoPushToken(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^(ExponentPushToken|ExpoPushToken)\[[^\]]+\]$/.test(value.trim())
  );
}

function normalizePushTokens(data: Record<string, unknown>) {
  const tokens = new Set<string>();

  if (isExpoPushToken(data.expoPushToken)) {
    tokens.add(data.expoPushToken.trim());
  }

  if (Array.isArray(data.pushTokens)) {
    data.pushTokens.forEach((entry) => {
      if (isExpoPushToken(entry)) {
        tokens.add(entry.trim());
      }
    });
  }

  return [...tokens];
}

function buildNotificationHref(notification: NotificationItem) {
  if ((notification.type === "like" || notification.type === "comment") && notification.targetPostId) {
    return `/post/${notification.targetPostId}`;
  }

  if (notification.type === "follow" && notification.actorUserId) {
    return `/member/${notification.actorUserId}`;
  }

  return "/notifications";
}

function resolveActorDisplay(notification: NotificationItem): string {
  // Firestore may store the actor's display name under different field names
  // depending on which code path created the notification. Support all variants.
  const raw =
    (notification as unknown as Record<string, unknown>).actorUsername ??
    (notification as unknown as Record<string, unknown>).actorName ??
    (notification as unknown as Record<string, unknown>).actorHandle ??
    "Someone";
  const name = typeof raw === "string" && raw.trim() ? raw.trim() : "Someone";
  return name.startsWith("@") ? name : `@${name}`;
}

function buildPushPayload(notification: NotificationItem): PushPayload {
  const actorHandle = resolveActorDisplay(notification);

  const body =
    notification.type === "like"
      ? `${actorHandle} liked your post`
      : notification.type === "comment"
        ? `${actorHandle} commented on your post`
        : `${actorHandle} followed you`;

  return {
    title: "HabeshaGram",
    body,
    data: {
      type: notification.type,
      href: buildNotificationHref(notification),
      ...(notification.targetPostId ? { postId: notification.targetPostId } : {}),
      ...(notification.actorUserId ? { actorUserId: notification.actorUserId, userId: notification.actorUserId } : {})
    }
  };
}

export async function getUserExpoPushTokens(recipientUserId: string) {
  if (!recipientUserId) {
    return [];
  }

  const db = getFirebaseAdminDb();
  const userSnapshot = await db.collection("users").doc(recipientUserId).get();

  if (!userSnapshot.exists) {
    return [];
  }

  return normalizePushTokens(userSnapshot.data() ?? {});
}

export async function sendExpoPushNotification(
  recipientUserId: string,
  notification: NotificationItem
) {
  const tokens = await getUserExpoPushTokens(recipientUserId);

  if (!tokens.length) {
    return { delivered: false as const, reason: "no-token" as const };
  }

  const payload = buildPushPayload(notification);
  const messages = tokens.map((token) => ({
    to: token,
    sound: "default",
    title: payload.title,
    body: payload.body,
    data: payload.data
  }));

  const response = await fetch(EXPO_PUSH_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(messages)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Expo push request failed with ${response.status}: ${text}`);
  }

  return { delivered: true as const, tokenCount: tokens.length };
}
