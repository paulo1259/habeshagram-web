"use client";

import Link from "next/link";
import { ImagePlus, PenSquare } from "lucide-react";
import { CommunitySpotlight } from "@/components/discovery/community-spotlight";
import { CommunityHighlights } from "@/components/discovery/community-highlights";
import { EventHighlights } from "@/components/discovery/event-highlights";
import { LocalNewsSection } from "@/components/discovery/local-news-section";
import { RadioShowcase } from "@/components/discovery/radio-showcase";
import { TrendingTopics } from "@/components/discovery/trending-topics";
import { WhoToFollow } from "@/components/discovery/who-to-follow";
import { AppShell } from "@/components/layout/app-shell";
import { FeedList } from "@/components/posts/feed-list";
import { useAppData } from "@/hooks/use-app-data";
import { isFirebaseConfigured } from "@/lib/firebase";

export default function HomePage() {
  const { currentUser, posts, isLoading, errorMessage } = useAppData();

  return (
    <AppShell>
      <div className="space-y-4 sm:space-y-5">
        <section className="border-b border-brand-100 bg-white/96 px-3 py-4 sm:rounded-[28px] sm:border sm:px-5 sm:py-5 sm:shadow-soft">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                Habesha Community
              </p>
              <h1 className="mt-1 text-[1.55rem] font-black tracking-tight text-ink sm:text-2xl">
                {currentUser ? `Selam, @${currentUser.username}` : "Welcome to HabeshaGram"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
                Share thoughts, food, music, style, memes, and community updates in a warm,
                mobile-first space.
              </p>
            </div>
            <Link
              href="/create"
              className="hidden items-center justify-center rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-600 sm:inline-flex"
            >
              Create a post
            </Link>
          </div>
          <p className="mt-3 rounded-2xl bg-brand-50 px-4 py-3 text-sm text-brand-900">
            {isFirebaseConfigured
              ? "Firebase auth is connected. Feed and discovery content still use the local MVP data layer until posts and comments are wired to Firestore."
              : "Add your Firebase env values in .env.local to enable login and signup. The feed and discovery sections still work with local MVP content."}
          </p>
        </section>

        <section className="border-b border-brand-100 bg-white/96 px-3 py-3 sm:rounded-[28px] sm:border sm:px-5 sm:py-4 sm:shadow-soft">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-800">
              {currentUser ? currentUser.username.slice(0, 1).toUpperCase() : "H"}
            </div>
            <div className="flex-1 space-y-3">
              <Link
                href="/create"
                className="flex min-h-11 items-center rounded-full border border-brand-100 bg-brand-50/40 px-4 text-sm text-stone-500 transition hover:border-brand-200 hover:bg-brand-50"
              >
                {currentUser ? "What would you like to share?" : "Log in to start posting"}
              </Link>
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1">
                  <ImagePlus className="h-3.5 w-3.5 text-brand-700" />
                  Image posts
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1">
                  Community updates
                </span>
              </div>
            </div>
            <Link
              href="/create"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-brand-500 text-white shadow-soft transition hover:bg-brand-600 active:scale-[0.98] sm:hidden"
            >
              <PenSquare className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="space-y-2">
          <div className="px-3 pt-1 sm:px-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">
              Live Radio
            </p>
          </div>
          <RadioShowcase />
        </section>

        {errorMessage ? (
          <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>
        ) : null}

        <section className="space-y-3">
          <div className="flex items-end justify-between px-3 pt-1 sm:px-1">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">
                Community Feed
              </p>
              <p className="mt-1 text-sm text-stone-500">
                Fresh posts from the Habesha community, sorted by newest first.
              </p>
            </div>
          </div>
          <FeedList posts={posts} isLoading={isLoading} />
        </section>
        <LocalNewsSection />
        <div className="grid gap-4 xl:hidden">
          <TrendingTopics />
          <WhoToFollow />
          <EventHighlights />
          <CommunitySpotlight />
          <CommunityHighlights />
        </div>
      </div>
    </AppShell>
  );
}
