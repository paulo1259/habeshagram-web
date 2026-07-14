import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  where
} from "firebase/firestore";
import { firebaseDb, isFirebaseConfigured } from "@/lib/firebase";
import {
  createDeterministicId,
  createId,
  getBreakingDiscussionPostId,
  normalizeHashtag,
  parseHashtags
} from "@/lib/utils";
import { readState, writeState } from "@/services/local-store";
import { createNotification } from "@/services/notification-service";
import { getBreakingItems } from "@/services/news-service";
import { uploadPostImage } from "@/services/storage-service";
import { BreakingItem, CreatePostInput, Post, User } from "@/types";

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
    hashtags: Array.isArray(data.hashtags)
      ? data.hashtags.map((tag) => normalizeHashtag(String(tag))).filter(Boolean)
      : [],
    summary: typeof data.summary === "string" ? data.summary : "",
    sourceLabel: typeof data.sourceLabel === "string" ? data.sourceLabel : "",
    sourceUrl: typeof data.sourceUrl === "string" ? data.sourceUrl : "",
    isSystem: Boolean(data.isSystem),
    createdAt,
    likeCount: typeof data.likeCount === "number" ? data.likeCount : 0,
    commentCount: typeof data.commentCount === "number" ? data.commentCount : 0,
    likedBy: Array.isArray(data.likedBy) ? data.likedBy : []
  };
}

const systemPostAuthor = {
  id: "system_breaking_desk",
  username: "Breaking Desk",
  userProfileImageURL: ""
} as const;

function getBreakingItemHashtags(item: BreakingItem) {
  const rawTags = [
    "breaking",
    ...parseHashtags(`${item.headline} ${item.summary ?? ""}`)
  ];

  return Array.from(new Set(rawTags.map((tag) => normalizeHashtag(tag)).filter(Boolean)));
}

export function mapBreakingItemToDiscussionPost(item: BreakingItem): Post {
  const hashtags = getBreakingItemHashtags(item);

  return {
    id: getBreakingDiscussionPostId(item.headline, item.source),
    userId: systemPostAuthor.id,
    username: systemPostAuthor.username,
    userProfileImageURL: systemPostAuthor.userProfileImageURL,
    text: item.headline,
    summary: item.summary ?? "",
    sourceLabel: item.source,
    sourceUrl: item.link ?? "",
    imageURL: "",
    hashtags,
    isSystem: true,
    createdAt: item.timestamp,
    likeCount: 0,
    commentCount: 0,
    likedBy: []
  };
}

export async function syncBreakingDiscussionPosts(items: BreakingItem[], actor?: User | null) {
  const discussionPosts = items.map(mapBreakingItemToDiscussionPost);

  if (!discussionPosts.length) {
    return [];
  }

  if (isFirebaseConfigured && firebaseDb && actor) {
    const db = firebaseDb;

    await Promise.all(
      discussionPosts.map(async (post) => {
        const postRef = doc(db, "posts", post.id);
        const snapshot = await withFirestoreTimeout(
          getDoc(postRef),
          "Timed out while checking breaking news discussion posts."
        );

        if (snapshot.exists()) {
          return;
        }

        await withFirestoreTimeout(
          setDoc(postRef, post),
          "Timed out while syncing breaking news discussion posts."
        );
      })
    );
  } else if (!isFirebaseConfigured || !firebaseDb) {
    const state = readState();
    const nextPosts = [...state.posts];

    discussionPosts.forEach((post) => {
      if (!nextPosts.some((item) => item.id === post.id)) {
        nextPosts.unshift(post);
      }
    });

    writeState({
      ...state,
      posts: nextPosts.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    });
  }

  return discussionPosts;
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

export async function getPostById(postId: string): Promise<Post | null> {
  if (!postId) {
    return null;
  }

  if (isFirebaseConfigured && firebaseDb) {
    try {
      const snapshot = await withFirestoreTimeout(
        getDoc(doc(firebaseDb, "posts", postId)),
        "Timed out while loading this post."
      );

      if (!snapshot.exists()) {
        return null;
      }

      return mapFirestorePost(snapshot.id, snapshot.data() as Partial<Post>);
    } catch (error) {
      throw new Error(mapPostError(error));
    }
  }

  const state = readState();
  const localPost = state.posts.find((post) => post.id === postId);

  if (localPost) {
    return localPost;
  }

  try {
    const breakingItems = await getBreakingItems();
    return breakingItems.map(mapBreakingItemToDiscussionPost).find((post) => post.id === postId) ?? null;
  } catch {
    return null;
  }
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
          message: "liked your post."
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
      message: "liked your post."
    });
  }
  return updatedPost;
}

export async function deletePost(postId: string, actor: User): Promise<void> {
  if (!actor) {
    throw new Error("Please log in before deleting posts.");
  }

  if (isFirebaseConfigured && firebaseDb) {
    const postRef = doc(firebaseDb, "posts", postId);

    try {
      const snapshot = await withFirestoreTimeout(
        getDoc(postRef),
        "Timed out while loading the post for deletion."
      );

      if (!snapshot.exists()) {
        return;
      }

      const post = mapFirestorePost(snapshot.id, snapshot.data() as Partial<Post>);

      if (post.userId !== actor.id) {
        throw new Error("You can only delete your own posts.");
      }

      const commentsSnapshot = await withFirestoreTimeout(
        getDocs(collection(firebaseDb, "posts", postId, "comments")),
        "Timed out while loading post comments for deletion."
      );

      await withFirestoreTimeout(
        Promise.all(commentsSnapshot.docs.map((comment) => deleteDoc(comment.ref))),
        "Timed out while deleting post comments."
      );

      await withFirestoreTimeout(deleteDoc(postRef), "Timed out while deleting the post.");
      return;
    } catch (error) {
      throw new Error(mapPostError(error));
    }
  }

  const state = readState();
  const post = state.posts.find((item) => item.id === postId);

  if (post && post.userId !== actor.id) {
    throw new Error("You can only delete your own posts.");
  }

  writeState({
    ...state,
    posts: state.posts.filter((item) => item.id !== postId),
    comments: state.comments.filter((item) => item.postId !== postId)
  });
}
