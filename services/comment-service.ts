import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc
} from "firebase/firestore";
import { firebaseDb, isFirebaseConfigured } from "@/lib/firebase";
import { createId } from "@/lib/utils";
import { readState, writeState } from "@/services/local-store";
import { createNotification } from "@/services/notification-service";
import { Comment, User } from "@/types";

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

function mapCommentError(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";

  switch (code) {
    case "permission-denied":
    case "firestore/permission-denied":
      return "This action is blocked by your current Firestore rules. Update your comment permissions and try again.";
    case "unavailable":
    case "firestore/unavailable":
      return "Firestore is temporarily unavailable. Please try again.";
    default:
      return error instanceof Error ? error.message : "Unable to update comments right now.";
  }
}

function mapFirestoreComment(
  id: string,
  postId: string,
  data: Partial<Comment> & { createdAt?: string | { toDate?: () => Date; seconds?: number } }
): Comment {
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
    postId: data.postId || postId,
    userId: data.userId || "",
    username: data.username || "habesha_user",
    text: data.text || "",
    createdAt
  };
}

export async function getCommentsByPost(postId: string): Promise<Comment[]> {
  if (isFirebaseConfigured && firebaseDb) {
    try {
      const snapshot = await withFirestoreTimeout(
        getDocs(query(collection(firebaseDb, "posts", postId, "comments"), orderBy("createdAt", "asc"))),
        "Timed out while loading comments."
      );

      return snapshot.docs.map((item) =>
        mapFirestoreComment(item.id, postId, item.data() as Partial<Comment>)
      );
    } catch (error) {
      throw new Error(mapCommentError(error));
    }
  }

  const state = readState();
  return state.comments
    .filter((comment) => comment.postId === postId)
    .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
}

export function subscribeToCommentsByPost(
  postId: string,
  callback: (comments: Comment[]) => void,
  onError?: (message: string) => void
) {
  if (!postId) {
    callback([]);
    return () => undefined;
  }

  if (!isFirebaseConfigured || !firebaseDb) {
    const state = readState();
    callback(
      state.comments
        .filter((comment) => comment.postId === postId)
        .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
    );
    return () => undefined;
  }

  return onSnapshot(
    query(collection(firebaseDb, "posts", postId, "comments"), orderBy("createdAt", "asc")),
    (snapshot) => {
      callback(
        snapshot.docs.map((item) =>
          mapFirestoreComment(item.id, postId, item.data() as Partial<Comment>)
        )
      );
    },
    (error) => {
      onError?.(mapCommentError(error));
    }
  );
}

export async function addComment(input: {
  postId: string;
  text: string;
}, user: User): Promise<Comment> {
  if (!user) {
    throw new Error("Please log in before commenting.");
  }

  const comment: Comment = {
    id: createId("comment"),
    postId: input.postId,
    userId: user.id,
    username: user.username,
    text: input.text.trim(),
    createdAt: new Date().toISOString()
  };

  if (!comment.text) {
    throw new Error("Write a comment before posting.");
  }

  if (isFirebaseConfigured && firebaseDb) {
    const postRef = doc(firebaseDb, "posts", input.postId);
    const commentRef = doc(collection(firebaseDb, "posts", input.postId, "comments"));

    try {
      let postOwnerId = "";

      await withFirestoreTimeout(
        runTransaction(firebaseDb, async (transaction) => {
          const postSnapshot = await transaction.get(postRef);
          if (!postSnapshot.exists()) {
            throw new Error("This post is no longer available.");
          }

          const currentCount = typeof postSnapshot.data().commentCount === "number"
            ? postSnapshot.data().commentCount
            : 0;
          postOwnerId = typeof postSnapshot.data().userId === "string" ? postSnapshot.data().userId : "";
          const firestoreComment = {
            ...comment,
            id: commentRef.id
          };

          transaction.set(commentRef, firestoreComment);
          transaction.update(postRef, {
            commentCount: currentCount + 1
          });
        }),
        "Timed out while posting your comment."
      );

      if (postOwnerId && postOwnerId !== user.id) {
        void createNotification({
          recipientUserId: postOwnerId,
          type: "comment",
          actor: user,
          targetPostId: input.postId,
          message: "commented on your post"
        });
      }

      return {
        ...comment,
        id: commentRef.id
      };
    } catch (error) {
      throw new Error(mapCommentError(error));
    }
  }

  const state = readState();
  const posts = state.posts.map((post) =>
    post.id === input.postId ? { ...post, commentCount: post.commentCount + 1 } : post
  );

  writeState({
    ...state,
    posts,
    comments: [...state.comments, comment]
  });

  const postOwnerId = state.posts.find((post) => post.id === input.postId)?.userId || "";
  if (postOwnerId && postOwnerId !== user.id) {
    void createNotification({
      recipientUserId: postOwnerId,
      type: "comment",
      actor: user,
      targetPostId: input.postId,
      message: "commented on your post"
    });
  }

  return comment;
}
