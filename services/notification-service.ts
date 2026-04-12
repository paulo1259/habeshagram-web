import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore";
import { firebaseDb, isFirebaseConfigured } from "@/lib/firebase";
import { createId } from "@/lib/utils";
import { readState, writeState } from "@/services/local-store";
import { NotificationItem, User } from "@/types";

const FIRESTORE_TIMEOUT_MS = 5000;

async function withFirestoreTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), FIRESTORE_TIMEOUT_MS);
      })
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

function mapNotificationError(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";

  switch (code) {
    case "permission-denied":
    case "firestore/permission-denied":
      return "This action is blocked by your current Firestore rules. Update your notification permissions and try again.";
    default:
      return error instanceof Error ? error.message : "Unable to load notifications right now.";
  }
}

function mapNotification(
  id: string,
  data: Partial<NotificationItem> & { createdAt?: string | { toDate?: () => Date; seconds?: number } }
): NotificationItem {
  const rawCreatedAt = data.createdAt;
  let createdAt = new Date().toISOString();

  if (typeof rawCreatedAt === "string") {
    createdAt = rawCreatedAt;
  } else if (rawCreatedAt && typeof rawCreatedAt === "object") {
    const timestampLike = rawCreatedAt as { toDate?: () => Date; seconds?: number };

    if (typeof timestampLike.toDate === "function") {
      createdAt = timestampLike.toDate().toISOString();
    } else if (typeof timestampLike.seconds === "number") {
      createdAt = new Date(timestampLike.seconds * 1000).toISOString();
    }
  }

  return {
    id,
    type: data.type || "like",
    recipientUserId: data.recipientUserId,
    actorUserId: data.actorUserId || "",
    actorUsername: data.actorUsername || "habesha_user",
    actorProfileImageURL: data.actorProfileImageURL || "",
    targetPostId: data.targetPostId,
    message: data.message || "",
    isRead: Boolean(data.isRead),
    createdAt
  };
}

export async function getNotifications(userId: string): Promise<NotificationItem[]> {
  if (!userId) {
    return [];
  }

  if (isFirebaseConfigured && firebaseDb) {
    try {
      const snapshot = await withFirestoreTimeout(
        getDocs(
          query(collection(firebaseDb, "users", userId, "notifications"), orderBy("createdAt", "desc"))
        ),
        "Timed out while loading notifications."
      );

      return snapshot.docs.map((item) =>
        mapNotification(item.id, item.data() as Partial<NotificationItem>)
      );
    } catch (error) {
      throw new Error(mapNotificationError(error));
    }
  }

  const state = readState();
  return state.notifications
    .filter((item) => item.recipientUserId === userId)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export function subscribeToNotifications(
  userId: string,
  callback: (notifications: NotificationItem[]) => void,
  onError?: (message: string) => void
) {
  if (!userId) {
    callback([]);
    return () => undefined;
  }

  if (!isFirebaseConfigured || !firebaseDb) {
    const state = readState();
    callback(
      state.notifications
        .filter((item) => item.recipientUserId === userId)
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    );
    return () => undefined;
  }

  return onSnapshot(
    query(collection(firebaseDb, "users", userId, "notifications"), orderBy("createdAt", "desc")),
    (snapshot) => {
      callback(
        snapshot.docs.map((item) =>
          mapNotification(item.id, item.data() as Partial<NotificationItem>)
        )
      );
    },
    (error) => {
      onError?.(mapNotificationError(error));
    }
  );
}

export function subscribeToUnreadNotificationCount(
  userId: string,
  callback: (count: number) => void,
  onError?: (message: string) => void
) {
  if (!userId) {
    callback(0);
    return () => undefined;
  }

  if (!isFirebaseConfigured || !firebaseDb) {
    const state = readState();
    callback(state.notifications.filter((item) => item.recipientUserId === userId && !item.isRead).length);
    return () => undefined;
  }

  return onSnapshot(
    query(collection(firebaseDb, "users", userId, "notifications"), where("isRead", "==", false)),
    (snapshot) => {
      callback(snapshot.size);
    },
    (error) => {
      onError?.(mapNotificationError(error));
    }
  );
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  if (!userId) {
    return 0;
  }

  if (isFirebaseConfigured && firebaseDb) {
    try {
      const snapshot = await withFirestoreTimeout(
        getDocs(
          query(
            collection(firebaseDb, "users", userId, "notifications"),
            where("isRead", "==", false)
          )
        ),
        "Timed out while checking unread notifications."
      );

      return snapshot.size;
    } catch (error) {
      throw new Error(mapNotificationError(error));
    }
  }

  const state = readState();
  return state.notifications.filter((item) => item.recipientUserId === userId && !item.isRead).length;
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  if (!userId) {
    return;
  }

  if (isFirebaseConfigured && firebaseDb) {
    try {
      const snapshot = await withFirestoreTimeout(
        getDocs(
          query(
            collection(firebaseDb, "users", userId, "notifications"),
            where("isRead", "==", false)
          )
        ),
        "Timed out while updating notifications."
      );

      await withFirestoreTimeout(
        Promise.all(snapshot.docs.map((item) => updateDoc(item.ref, { isRead: true }))),
        "Timed out while marking notifications as read."
      );
      return;
    } catch (error) {
      throw new Error(mapNotificationError(error));
    }
  }

  const state = readState();
  writeState({
    ...state,
    notifications: state.notifications.map((item) =>
      item.recipientUserId === userId ? { ...item, isRead: true } : item
    )
  });
}

export async function markNotificationRead(userId: string, notificationId: string): Promise<void> {
  if (!userId || !notificationId) {
    return;
  }

  if (isFirebaseConfigured && firebaseDb) {
    try {
      await withFirestoreTimeout(
        updateDoc(doc(firebaseDb, "users", userId, "notifications", notificationId), {
          isRead: true
        }),
        "Timed out while updating the notification."
      );
      return;
    } catch (error) {
      throw new Error(mapNotificationError(error));
    }
  }

  const state = readState();
  writeState({
    ...state,
    notifications: state.notifications.map((item) =>
      item.id === notificationId && item.recipientUserId === userId ? { ...item, isRead: true } : item
    )
  });
}

export async function createNotification(input: {
  recipientUserId: string;
  type: NotificationItem["type"];
  actor: User;
  targetPostId?: string;
  message: string;
}): Promise<void> {
  if (!input.recipientUserId || input.recipientUserId === input.actor.id) {
    return;
  }

  const notification: NotificationItem = {
    id: createId("notification"),
    type: input.type,
    recipientUserId: input.recipientUserId,
    actorUserId: input.actor.id,
    actorUsername: input.actor.username,
    actorProfileImageURL: input.actor.profileImageURL,
    targetPostId: input.targetPostId,
    message: input.message,
    isRead: false,
    createdAt: new Date().toISOString()
  };

  if (isFirebaseConfigured && firebaseDb) {
    try {
      const notificationRef = doc(
        collection(firebaseDb, "users", input.recipientUserId, "notifications")
      );

      await withFirestoreTimeout(
        setDoc(notificationRef, {
          ...notification,
          id: notificationRef.id
        }),
        "Timed out while creating the notification."
      );
      return;
    } catch {
      return;
    }
  }

  const state = readState();
  writeState({
    ...state,
    notifications: [{ ...notification }, ...state.notifications]
  });
}
