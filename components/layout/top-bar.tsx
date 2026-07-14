"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bell, Bookmark, Globe2, Mic2, PenSquare, Search } from "lucide-react";
import { useAppData } from "@/hooks/use-app-data";

const iconLinkClass =
  "inline-flex rounded-full border border-white/[0.07] bg-white/[0.04] p-2.5 text-stone-500 transition hover:-translate-y-0.5 hover:border-brand-500/40 hover:text-brand-700 hover:shadow-glow-sm active:scale-[0.96]";

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
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-surface/80 backdrop-blur-2xl">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />
      <div className="mx-auto flex max-w-[1380px] items-center gap-2.5 px-3 py-2.5 sm:gap-3 sm:px-4 lg:py-3">
        <Link
          href="/"
          className="group flex items-center gap-2 font-display text-base font-bold tracking-tight text-ink sm:text-lg"
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-orange-500 text-sm font-black text-brand-950 shadow-glow-sm transition duration-300 group-hover:scale-105 group-hover:shadow-glow">
            H
          </span>
          <span>
            <span className="text-gold">Habesha</span>Gram
          </span>
        </Link>

        <form
          onSubmit={handleSubmit}
          className="hidden flex-1 items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.04] px-4 py-2.5 transition duration-300 focus-within:border-brand-500/45 focus-within:bg-white/[0.06] focus-within:shadow-glow-sm md:flex"
        >
          <Search className="h-4 w-4 text-stone-400" />
          <input
            type="text"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search posts, people, news, trends"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-stone-400"
          />
        </form>

        <div className="ml-auto flex items-center gap-2">
          <Link href="/search" aria-label="Search" className={`${iconLinkClass} md:hidden`}>
            <Search className="h-4 w-4" />
          </Link>
          <Link href="/radio" aria-label="Radio" className={`hidden sm:inline-flex ${iconLinkClass}`}>
            <Mic2 className="h-4 w-4" />
          </Link>
          <Link href="/world-news" aria-label="World News" className={`hidden sm:inline-flex ${iconLinkClass}`}>
            <Globe2 className="h-4 w-4" />
          </Link>
          <Link href="/notifications" aria-label="Notifications" className={`relative ${iconLinkClass}`}>
            <Bell className="h-4 w-4" />
            {currentUser && unreadNotificationCount > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 animate-pulse-glow items-center justify-center rounded-full bg-gradient-to-r from-brand-500 to-orange-500 px-1 text-[10px] font-bold text-brand-950">
                {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
              </span>
            ) : null}
          </Link>
          <Link href="/saved" aria-label="Saved posts" className={`hidden ${iconLinkClass} md:inline-flex`}>
            <Bookmark className="h-4 w-4" />
          </Link>
          <Link
            href="/create"
            aria-label="Create post"
            className="btn-glow inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm hover:-translate-y-0.5 active:scale-[0.97] sm:px-3.5"
          >
            <PenSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Post</span>
          </Link>
          <div className="hidden text-right lg:block">
            <p className="text-sm font-semibold text-ink">
              {currentUser ? `@${currentUser.username}` : "Sign in to join"}
            </p>
            <p className="text-xs text-stone-500">
              {currentUser
                ? "You are in"
                : authMode === "unconfigured"
                  ? "Sign-in will be ready once the app config is connected"
                  : "Browse the community"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
