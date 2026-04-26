import { initialState } from "@/services/mock-data";
import { AppState, User } from "@/types";

const KEY = "habeshagram-web-state";

export function readState(): AppState {
  if (typeof window === "undefined") {
    return initialState;
  }

  const raw = window.localStorage.getItem(KEY);
  if (!raw) {
    window.localStorage.setItem(KEY, JSON.stringify(initialState));
    return initialState;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      users: Array.isArray(parsed.users)
        ? parsed.users.map((user) => ({
            id: user.id || "",
            username: user.username || "habesha_user",
            email: user.email || "",
            profileImageURL: user.profileImageURL || "",
            bio: user.bio || "",
            createdAt: user.createdAt || new Date().toISOString(),
            followerCount: typeof user.followerCount === "number" ? user.followerCount : 0,
            followingCount: typeof user.followingCount === "number" ? user.followingCount : 0,
            pinnedPostId: typeof user.pinnedPostId === "string" ? user.pinnedPostId : undefined
          }))
        : initialState.users,
      posts: Array.isArray(parsed.posts) ? parsed.posts : initialState.posts,
      comments: Array.isArray(parsed.comments) ? parsed.comments : initialState.comments,
      follows: Array.isArray(parsed.follows) ? parsed.follows : initialState.follows,
      notifications: Array.isArray(parsed.notifications)
        ? parsed.notifications
        : initialState.notifications,
      reports: Array.isArray(parsed.reports) ? parsed.reports : initialState.reports,
      savedPosts: Array.isArray(parsed.savedPosts) ? parsed.savedPosts : initialState.savedPosts,
      currentUserId:
        typeof parsed.currentUserId === "string" || parsed.currentUserId === null
          ? parsed.currentUserId
          : initialState.currentUserId
    };
  } catch {
    window.localStorage.setItem(KEY, JSON.stringify(initialState));
    return initialState;
  }
}

export function writeState(next: AppState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(KEY, JSON.stringify(next));
}

export function setCurrentUserId(userId: string | null) {
  const state = readState();
  writeState({ ...state, currentUserId: userId });
}

export function upsertStoredUser(user: User) {
  const state = readState();
  const exists = state.users.some((item) => item.id === user.id);
  const users = exists
    ? state.users.map((item) => (item.id === user.id ? { ...item, ...user } : item))
    : [user, ...state.users];

  writeState({
    ...state,
    users,
    currentUserId: user.id
  });
}
