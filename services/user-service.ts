import { collection, doc, getDoc, getDocs, onSnapshot, orderBy, query, setDoc } from "firebase/firestore";
import { firebaseDb, isFirebaseConfigured } from "@/lib/firebase";
import { readState, upsertStoredUser } from "@/services/local-store";
import { User } from "@/types";

const FIRESTORE_TIMEOUT_MS = 4000;

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

export async function getUserDocument(userId: string): Promise<User | null> {
  if (!isFirebaseConfigured || !firebaseDb) {
    const state = readState();
    return state.users.find((user) => user.id === userId) ?? null;
  }

  const snapshot = await withFirestoreTimeout(
    getDoc(doc(firebaseDb, "users", userId)),
    "Timed out while loading your profile."
  );

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data() as Partial<User>;
  return {
    id: data.id || userId,
    username: data.username || "habesha_user",
    email: data.email || "",
    profileImageURL: data.profileImageURL || "",
    bio: data.bio || "",
    createdAt: data.createdAt || new Date().toISOString(),
    followerCount: typeof data.followerCount === "number" ? data.followerCount : 0,
    followingCount: typeof data.followingCount === "number" ? data.followingCount : 0
  };
}

export async function getAllUsers(): Promise<User[]> {
  if (!isFirebaseConfigured || !firebaseDb) {
    const state = readState();
    return state.users;
  }

  const snapshot = await withFirestoreTimeout(
    getDocs(query(collection(firebaseDb, "users"), orderBy("createdAt", "desc"))),
    "Timed out while loading user profiles."
  );

  return snapshot.docs.map((item) => {
    const data = item.data() as Partial<User>;
    return {
      id: data.id || item.id,
      username: data.username || "habesha_user",
      email: data.email || "",
      profileImageURL: data.profileImageURL || "",
      bio: data.bio || "",
      createdAt: data.createdAt || new Date().toISOString(),
      followerCount: typeof data.followerCount === "number" ? data.followerCount : 0,
      followingCount: typeof data.followingCount === "number" ? data.followingCount : 0
    };
  });
}

export function subscribeToUserDocument(
  userId: string,
  callback: (user: User | null) => void,
  onError?: (message: string) => void
) {
  if (!userId) {
    callback(null);
    return () => undefined;
  }

  if (!isFirebaseConfigured || !firebaseDb) {
    const state = readState();
    callback(state.users.find((user) => user.id === userId) ?? null);
    return () => undefined;
  }

  return onSnapshot(
    doc(firebaseDb, "users", userId),
    (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }

      const data = snapshot.data() as Partial<User>;
      callback({
        id: data.id || userId,
        username: data.username || "habesha_user",
        email: data.email || "",
        profileImageURL: data.profileImageURL || "",
        bio: data.bio || "",
        createdAt: data.createdAt || new Date().toISOString(),
        followerCount: typeof data.followerCount === "number" ? data.followerCount : 0,
        followingCount: typeof data.followingCount === "number" ? data.followingCount : 0
      });
    },
    (error) => {
      onError?.(error instanceof Error ? error.message : "Unable to watch this profile.");
    }
  );
}

export async function createUserDocument(user: User): Promise<User> {
  if (!isFirebaseConfigured || !firebaseDb) {
    return user;
  }

  await withFirestoreTimeout(
    setDoc(doc(firebaseDb, "users", user.id), user, { merge: true }),
    "Timed out while saving your profile."
  );

  return user;
}

export async function updateUserDocument(user: User): Promise<User> {
  if (!isFirebaseConfigured || !firebaseDb) {
    upsertStoredUser(user);
    return user;
  }

  await withFirestoreTimeout(
    setDoc(doc(firebaseDb, "users", user.id), user, { merge: true }),
    "Timed out while updating your profile."
  );

  upsertStoredUser(user);
  return user;
}
