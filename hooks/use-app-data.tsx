"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { addComment } from "@/services/comment-service";
import {
  getUnreadNotificationCount,
  subscribeToUnreadNotificationCount
} from "@/services/notification-service";
import {
  createPost,
  getPosts,
  getPostsByUser,
  mapBreakingItemToDiscussionPost,
  subscribeToPosts,
  syncBreakingDiscussionPosts,
  toggleLike
} from "@/services/post-service";
import { getSavedPostIds, getSavedPosts, toggleSavedPost } from "@/services/saved-post-service";
import { useAuth } from "@/hooks/use-auth";
import { getBreakingItems } from "@/services/news-service";
import { Comment, CreatePostInput, Post } from "@/types";

type AppContextValue = {
  currentUser: ReturnType<typeof useAuth>["currentUser"];
  posts: Post[];
  isLoading: boolean;
  isReady: boolean;
  authMode: "firebase" | "unconfigured";
  errorMessage: string;
  unreadNotificationCount: number;
  savedPostIds: string[];
  refreshUnreadNotificationCount: () => Promise<void>;
  refreshSavedPosts: () => Promise<void>;
  login: ReturnType<typeof useAuth>["login"];
  signup: ReturnType<typeof useAuth>["signup"];
  logout: ReturnType<typeof useAuth>["logout"];
  updateProfile: ReturnType<typeof useAuth>["updateProfile"];
  refreshPosts: () => Promise<void>;
  getProfilePosts: (userId: string) => Promise<Post[]>;
  createNewPost: (input: CreatePostInput) => Promise<Post>;
  likePost: (postId: string) => Promise<Post | null>;
  addPostComment: (postId: string, text: string) => Promise<Comment>;
  toggleSaved: (postId: string) => Promise<boolean>;
  getSavedFeed: () => Promise<Post[]>;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { currentUser, isReady, authMode, login, signup, logout, updateProfile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [systemPosts, setSystemPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [savedPostIds, setSavedPostIds] = useState<string[]>([]);

  const refreshUnreadNotificationCount = useCallback(async () => {
    if (!currentUser) {
      setUnreadNotificationCount(0);
      return;
    }

    try {
      const count = await getUnreadNotificationCount(currentUser.id);
      setUnreadNotificationCount(count);
    } catch {
      setUnreadNotificationCount(0);
    }
  }, [currentUser]);

  const hydrateFeed = useCallback(async () => {
    setIsLoading(true);
    try {
      const feed = await getPosts();
      setPosts(feed);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const unsubscribe = subscribeToPosts(
      (feed) => {
        setPosts(feed);
        setErrorMessage("");
        setIsLoading(false);
      },
      (message) => {
        setErrorMessage(message);
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, [isReady]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    let isMounted = true;

    void (async () => {
      try {
        const breakingItems = await getBreakingItems();
        const syncedPosts = await syncBreakingDiscussionPosts(breakingItems, currentUser);

        if (!isMounted) {
          return;
        }

        setSystemPosts(
          syncedPosts.length ? syncedPosts : breakingItems.map((item) => mapBreakingItemToDiscussionPost(item))
        );
      } catch {
        if (!isMounted) {
          return;
        }

        const fallbackItems = await getBreakingItems();
        setSystemPosts(fallbackItems.map((item) => mapBreakingItemToDiscussionPost(item)));
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [currentUser, isReady]);

  useEffect(() => {
    if (!currentUser) {
      setUnreadNotificationCount(0);
      return;
    }

    const unsubscribe = subscribeToUnreadNotificationCount(
      currentUser.id,
      (count) => setUnreadNotificationCount(count),
      () => {
        void refreshUnreadNotificationCount();
      }
    );

    return unsubscribe;
  }, [refreshUnreadNotificationCount]);

  const refreshSavedPosts = useCallback(async () => {
    if (!currentUser) {
      setSavedPostIds([]);
      return;
    }

    try {
      const ids = await getSavedPostIds(currentUser.id);
      setSavedPostIds(ids);
    } catch {
      setSavedPostIds([]);
    }
  }, [currentUser]);

  useEffect(() => {
    void refreshSavedPosts();
  }, [refreshSavedPosts]);

  const refreshPosts = useCallback(async () => {
    const feed = await getPosts();
    setPosts(feed);
  }, []);

  const createNewPost = useCallback(
    async (input: CreatePostInput) => {
      if (!currentUser) {
        throw new Error("Please log in before creating a post.");
      }

      const post = await createPost(input, currentUser);
      setPosts((currentPosts) => [post, ...currentPosts.filter((item) => item.id !== post.id)]);
      void refreshPosts();
      return post;
    },
    [currentUser, refreshPosts]
  );

  const likePost = useCallback(
    async (postId: string) => {
      if (!currentUser) {
        throw new Error("Please log in before liking posts.");
      }

      const updatedPost = await toggleLike(postId, currentUser);
      if (updatedPost) {
        setPosts((currentPosts) =>
          currentPosts.map((post) => (post.id === updatedPost.id ? updatedPost : post))
        );
      }
      void refreshUnreadNotificationCount();
      void refreshPosts();
      return updatedPost;
    },
    [currentUser, refreshPosts, refreshUnreadNotificationCount]
  );

  const addPostComment = useCallback(
    async (postId: string, text: string) => {
      if (!currentUser) {
        throw new Error("Please log in before commenting.");
      }

      const comment = await addComment({ postId, text }, currentUser);
      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === postId ? { ...post, commentCount: post.commentCount + 1 } : post
        )
      );
      void refreshUnreadNotificationCount();
      void refreshPosts();
      return comment;
    },
    [currentUser, refreshPosts, refreshUnreadNotificationCount]
  );

  const getProfilePosts = useCallback(async (userId: string) => getPostsByUser(userId), []);

  const getSavedFeed = useCallback(async () => {
    if (!currentUser) {
      return [];
    }

    return getSavedPosts(currentUser.id);
  }, [currentUser]);

  const toggleSaved = useCallback(
    async (postId: string) => {
      if (!currentUser) {
        throw new Error("Please log in before saving posts.");
      }

      const isSaved = await toggleSavedPost({
        userId: currentUser.id,
        postId
      });

      setSavedPostIds((currentIds) =>
        isSaved ? [postId, ...currentIds.filter((id) => id !== postId)] : currentIds.filter((id) => id !== postId)
      );

      return isSaved;
    },
    [currentUser]
  );

  const value = useMemo(
    () => ({
      currentUser,
      posts: [...systemPosts, ...posts]
        .reduce<Post[]>((accumulator, post) => {
          if (!accumulator.some((item) => item.id === post.id)) {
            accumulator.push(post);
          }
          return accumulator;
        }, [])
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
      isLoading,
      isReady,
      authMode,
      errorMessage,
      unreadNotificationCount,
      savedPostIds,
      refreshUnreadNotificationCount,
      refreshSavedPosts,
      login,
      signup,
      logout,
      updateProfile,
      refreshPosts,
      getProfilePosts,
      createNewPost,
      likePost,
      addPostComment,
      toggleSaved,
      getSavedFeed
    }),
    [
      currentUser,
      posts,
      systemPosts,
      isLoading,
      isReady,
      authMode,
      errorMessage,
      unreadNotificationCount,
      savedPostIds,
      refreshUnreadNotificationCount,
      refreshSavedPosts,
      login,
      signup,
      logout,
      updateProfile,
      refreshPosts,
      getProfilePosts,
      createNewPost,
      likePost,
      addPostComment,
      toggleSaved,
      getSavedFeed
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppData must be used inside AppDataProvider.");
  }
  return context;
}
