"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Globe2, ImagePlus, PenSquare, Sparkles } from "lucide-react";
import { CommunityHighlights } from "@/components/discovery/community-highlights";
import { CommunitySpotlight } from "@/components/discovery/community-spotlight";
import { DailyDebates } from "@/components/discovery/daily-debates";
import { EventHighlights } from "@/components/discovery/event-highlights";
import { LocalNewsSection } from "@/components/discovery/local-news-section";
import { TrendingTopics } from "@/components/discovery/trending-topics";
import { VideoHighlights } from "@/components/discovery/video-highlights";
import { WhoToFollow } from "@/components/discovery/who-to-follow";
import { AppShell } from "@/components/layout/app-shell";
import { Reveal } from "@/components/motion/reveal";
import { FeedList } from "@/components/posts/feed-list";
import { RadioTeaser } from "@/components/radio/radio-teaser";
import { EmptyState } from "@/components/ui/empty-state";
import { WorldNewsTeaser } from "@/components/world-news/world-news-teaser";
import { useAppData } from "@/hooks/use-app-data";
import { isFirebaseConfigured } from "@/lib/firebase";
import {
  getPersonalizationProfile,
  hasEnoughPersonalizationData,
  rankPersonalizedFeedPosts
} from "@/lib/personalization";
import { getFollowingIds } from "@/services/follow-service";
import { getPostsByUsers } from "@/services/post-service";
import { logEvent } from "@/lib/analytics-events";
import { Post } from "@/types";

