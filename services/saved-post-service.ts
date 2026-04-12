import { collection, deleteDoc, doc, getDocs, orderBy, query, setDoc } from "firebase/firestore";
import { firebaseDb, isFirebaseConfigured } from "@/lib/firebase";
import { readState, writeState } from "@/services/local-store";
import { getPosts } from "@/services/post-service";
import { Post, SavedPostItem } from "@/types";

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

function mapSavedPostError(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";

  switch (code) {
    case "permission-denied":
    case "firestore/permission-denied":
      return "This action is blocked by your current Firestore rules. Update your saved-post permissions and try again.";
    default:
      return error instanceof Error ? error.message : "Unable to update your saved posts.";
  }
}

export async function getSavedPostIds(userId: string): Promise<string[]> {
  if (!userId) {
    return [];
  }

  if (isFirebaseConfigured && firebaseDb) {
    try {
      const snapshot = await withFirestoreTimeout(
        getDocs(query(collection(firebaseDb, "users", userId, "savedPosts"), orderBy("savedAt", "desc"))),
        "Timed out while loading your saved posts."
      );

      return snapshot.docs.map((item) => item.id);
    } catch (error) {
      throw new Error(mapSavedPostError(error));
    }
  }

  const state = readState();
  return state.savedPosts
    .filter((item) => item.userId === userId)
    .sort((a, b) => +new Date(b.savedAt) - +new Date(a.savedAt))
    .map((item) => item.postId);
}

export async function getSavedPosts(userId: string): Promise<Post[]> {
  if (!userId) {
    return [];
  }

  const [savedIds, posts] = await Promise.all([getSavedPostIds(userId), getPosts()]);
  const order = new Map(savedIds.map((postId, index) => [postId, index]));

  return posts
    .filter((post) => order.has(post.id))
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

export async function toggleSavedPost(input: {
  userId: string;
  postId: string;
}): Promise<boolean> {
  if (!input.userId || !input.postId) {
    throw new Error("Please log in before saving posts.");
  }

  if (isFirebaseConfigured && firebaseDb) {
    const savedRef = doc(firebaseDb, "users", input.userId, "savedPosts", input.postId);

    try {
      const currentIds = await getSavedPostIds(input.userId);
      const alreadySaved = currentIds.includes(input.postId);

      if (alreadySaved) {
        await withFirestoreTimeout(
          deleteDoc(savedRef),
          "Timed out while removing this saved post."
        );
        return false;
      }

      await withFirestoreTimeout(
        setDoc(savedRef, {
          postId: input.postId,
          savedAt: new Date().toISOString()
        }),
        "Timed out while saving this post."
      );
      return true;
    } catch (error) {
      throw new Error(mapSavedPostError(error));
    }
  }

  const state = readState();
  const alreadySaved = state.savedPosts.some(
    (item) => item.userId === input.userId && item.postId === input.postId
  );

  const savedPosts: SavedPostItem[] = alreadySaved
    ? state.savedPosts.filter(
        (item) => !(item.userId === input.userId && item.postId === input.postId)
      )
    : [
        {
          userId: input.userId,
          postId: input.postId,
          savedAt: new Date().toISOString()
        },
        ...state.savedPosts
      ];

  writeState({ ...state, savedPosts });
  return !alreadySaved;
}
