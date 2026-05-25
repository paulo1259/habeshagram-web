"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Flame, ImagePlus, PenSquare, Sparkles } from "lucide-react";
import { CommunityHighlights } from "@/components/discovery/community-highlights";
import { CommunitySpotlight } from "@/components/discovery/community-spotlight";
import { DailyDebates } from "@/components/discovery/daily-debates";
import { EventHighlights } from "@/components/discovery/event-highlights";
import { LocalNewsSection } from "@/components/discovery/local-news-section";
import { TrendingTopics } from "@/components/discovery/trending-topics";
import { VideoHighlights } from "@/components/discovery/video-highlights";
import { WhoToFollow } from "@/components/discovery/who-to-follow";
import { AppShell } from "@/components/layout/app-shell";
import { MMATeaser } from "@/components/mma/mma-teaser";
import { FeedList } from "@/components/posts/feed-list";
import { RadioTeaser } from "@/components/radio/radio-teaser";
import { EmptyState } from "@/components/ui/empty-state";
import { WorldCupBanner } from "@/components/world-cup/world-cup-banner";
import { WorldNewsTeaser } from "@/components/world-news/world-news-teaser";
import { useAppData } from "@/hooks/use-app-data";
import { isFirebaseConfigured } from "@/lib/firebase";
import {
  getPersonalizationProfile,
  getPreferredTeam,
  hasEnoughPersonalizationData,
  rankPersonalizedFeedPosts
} from "@/lib/personalization";
import { getFollowingIds } from "@/services/follow-service";
import { getPostsByUsers } from "@/services/post-service";
import { mmaHub } from "@/services/mma-hub-data";
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
  const preferredTeam = canPersonalize ? getPreferredTeam(personalizationProfile) : undefined;
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
        <section className="relative overflow-hidden border-b border-brand-100/80 bg-white/96 px-3 py-4 sm:rounded-[32px] sm:border sm:px-5 sm:py-5 sm:shadow-soft">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-500 via-orange-400 to-brand-300 sm:rounded-t-[32px]" />
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                Habesha Community
              </p>
              <h1 className="mt-1 text-[1.65rem] font-black tracking-tight text-ink sm:text-[2.1rem]">
                {currentUser ? `Selam, @${currentUser.username}` : "Welcome to HabeshaGram"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600 sm:text-[15px]">
                Share hot takes, memes, style, radio moments, fight-night reactions, and community updates in a warm, mobile-first Habesha timeline.
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium text-stone-600">
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-brand-700" />
                  Youth culture
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1.5">
                  <Flame className="h-3.5 w-3.5 text-orange-600" />
                  Fight week
                </span>
              </div>
            </div>
            <Link
              href="/create"
              className="hidden items-center justify-center rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-600 sm:inline-flex"
            >
              Create a post
            </Link>
          </div>
          <p className="relative mt-4 rounded-[22px] bg-brand-50 px-4 py-3 text-sm text-brand-900">
            {isFirebaseConfigured
              ? "Firebase auth is connected. Feed, posts, likes, comments, profiles, and discovery surfaces are live."
              : "Add your Firebase env values in .env.local to enable login and signup. Discovery sections will render real data when those services are configured."}
          </p>
        </section>

        <section className="border-b border-brand-100/80 bg-white/96 px-3 py-3 sm:rounded-[30px] sm:border sm:px-5 sm:py-4 sm:shadow-soft">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-200 to-orange-100 text-brand-800">
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

        <section className="overflow-hidden rounded-[28px] border border-brand-100/80 bg-gradient-to-r from-red-700 via-orange-500 to-brand-500 px-4 py-4 text-white shadow-soft sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/75">
                Tonight's focus
              </p>
              <p className="mt-1 text-lg font-black tracking-tight">
                {mmaHub.featuredFight.headline}
              </p>
              <p className="mt-2 inline-flex rounded-full bg-white/14 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
                {mmaHub.featuredFight.weightClass}
              </p>
              <p className="mt-2 text-sm text-white/88">
                Next big fight, curated cards, recent results, and the live-room prompt people can actually use on major nights.
              </p>
            </div>
            <Link
              href="/football"
              className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-800 shadow-soft transition hover:bg-brand-50"
            >
              Open MMA hub
            </Link>
          </div>
        </section>

        <WorldCupBanner />
        <MMATeaser />
        <RadioTeaser />
        <VideoHighlights team={preferredTeam} />
        <WorldNewsTeaser />
        <DailyDebates team={preferredTeam} />

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
            <div className="inline-flex rounded-full border border-brand-100 bg-white p-1 shadow-soft">
              <button
                type="button"
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  feedMode === "for-you"
                    ? "bg-gradient-to-r from-brand-500 to-orange-400 text-white"
                    : "text-stone-600 hover:bg-brand-50"
                }`}
                onClick={() => setFeedMode("for-you")}
              >
                For You
              </button>
              <button
                type="button"
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  feedMode === "following"
                    ? "bg-gradient-to-r from-brand-500 to-orange-400 text-white"
                    : "text-stone-600 hover:bg-brand-50"
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
              description="Follow a few creators, fight fans, or culture pages to make this tab feel alive."
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
