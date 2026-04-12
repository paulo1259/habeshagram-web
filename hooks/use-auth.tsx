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
import {
  loginUser,
  logoutUser,
  signupUser,
  subscribeToUserSession,
  updateProfileDetails
} from "@/services/auth-service";
import { isFirebaseConfigured } from "@/lib/firebase";
import { User } from "@/types";

type AuthContextValue = {
  currentUser: User | null;
  isReady: boolean;
  authMode: "firebase" | "unconfigured";
  login: (email: string, password: string) => Promise<void>;
  signup: (input: { username: string; email: string; password: string; bio?: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (input: {
    username: string;
    bio: string;
    imageFile?: File | null;
  }) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToUserSession((user) => {
      setCurrentUser(user);
      setIsReady(true);
    });

    return unsubscribe;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const user = await loginUser(email, password);
    setCurrentUser(user);
  }, []);

  const signup = useCallback(
    async (input: { username: string; email: string; password: string; bio?: string }) => {
      const user = await signupUser(input);
      setCurrentUser(user);
    },
    []
  );

  const logout = useCallback(async () => {
    await logoutUser();
    setCurrentUser(null);
  }, []);

  const updateProfile = useCallback(
    async (input: { username: string; bio: string; imageFile?: File | null }) => {
      const user = await updateProfileDetails(input);
      setCurrentUser(user);
    },
    []
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      isReady,
      authMode: isFirebaseConfigured ? "firebase" : "unconfigured",
      login,
      signup,
      logout,
      updateProfile
    }),
    [currentUser, isReady, login, logout, signup, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return context;
}
