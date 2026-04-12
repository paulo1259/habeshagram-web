import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  setDoc
} from "firebase/firestore";
import { firebaseDb, isFirebaseConfigured } from "@/lib/firebase";
import { createId } from "@/lib/utils";
import { readState, writeState } from "@/services/local-store";
import { uploadPostImage } from "@/services/storage-service";
import { CreatePostInput, Post, User } from "@/types";

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

function mapPostError(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";

  switch (code) {
    case "permission-denied":
    case "firestore/permission-denied":
      return "This action is blocked by your current Firestore rules. Update your post permissions and try again.";
    case "unavailable":
    case "firestore/unavailable":
      return "Firestore is temporarily unavailable. Please try again.";
    default:
      return error instanceof Error ? error.message : "Unable to save your changes.";
  }
}

function mapFirestorePost(
  id: string,
  data: Partial<Post> & { createdAt?: string | { toDate?: () => Date; seconds?: number } }
): Post {
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
    userId: data.userId || "",
    username: data.username || "habesha_user",
    userProfileImageURL: data.userProfileImageURL || "",
    text: data.text || "",
    imageURL: data.imageURL || "",
    createdAt,
    likeCount: typeof data.likeCount === "number" ? data.likeCount : 0,
    commentCount: typeof data.commentCount === "number" ? data.commentCount : 0,
    likedBy: Array.isArray(data.likedBy) ? data.likedBy : []
  };
}

export async function getPosts(): Promise<Post[]> {
  if (isFirebaseConfigured && firebaseDb) {
    try {
      const snapshot = await withFirestoreTimeout(
        getDocs(query(collection(firebaseDb, "posts"), orderBy("createdAt", "desc"))),
        "Timed out while loading posts."
      );
      return snapshot.docs.map((item) => mapFirestorePost(item.id, item.data() as Partial<Post>));
    } catch (error) {
      throw new Error(mapPostError(error));
    }
  }

  const state = readState();
  return [...state.posts].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export async function getPostsByUser(userId: string): Promise<Post[]> {
  const posts = await getPosts();
  return posts.filter((post) => post.userId === userId);
}

export async function createPost(input: CreatePostInput, user: User): Promise<Post> {
  if (!user) {
    throw new Error("Please log in before creating a post.");
  }

  const text = input.text.trim();
  if (!text) {
    throw new Error("Text is required.");
  }

  const postId = createId("post");
  let imageURL = input.imageURL || "";

  if (input.imageFile) {
    if (!isFirebaseConfigured || !firebaseDb) {
      throw new Error("Firebase Storage is not configured for image uploads.");
    }

    imageURL = await uploadPostImage({
      file: input.imageFile,
      userId: user.id,
      postId
    });
  }

  const post: Post = {
    id: postId,
    userId: user.id,
    username: user.username,
    userProfileImageURL: user.profileImageURL,
    text,
    imageURL,
    createdAt: new Date().toISOString(),
    likeCount: 0,
    commentCount: 0,
    likedBy: []
  };

  if (isFirebaseConfigured && firebaseDb) {
    try {
      const postRef = doc(firebaseDb, "posts", post.id);
      const firestorePost = {
        ...post,
        id: post.id
      };

      await withFirestoreTimeout(
        setDoc(postRef, firestorePost),
        "Timed out while saving your post."
      );
      return firestorePost;
    } catch (error) {
      throw new Error(mapPostError(error));
    }
  }

  const state = readState();
  writeState({ ...state, posts: [post, ...state.posts] });
  return post;
}

export async function toggleLike(postId: string, userId: string): Promise<Post | null> {
  if (isFirebaseConfigured && firebaseDb) {
    const postRef = doc(firebaseDb, "posts", postId);

    try {
      return await withFirestoreTimeout(
        runTransaction(firebaseDb, async (transaction) => {
          const snapshot = await transaction.get(postRef);
          if (!snapshot.exists()) {
            return null;
          }

          const post = mapFirestorePost(snapshot.id, snapshot.data() as Partial<Post>);
          const liked = post.likedBy.includes(userId);
          const nextLikedBy = liked
            ? post.likedBy.filter((id) => id !== userId)
            : [...post.likedBy, userId];
          const nextLikeCount = liked ? Math.max(0, post.likeCount - 1) : post.likeCount + 1;

          transaction.update(postRef, {
            likedBy: liked ? arrayRemove(userId) : arrayUnion(userId),
            likeCount: nextLikeCount
          });

          return {
            ...post,
            likedBy: nextLikedBy,
            likeCount: nextLikeCount
          };
        }),
        "Timed out while updating the like."
      );
    } catch (error) {
      throw new Error(mapPostError(error));
    }
  }

  const state = readState();
  const posts = state.posts.map((post) => {
    if (post.id !== postId) {
      return post;
    }

    const liked = post.likedBy.includes(userId);
    const likedBy = liked ? post.likedBy.filter((id) => id !== userId) : [...post.likedBy, userId];

    return {
      ...post,
      likedBy,
      likeCount: liked ? Math.max(0, post.likeCount - 1) : post.likeCount + 1
    };
  });

  writeState({ ...state, posts });
  return posts.find((post) => post.id === postId) ?? null;
}
