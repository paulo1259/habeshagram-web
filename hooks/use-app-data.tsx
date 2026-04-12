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
import { createPost, getPosts, getPostsByUser, toggleLike } from "@/services/post-service";
import { useAuth } from "@/hooks/use-auth";
import { Comment, CreatePostInput, Post } from "@/types";

type AppContextValue = {
  currentUser: ReturnType<typeof useAuth>["currentUser"];
  posts: Post[];
  isLoading: boolean;
  isReady: boolean;
  authMode: "firebase" | "unconfigured";
  errorMessage: string;
  login: ReturnType<typeof useAuth>["login"];
  signup: ReturnType<typeof useAuth>["signup"];
  logout: ReturnType<typeof useAuth>["logout"];
  updateProfile: ReturnType<typeof useAuth>["updateProfile"];
  refreshPosts: () => Promise<void>;
  getProfilePosts: (userId: string) => Promise<Post[]>;
  createNewPost: (input: CreatePostInput) => Promise<Post>;
  likePost: (postId: string) => Promise<Post | null>;
  addPostComment: (postId: string, text: string) => Promise<Comment>;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { currentUser, isReady, authMode, login, signup, logout, updateProfile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

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

    void hydrateFeed();
  }, [hydrateFeed, isReady]);

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

      const updatedPost = await toggleLike(postId, currentUser.id);
      if (updatedPost) {
        setPosts((currentPosts) =>
          currentPosts.map((post) => (post.id === updatedPost.id ? updatedPost : post))
        );
      }
      void refreshPosts();
      return updatedPost;
    },
    [currentUser, refreshPosts]
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
      void refreshPosts();
      return comment;
    },
    [currentUser, refreshPosts]
  );

  const getProfilePosts = useCallback(async (userId: string) => getPostsByUser(userId), []);

  const value = useMemo(
    () => ({
      currentUser,
      posts,
      isLoading,
      isReady,
      authMode,
      errorMessage,
      login,
      signup,
      logout,
      updateProfile,
      refreshPosts,
      getProfilePosts,
      createNewPost,
      likePost,
      addPostComment
    }),
    [
      currentUser,
      posts,
      isLoading,
      isReady,
      authMode,
      errorMessage,
      login,
      signup,
      logout,
      updateProfile,
      refreshPosts,
      getProfilePosts,
      createNewPost,
      likePost,
      addPostComment
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
