import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  type User as FirebaseUser,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updateProfile as updateFirebaseAuthProfile
} from "firebase/auth";
import { firebaseAuth, isFirebaseConfigured } from "@/lib/firebase";
import { setCurrentUserId, upsertStoredUser } from "@/services/local-store";
import { uploadProfileImage } from "@/services/storage-service";
import { createUserDocument, getUserDocument, updateUserDocument } from "@/services/user-service";
import { User } from "@/types";

type SignupInput = {
  username: string;
  email: string;
  password: string;
  bio?: string;
};

function getFallbackBio(bio?: string) {
  return bio?.trim() || "Happy to be part of the Habesha community.";
}

function createFallbackUser(input: {
  id: string;
  email: string;
  username?: string;
  bio?: string;
}): User {
  return {
    id: input.id,
    username: input.username?.trim() || input.email.split("@")[0] || "habesha_user",
    email: input.email.trim().toLowerCase(),
    profileImageURL: "",
    bio: getFallbackBio(input.bio),
    createdAt: new Date().toISOString(),
    followerCount: 0,
    followingCount: 0
  };
}

function mapFirebaseAuthUser(authUser: FirebaseUser): User {
  return createFallbackUser({
    id: authUser.uid,
    email: authUser.email || "",
    username: authUser.displayName || authUser.email?.split("@")[0]
  });
}

function getFirebaseConfigError() {
  return "Firebase authentication is not configured. Add your NEXT_PUBLIC_FIREBASE_* values to .env.local and restart the dev server.";
}

function mapAuthError(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";

  switch (code) {
    case "auth/email-already-in-use":
      return "An account with that email already exists.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Use a stronger password with at least 6 characters.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Incorrect email or password.";
    default:
      return error instanceof Error ? error.message : "Authentication failed.";
  }
}

async function ensureAuthIsReady() {
  if (!isFirebaseConfigured || !firebaseAuth) {
    throw new Error(getFirebaseConfigError());
  }

  await setPersistence(firebaseAuth, browserLocalPersistence);
}

async function ensureFirebaseUserProfile(input: {
  id: string;
  email: string;
  username?: string;
  bio?: string;
}): Promise<User> {
  const fallbackUser = createFallbackUser(input);

  try {
    const existing = await getUserDocument(input.id);
    if (existing) {
      upsertStoredUser(existing);
      return existing;
    }

    await createUserDocument(fallbackUser);
  } catch {
    // Firestore profile reads/writes should not block a valid Firebase auth session.
  }

  upsertStoredUser(fallbackUser);
  return fallbackUser;
}

export async function getCurrentUser(): Promise<User | null> {
  if (!isFirebaseConfigured || !firebaseAuth?.currentUser) {
    return null;
  }

  const authUser = firebaseAuth.currentUser;
  return ensureFirebaseUserProfile(mapFirebaseAuthUser(authUser));
}

export function subscribeToUserSession(callback: (user: User | null) => void) {
  if (!isFirebaseConfigured || !firebaseAuth) {
    callback(null);
    return () => undefined;
  }

  return onAuthStateChanged(firebaseAuth, async (authUser) => {
    if (!authUser || !authUser.email) {
      callback(null);
      return;
    }

    const fallbackUser = mapFirebaseAuthUser(authUser);
    callback(fallbackUser);

    try {
      const user = await ensureFirebaseUserProfile({
        id: fallbackUser.id,
        email: fallbackUser.email,
        username: fallbackUser.username,
        bio: fallbackUser.bio
      });
      callback(user);
    } catch {
      callback(fallbackUser);
    }
  });
}

export async function loginUser(email: string, password: string): Promise<User> {
  if (!password.trim()) {
    throw new Error("Password is required.");
  }

  try {
    await ensureAuthIsReady();
    const credential = await signInWithEmailAndPassword(
      firebaseAuth!,
      email.trim().toLowerCase(),
      password
    );
    const fallbackUser = mapFirebaseAuthUser(credential.user);

    void ensureFirebaseUserProfile({
      id: fallbackUser.id,
      email: fallbackUser.email,
      username: fallbackUser.username,
      bio: fallbackUser.bio
    });

    return fallbackUser;
  } catch (error) {
    throw new Error(mapAuthError(error));
  }
}

export async function signupUser(input: SignupInput): Promise<User> {
  if (!input.password.trim()) {
    throw new Error("Password is required.");
  }

  try {
    await ensureAuthIsReady();
    const credential = await createUserWithEmailAndPassword(
      firebaseAuth!,
      input.email.trim().toLowerCase(),
      input.password
    );

    const user = createFallbackUser({
      id: credential.user.uid,
      username: input.username.trim(),
      email: input.email.trim().toLowerCase(),
      bio: input.bio
    });

    await createUserDocument(user);
    upsertStoredUser(user);
    return user;
  } catch (error) {
    throw new Error(mapAuthError(error));
  }
}

export async function logoutUser() {
  if (firebaseAuth) {
    await signOut(firebaseAuth);
  }

  setCurrentUserId(null);
}

export async function updateProfileDetails(input: {
  username: string;
  bio: string;
  imageFile?: File | null;
}): Promise<User> {
  if (!isFirebaseConfigured || !firebaseAuth?.currentUser) {
    throw new Error(getFirebaseConfigError());
  }

  const authUser = firebaseAuth.currentUser;
  const existingProfile =
    (await getUserDocument(authUser.uid)) ||
    createFallbackUser({
      id: authUser.uid,
      email: authUser.email || "",
      username: authUser.displayName || authUser.email?.split("@")[0]
    });

  const username = input.username.trim();
  const bio = input.bio.trim() || getFallbackBio();

  if (!username) {
    throw new Error("Username is required.");
  }

  let profileImageURL = existingProfile.profileImageURL || "";

  if (input.imageFile) {
    profileImageURL = await uploadProfileImage({
      file: input.imageFile,
      userId: authUser.uid
    });
  }

  try {
    await updateFirebaseAuthProfile(authUser, {
      displayName: username,
      photoURL: profileImageURL || null
    });
  } catch {
    // Firestore remains the primary profile source for the app.
  }

  const nextUser: User = {
    ...existingProfile,
    id: authUser.uid,
    email: authUser.email || existingProfile.email,
    username,
    bio,
    profileImageURL,
    createdAt: existingProfile.createdAt || new Date().toISOString()
  };

  await updateUserDocument(nextUser);
  return nextUser;
}
