"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { currentUser, isReady, authMode } = useAuth();

  useEffect(() => {
    if (isReady && !currentUser) {
      router.replace("/login");
    }
  }, [currentUser, isReady, router]);

  if (!isReady) {
    return (
      <div className="rounded-3xl border border-brand-100 bg-white/95 p-6 text-sm text-stone-600 shadow-soft">
        Checking your session...
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="rounded-3xl border border-brand-100 bg-white/95 p-6 text-sm text-stone-600 shadow-soft">
        {authMode === "unconfigured"
          ? "Firebase auth is not configured yet. Add your NEXT_PUBLIC_FIREBASE_* values to .env.local to unlock protected pages."
          : "Redirecting to login..."}
      </div>
    );
  }

  return <>{children}</>;
}
