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
    return JSON.parse(raw) as AppState;
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
