"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bell, Bookmark, Clapperboard, Globe2, Mic2, PenSquare, Search } from "lucide-react";
import { useAppData } from "@/hooks/use-app-data";

export function TopBar() {
  const { currentUser, authMode, unreadNotificationCount } = useAppData();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    if (pathname.startsWith("/search")) {
      setSearchText(searchParams.get("q") || "");
      return;
    }

    setSearchText("");
  }, [pathname, searchParams]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuery = searchText.trim();
    router.push(nextQuery ? `/search?q=${encodeURIComponent(nextQuery)}` : "/search");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-brand-100/80 bg-surface/88 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1380px] items-center gap-2.5 px-3 py-2.5 sm:gap-3 sm:px-4 lg:py-3">
        <Link href="/" className="flex items-center gap-2 text-base font-black tracking-tight text-ink sm:text-lg">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-orange-400 text-sm text-white shadow-soft transition duration-200 hover:scale-[1.03]">
            H
          </span>
          <span>HabeshaGram</span>
        </Link>

        <form
          onSubmit={handleSubmit}
          className="hidden flex-1 items-center gap-2 rounded-full border border-brand-100/80 bg-white/92 px-4 py-2.5 shadow-soft transition duration-200 focus-within:border-brand-200 focus-within:bg-white md:flex"
        >
          <Search className="h-4 w-4 text-stone-400" />
          <input
            type="text"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search posts, people, football, trends"
            className="w-full bg-transparent text-sm outline-none placeholder:text-stone-400"
          />
        </form>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/search"
            className="inline-flex rounded-full border border-brand-100/80 bg-white/90 p-2.5 shadow-soft transition hover:-translate-y-0.5 hover:border-brand-200 md:hidden"
          >
            <Search className="h-4 w-4 text-stone-600" />
          </Link>
          <Link
            href="/radio"
            className="inline-flex rounded-full border border-brand-100/80 bg-white/90 p-2.5 shadow-soft transition hover:-translate-y-0.5 hover:border-brand-200"
          >
            <Mic2 className="h-4 w-4 text-stone-600" />
          </Link>
          <Link
            href="/shorts"
            className="inline-flex rounded-full border border-brand-100/80 bg-white/90 p-2.5 shadow-soft transition hover:-translate-y-0.5 hover:border-brand-200"
          >
            <Clapperboard className="h-4 w-4 text-stone-600" />
          </Link>
          <Link
            href="/world-news"
            className="inline-flex rounded-full border border-brand-100/80 bg-white/90 p-2.5 shadow-soft transition hover:-translate-y-0.5 hover:border-brand-200"
          >
            <Globe2 className="h-4 w-4 text-stone-600" />
          </Link>
          <Link
            href="/notifications"
            className="relative inline-flex rounded-full border border-brand-100/80 bg-white/90 p-2.5 shadow-soft transition hover:-translate-y-0.5 hover:border-brand-200"
          >
            <Bell className="h-4 w-4 text-stone-600" />
            {currentUser && unreadNotificationCount > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-brand-500 to-orange-400 px-1 text-[10px] font-bold text-white">
                {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
              </span>
            ) : null}
          </Link>
          <div className="hidden rounded-full border border-brand-100/80 bg-white/90 p-2.5 shadow-soft transition hover:-translate-y-0.5 hover:border-brand-200 md:block">
            <Link href="/saved">
              <Bookmark className="h-4 w-4 text-stone-600" />
            </Link>
          </div>
          <Link
            href="/create"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-orange-400 px-3.5 py-2 text-sm font-semibold text-white shadow-soft transition hover:brightness-105 active:scale-[0.98]"
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
