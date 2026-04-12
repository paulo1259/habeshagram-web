import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  where
} from "firebase/firestore";
import { firebaseDb, isFirebaseConfigured } from "@/lib/firebase";
import { createId, normalizeHashtag, parseHashtags } from "@/lib/utils";
import { readState, writeState } from "@/services/local-store";
import { createNotification } from "@/services/notification-service";
import { uploadPostImage } from "@/services/storage-service";
import { CreatePostInput, FootballTeam, Post, User } from "@/types";
import { footballTeams } from "@/services/football-hub-data";

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
    teamTag: data.teamTag,
    hashtags: Array.isArray(data.hashtags)
      ? data.hashtags.map((tag) => normalizeHashtag(String(tag))).filter(Boolean)
      : [],
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

export function subscribeToPosts(
  callback: (posts: Post[]) => void,
  onError?: (message: string) => void
) {
  if (!isFirebaseConfigured || !firebaseDb) {
    callback([...readState().posts].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)));
    return () => undefined;
  }

  return onSnapshot(
    query(collection(firebaseDb, "posts"), orderBy("createdAt", "desc")),
    (snapshot) => {
      callback(snapshot.docs.map((item) => mapFirestorePost(item.id, item.data() as Partial<Post>)));
    },
    (error) => {
      onError?.(mapPostError(error));
    }
  );
}

export async function getPostsByUser(userId: string): Promise<Post[]> {
  const posts = await getPosts();
  return posts.filter((post) => post.userId === userId);
}

export async function getPostsByTeam(team: FootballTeam): Promise<Post[]> {
  const posts = await getPosts();
  return posts.filter((post) => post.teamTag === team);
}

export async function getPostsByHashtag(tag: string): Promise<Post[]> {
  const normalizedTag = normalizeHashtag(tag);

  if (!normalizedTag) {
    return [];
  }

  if (isFirebaseConfigured && firebaseDb) {
    try {
      const snapshot = await withFirestoreTimeout(
        getDocs(
          query(
            collection(firebaseDb, "posts"),
            where("hashtags", "array-contains", normalizedTag),
            orderBy("createdAt", "desc")
          )
        ),
        "Timed out while loading topic posts."
      );

      return snapshot.docs.map((item) => mapFirestorePost(item.id, item.data() as Partial<Post>));
    } catch (error) {
      throw new Error(mapPostError(error));
    }
  }

  const posts = await getPosts();
  return posts.filter((post) => (post.hashtags ?? []).includes(normalizedTag));
}

export function subscribeToPostsByUser(
  userId: string,
  callback: (posts: Post[]) => void,
  onError?: (message: string) => void
) {
  if (!userId) {
    callback([]);
    return () => undefined;
  }

  if (!isFirebaseConfigured || !firebaseDb) {
    const state = readState();
    callback(
      state.posts
        .filter((post) => post.userId === userId)
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    );
    return () => undefined;
  }

  return onSnapshot(
    query(collection(firebaseDb, "posts"), where("userId", "==", userId), orderBy("createdAt", "desc")),
    (snapshot) => {
      callback(snapshot.docs.map((item) => mapFirestorePost(item.id, item.data() as Partial<Post>)));
    },
    (error) => {
      onError?.(mapPostError(error));
    }
  );
}

export async function getPostsByUsers(userIds: string[]): Promise<Post[]> {
  if (!userIds.length) {
    return [];
  }

  if (isFirebaseConfigured && firebaseDb) {
    const db = firebaseDb;

    try {
      const chunks: string[][] = [];
      for (let index = 0; index < userIds.length; index += 10) {
        chunks.push(userIds.slice(index, index + 10));
      }

      const snapshots = await withFirestoreTimeout(
        Promise.all(
          chunks.map((chunk) =>
            getDocs(
              query(
                collection(db, "posts"),
                where("userId", "in", chunk),
                orderBy("createdAt", "desc")
              )
            )
          )
        ),
        "Timed out while loading your following feed."
      );

      return snapshots
        .flatMap((snapshot) =>
          snapshot.docs.map((item) => mapFirestorePost(item.id, item.data() as Partial<Post>))
        )
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    } catch (error) {
      throw new Error(mapPostError(error));
    }
  }

  const state = readState();
  return state.posts
    .filter((post) => userIds.includes(post.userId))
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export async function createPost(input: CreatePostInput, user: User): Promise<Post> {
  if (!user) {
    throw new Error("Please log in before creating a post.");
  }

  const text = input.text.trim();
  if (!text) {
    throw new Error("Text is required.");
  }

  if (input.teamTag && !footballTeams.includes(input.teamTag)) {
    throw new Error("Please choose one of the supported football teams.");
  }

  const postId = createId("post");
  let imageURL = input.imageURL || "";
  const hashtags = parseHashtags(text);

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
    teamTag: input.teamTag || undefined,
    hashtags,
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

export async function toggleLike(postId: string, actor: User): Promise<Post | null> {
  if (isFirebaseConfigured && firebaseDb) {
    const postRef = doc(firebaseDb, "posts", postId);

    try {
      const result = await withFirestoreTimeout(
        runTransaction(firebaseDb, async (transaction) => {
          const snapshot = await transaction.get(postRef);
          if (!snapshot.exists()) {
            return null;
          }

          const post = mapFirestorePost(snapshot.id, snapshot.data() as Partial<Post>);
          const liked = post.likedBy.includes(actor.id);
          const nextLikedBy = liked
            ? post.likedBy.filter((id) => id !== actor.id)
            : [...post.likedBy, actor.id];
          const nextLikeCount = liked ? Math.max(0, post.likeCount - 1) : post.likeCount + 1;

          transaction.update(postRef, {
            likedBy: liked ? arrayRemove(actor.id) : arrayUnion(actor.id),
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

      if (result && !result.likedBy.includes(actor.id)) {
        return result;
      }

      if (result && result.userId && result.userId !== actor.id && result.likedBy.includes(actor.id)) {
        void createNotification({
          recipientUserId: result.userId,
          type: "like",
          actor,
          targetPostId: result.id,
          message: "liked your post"
        });
      }

      return result;
    } catch (error) {
      throw new Error(mapPostError(error));
    }
  }

  const state = readState();
  const posts = state.posts.map((post) => {
    if (post.id !== postId) {
      return post;
    }

    const liked = post.likedBy.includes(actor.id);
    const likedBy = liked ? post.likedBy.filter((id) => id !== actor.id) : [...post.likedBy, actor.id];

    return {
      ...post,
      likedBy,
      likeCount: liked ? Math.max(0, post.likeCount - 1) : post.likeCount + 1
    };
  });

  writeState({ ...state, posts });
  const updatedPost = posts.find((post) => post.id === postId) ?? null;
  if (updatedPost && updatedPost.userId !== actor.id && updatedPost.likedBy.includes(actor.id)) {
    void createNotification({
      recipientUserId: updatedPost.userId,
      type: "like",
      actor,
      targetPostId: updatedPost.id,
      message: "liked your post"
    });
  }
  return updatedPost;
}
