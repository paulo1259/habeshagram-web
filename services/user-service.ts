import { doc, getDoc, setDoc } from "firebase/firestore";
import { firebaseDb, isFirebaseConfigured } from "@/lib/firebase";
import { upsertStoredUser } from "@/services/local-store";
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
    return null;
  }

  const snapshot = await withFirestoreTimeout(
    getDoc(doc(firebaseDb, "users", userId)),
    "Timed out while loading your profile."
  );

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as User;
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
