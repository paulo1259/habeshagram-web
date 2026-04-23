"use client";

import { onAuthStateChanged, type User as FirebaseUser } from "firebase/auth";
import { firebaseAuth, isFirebaseConfigured } from "@/lib/firebase";

async function waitForFirebaseUser() {
  if (!isFirebaseConfigured || !firebaseAuth) {
    throw new Error("Firebase auth is not configured for this app.");
  }

  const auth = firebaseAuth;

  if (auth.currentUser) {
    return auth.currentUser;
  }

  return new Promise<FirebaseUser>((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();

        if (user) {
          resolve(user);
          return;
        }

        reject(new Error("You need to be signed in before using the admin tools."));
      },
      (error) => {
        unsubscribe();
        reject(error instanceof Error ? error : new Error("Could not verify your session."));
      }
    );
  });
}

export async function getAdminIdToken() {
  const user = await waitForFirebaseUser();
  return user.getIdToken();
}