export default function HomePage() {
  const { currentUser, deletedPostIds, posts, isLoading, errorMessage, savedPostIds } = useAppData();
  const [feedMode, setFeedMode] = useState<"for-you" | "following">("for-you");
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [followingPosts, setFollowingPosts] = useState<Post[]>([]);
  const [isFollowingLoading, setIsFollowingLoading] = useState(false);
  const [followingError, setFollowingError] = useState("");
  const [hasLoadedFollowing, setHasLoadedFollowing] = useState(false);

  useEffect(() => {
    logEvent("home_view", currentUser?.id);
  }, [currentUser?.id]);

  useEffect(() => {
    setFollowingIds([]);
    setFollowingPosts([]);
    setFollowingError("");
    setHasLoadedFollowing(false);
    setFeedMode("for-you");
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser) {
      setFollowingIds([]);
      return;
    }

    let isMounted = true;

    void (async () => {
      try {
        const nextFollowingIds = await getFollowingIds(currentUser.id);
        if (isMounted) {
          setFollowingIds(nextFollowingIds);
        }
      } catch {
        if (isMounted) {
          setFollowingIds([]);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  useEffect(() => {
    if (feedMode !== "following" || !currentUser || hasLoadedFollowing) {
      return;
    }

    let isMounted = true;

    void (async () => {
      try {
        setIsFollowingLoading(true);
        setFollowingError("");
        const nextFollowingIds = followingIds.length ? followingIds : await getFollowingIds(currentUser.id);
        const nextPosts = await getPostsByUsers(nextFollowingIds);

        if (isMounted) {
          setFollowingIds(nextFollowingIds);
          setFollowingPosts(nextPosts);
          setHasLoadedFollowing(true);
        }
      } catch (error) {
        if (isMounted) {
          setFollowingError(
            error instanceof Error ? error.message : "Unable to load your following feed."
          );
        }
      } finally {
        if (isMounted) {
          setIsFollowingLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [currentUser, feedMode, followingIds, hasLoadedFollowing]);

  const activePosts = feedMode === "following" ? followingPosts : posts;
  const visibleBasePosts = activePosts.filter((post) => !deletedPostIds.includes(post.id));
  const activeLoading = feedMode === "following" ? isFollowingLoading : isLoading;
  const activeError = feedMode === "following" ? followingError : errorMessage;
  const personalizationProfile = useMemo(
    () => getPersonalizationProfile(),
    [currentUser?.id, followingIds, posts, savedPostIds]
  );
  const likedPosts = useMemo(
    () => (currentUser ? posts.filter((post) => post.likedBy.includes(currentUser.id)) : []),
    [currentUser, posts]
  );
  const savedPosts = useMemo(
    () => posts.filter((post) => savedPostIds.includes(post.id)),
    [posts, savedPostIds]
  );
  const canPersonalize = currentUser
    ? hasEnoughPersonalizationData({
        profile: personalizationProfile,
        likedPosts,
        savedPosts,
        followingIds
      })
    : false;
  const visibleActivePosts =
    feedMode === "for-you" && canPersonalize
      ? rankPersonalizedFeedPosts({
          posts: visibleBasePosts,
          currentUserId: currentUser?.id,
          followingIds,
          likedPosts,
          savedPosts,
          profile: personalizationProfile
        })
      : visibleBasePosts;

  return (
    <AppShell>
      <div className="space-y-4 sm:space-y-5">
        <section className="relative overflow-hidden border-b border-white/[0.06] bg-card/90 px-3 py-5 sm:rounded-[32px] sm:border sm:px-6 sm:py-7 sm:shadow-soft">
          <div className="pointer-events-none absolute inset-0 bg-gold-radial" />
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 animate-float-slow rounded-full bg-brand-500/10 blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/70 to-transparent" />
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="animate-fade-in text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">
                Habesha Community
              </p>
              <h1 className="mt-2 animate-fade-up font-display text-[1.9rem] font-bold leading-[1.05] tracking-tight sm:text-[2.6rem]">
                {currentUser ? (
                  <>
                    Selam, <span className="text-gold">@{currentUser.username}</span>
                  </>
                ) : (
                  <>
                    Welcome to <span className="text-gold">HabeshaGram</span>
                  </>
                )}
              </h1>
              <p
                className="mt-3 max-w-2xl animate-fade-up text-sm leading-6 text-stone-500 sm:text-[15px]"
                style={{ animationDelay: "120ms" }}
              >
                Trusted radio, East Africa news, and community updates should all feel easy to step into from here.
              </p>
              <div
                className="mt-4 flex animate-fade-up flex-wrap gap-2 text-xs font-medium"
                style={{ animationDelay: "220ms" }}
              >
                <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/20 bg-brand-50 px-3 py-1.5 text-brand-700">
                  <Sparkles className="h-3.5 w-3.5" />
                  Youth culture
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-50 px-3 py-1.5 text-orange-700">
                  <Globe2 className="h-3.5 w-3.5" />
                  East Africa pulse
                </span>
              </div>
            </div>
            <Link
              href="/create"
              className="btn-glow hidden items-center justify-center rounded-full px-5 py-2.5 text-sm hover:-translate-y-0.5 sm:inline-flex"
            >
              Create a post
            </Link>
          </div>
          <p className="relative mt-5 rounded-[22px] border border-brand-500/15 bg-brand-50/70 px-4 py-3 text-sm text-brand-800">
            {isFirebaseConfigured
              ? "Your community feed, profiles, and discovery surfaces are ready to use."
              : "Sign-in and posting will feel complete once the app configuration is connected."}
          </p>
        </section>

        <section className="glass-card border-b border-white/[0.06] px-3 py-3 sm:rounded-[30px] sm:border sm:px-5 sm:py-4 sm:shadow-soft">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-orange-500 font-bold text-brand-950 shadow-glow-sm">
              {currentUser ? currentUser.username.slice(0, 1).toUpperCase() : "H"}
            </div>
            <div className="flex-1 space-y-3">
              <Link
                href="/create"
                className="flex min-h-11 items-center rounded-full border border-white/[0.07] bg-white/[0.03] px-4 text-sm text-stone-500 transition hover:border-brand-500/35 hover:bg-brand-50/60 hover:shadow-glow-sm"
              >
                {currentUser ? "What should the community see from you today?" : "Log in to start posting"}
              </Link>
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-brand-700">
                  <ImagePlus className="h-3.5 w-3.5" />
                  Image posts
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.04] px-3 py-1">
                  Community voice
                </span>
              </div>
            </div>
            <Link
              href="/create"
              className="btn-glow inline-flex h-11 w-11 items-center justify-center rounded-full active:scale-[0.95] sm:hidden"
            >
              <PenSquare className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <Reveal>
          <WorldNewsTeaser />
        </Reveal>
        <Reveal delay={40}>
          <RadioTeaser />
        </Reveal>
        <Reveal delay={40}>
          <VideoHighlights />
        </Reveal>
        <Reveal delay={40}>
          <DailyDebates />
        </Reveal>

        {activeError ? (
          <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{activeError}</div>
        ) : null}

        <section className="space-y-3">
          <div className="flex items-end justify-between px-3 pt-1 sm:px-1">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">
                {feedMode === "following" ? "Following Feed" : "Community Feed"}
              </p>
              <p className="mt-1 text-sm text-stone-500">
                {feedMode === "following"
                  ? "Fresh posts from the people you follow, sorted by newest first."
                  : "Fresh posts from the Habesha community, sorted by newest first."}
              </p>
            </div>
            <div className="glass-card inline-flex rounded-full p-1 shadow-soft">
              <button
                type="button"
                className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                  feedMode === "for-you"
                    ? "bg-gradient-to-r from-brand-500 to-orange-500 text-brand-950 shadow-glow-sm"
                    : "text-stone-500 hover:bg-white/[0.05] hover:text-ink"
                }`}
                onClick={() => setFeedMode("for-you")}
              >
                For You
              </button>
              <button
                type="button"
                className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                  feedMode === "following"
                    ? "bg-gradient-to-r from-brand-500 to-orange-500 text-brand-950 shadow-glow-sm"
                    : "text-stone-500 hover:bg-white/[0.05] hover:text-ink"
                } ${!currentUser ? "cursor-not-allowed opacity-50" : ""}`}
                onClick={() => {
                  if (!currentUser) {
                    return;
                  }
                  setFeedMode("following");
                }}
                disabled={!currentUser}
              >
                Following
              </button>
            </div>
          </div>
          {feedMode === "following" && !currentUser ? (
            <EmptyState
              title="Log in to see your following feed"
              description="Once you follow a few people, their newest posts will show up here."
            />
          ) : feedMode === "following" && !activeLoading && !visibleActivePosts.length ? (
            <EmptyState
              title="Your following feed is waiting"
              description="Follow a few creators, news voices, or culture pages to make this tab feel alive."
            />
          ) : (
            <FeedList posts={visibleActivePosts} isLoading={activeLoading} />
          )}
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
