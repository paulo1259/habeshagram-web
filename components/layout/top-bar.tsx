"use client";

import Link from "next/link";
import { Bell, Bookmark, PenSquare, Search } from "lucide-react";
import { useAppData } from "@/hooks/use-app-data";

export function TopBar() {
  const { currentUser, authMode } = useAppData();

  return (
    <header className="sticky top-0 z-40 border-b border-brand-100/80 bg-surface/92 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-3 py-2.5 sm:px-4 lg:py-3">
        <Link href="/" className="text-base font-black tracking-tight text-ink sm:text-lg">
          HabeshaGram
        </Link>

        <label className="hidden flex-1 items-center gap-2 rounded-full border border-brand-100 bg-white/90 px-4 py-2 shadow-soft md:flex">
          <Search className="h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search posts, people, trends"
            className="w-full bg-transparent text-sm outline-none placeholder:text-stone-400"
          />
        </label>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden rounded-full border border-brand-100 bg-white/90 p-2 shadow-soft md:block">
            <Bell className="h-4 w-4 text-stone-600" />
          </div>
          <div className="hidden rounded-full border border-brand-100 bg-white/90 p-2 shadow-soft md:block">
            <Bookmark className="h-4 w-4 text-stone-600" />
          </div>
          <Link
            href="/create"
            className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-3 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-600 active:scale-[0.98]"
          >
            <PenSquare className="h-4 w-4" />
            <span>Post</span>
          </Link>
          <div className="hidden text-right lg:block">
            <p className="text-sm font-semibold text-ink">
              {currentUser ? `@${currentUser.username}` : "Sign in to join"}
            </p>
            <p className="text-xs text-stone-500">
              {currentUser
                ? "Firebase session active"
                : authMode === "unconfigured"
                  ? "Add Firebase config to enable sign-in"
                  : "Browse the community"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
