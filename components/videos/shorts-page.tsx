"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ExternalLink,
  Heart,
  MessageCircle,
  Pause,
  Play,
  Share2,
  Volume2,
  VolumeX,
  X
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { ShareActions } from "@/components/ui/share-actions";
import { useAppData } from "@/hooks/use-app-data";
import { trackEvent } from "@/lib/analytics";
import { logEvent } from "@/lib/analytics-events";
import { recordSectionUsage, recordVideoEngagement } from "@/lib/personalization";
import { cn, createId, formatRelativeTime } from "@/lib/utils";
import { getCuratedShorts, sortShortsForFeed } from "@/services/curated-shorts-service";
import { CuratedShortItem } from "@/types";

const SHORTS_MUTED_STORAGE_KEY = "habeshagram-shorts-muted";
const SHORTS_REACTIONS_STORAGE_KEY = "habeshagram-shorts-reactions-v2";
const SHORTS_DOUBLE_TAP_MS = 260;
const SHORTS_DOUBLE_TAP_DISTANCE_PX = 22;
const SHORTS_SINGLE_TAP_DELAY_MS = 210;
const QUICK_REACTIONS = [
  "\uD83D\uDD25",
  "\uD83D\uDC4F",
  "\uD83D\uDE02",
  "\uD83C\uDDEA\uD83C\uDDF9"
] as const;

type ShortComment = {
  id: string;
  username: string;
  text: string;
  createdAt: string;
};

type ShortReactionState = {
  liked: boolean;
  likeCount: number;
  comments: ShortComment[];
  emojiCounts: Record<string, number>;
};

type ShortsReactionMap = Record<string, ShortReactionState>;

function buildShortsEmbedUrl(embedUrl: string, muted: boolean) {
  try {
    const url = new URL(embedUrl);
    url.searchParams.set("autoplay", "1");
    url.searchParams.set("mute", muted ? "1" : "0");
    url.searchParams.set("playsinline", "1");
    url.searchParams.set("rel", "0");
    return url.toString();
  } catch {
    return embedUrl;
  }
}

function getDefaultReactionState(): ShortReactionState {
  return {
    liked: false,
    likeCount: 0,
    comments: [],
    emojiCounts: {}
  };
}

function readShortsReactionState(): ShortsReactionMap {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(SHORTS_REACTIONS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ShortsReactionMap) : {};
  } catch {
    return {};
  }
}

function writeShortsReactionState(state: ShortsReactionMap) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SHORTS_REACTIONS_STORAGE_KEY, JSON.stringify(state));
}

function getReactionStateForVideo(state: ShortsReactionMap, videoId: string) {
  return state[videoId] ?? getDefaultReactionState();
}

function ShortsDrawer({
  video,
  reactions,
  draftComment,
  onChangeDraft,
  onClose,
  onSubmitComment,
  onReact
}: {
  video: CuratedShortItem;
  reactions: ShortReactionState;
  draftComment: string;
  onChangeDraft: (value: string) => void;
  onClose: () => void;
  onSubmitComment: () => void;
  onReact: (emoji: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-end bg-black/50 backdrop-blur-[4px]">
      <button
        type="button"
        aria-label="Close reactions drawer"
        className="absolute inset-0"
        onClick={onClose}
      />
      <div className="relative w-full rounded-t-[30px] border border-white/10 bg-[#fffaf5] px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-24px_80px_rgba(0,0,0,0.34)] sm:mx-auto sm:max-w-xl sm:rounded-[30px] sm:px-5 sm:pb-5">
        <div className="mx-auto h-1.5 w-12 rounded-full bg-stone-300/85" />
        <div className="mt-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">
              Reactions
            </p>
            <h3 className="mt-1 line-clamp-2 text-lg font-black tracking-tight text-ink">
              {video.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-card text-stone-700 shadow-sm transition hover:bg-stone-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onReact(emoji)}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-brand-100 bg-card px-4 py-2 text-sm font-semibold text-brand-900 shadow-sm transition hover:bg-brand-50"
            >
              <span className="text-base">{emoji}</span>
              <span>{reactions.emojiCounts[emoji] ?? 0}</span>
            </button>
          ))}
        </div>

        <div className="mt-5 rounded-[24px] border border-brand-100 bg-card px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2 text-brand-800">
            <Heart className={cn("h-4 w-4", reactions.liked && "fill-current")} />
            <p className="text-sm font-semibold text-ink">{reactions.likeCount} likes on this short</p>
          </div>
          <p className="mt-1 text-sm text-stone-600">
            Double tap on the active short to like it instantly without leaving the feed.
          </p>
        </div>

        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-ink">Comments</p>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-stone-500">
              {reactions.comments.length} total
            </p>
          </div>

          <div className="max-h-[42dvh] space-y-3 overflow-y-auto pr-1">
            {reactions.comments.length ? (
              reactions.comments
                .slice()
                .reverse()
                .map((comment) => (
                  <div key={comment.id} className="rounded-[20px] border border-brand-100 bg-card px-4 py-3 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-ink">@{comment.username}</p>
                      <p className="text-xs text-stone-500">{formatRelativeTime(comment.createdAt)}</p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-stone-600">{comment.text}</p>
                  </div>
                ))
            ) : (
              <div className="rounded-[20px] border border-dashed border-brand-100 bg-card/80 px-4 py-4 text-sm text-stone-600">
                No comments yet. Start the conversation without leaving the shorts feed.
              </div>
            )}
          </div>

          <div className="rounded-[24px] border border-brand-100 bg-card p-3 shadow-sm">
            <textarea
              value={draftComment}
              onChange={(event) => onChangeDraft(event.target.value)}
              placeholder="Drop a quick reaction..."
              rows={3}
              className="w-full resize-none rounded-[18px] bg-brand-50/45 px-3 py-3 text-sm outline-none placeholder:text-stone-400"
            />
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={onSubmitComment}
                className="inline-flex min-h-10 items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-orange-400 px-4 py-2 text-sm font-semibold text-brand-950 shadow-soft transition hover:brightness-105"
              >
                <MessageCircle className="h-4 w-4" />
                Post comment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type MediaLayerProps = {
  video: CuratedShortItem;
  isActive: boolean;
  shouldPreload: boolean;
  isMuted: boolean;
  isPaused: boolean;
  videoRef: (node: HTMLVideoElement | null) => void;
};

function MediaLayer({
  video,
  isActive,
  shouldPreload,
  isMuted,
  isPaused,
  videoRef
}: MediaLayerProps) {
  const shouldMount = isActive || shouldPreload;

  if (!shouldMount) {
    return (
      <img
        src={video.thumbnailURL}
        alt={video.title}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />
    );
  }

  if (video.playbackMode === "file") {
    return (
      <video
        ref={videoRef}
        key={`${video.id}-${shouldPreload ? "warm" : "cold"}`}
        src={video.videoUrl}
        muted={isMuted}
        loop
        playsInline
        preload={shouldPreload ? "auto" : "metadata"}
        autoPlay={isActive && !isPaused}
        poster={video.thumbnailURL || undefined}
        className={cn(
          "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
          isActive ? "opacity-100" : "opacity-0"
        )}
      />
    );
  }

  return (
    <>
      <img
        src={video.thumbnailURL}
        alt={video.title}
        loading={shouldPreload ? "eager" : "lazy"}
        decoding="async"
        className={cn(
          "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
          isActive ? "opacity-0" : "opacity-100"
        )}
      />
      {isActive || shouldPreload ? (
        <iframe
          key={`${video.id}-${isMuted ? "muted" : "sound"}-${isActive ? "active" : "preload"}`}
          src={buildShortsEmbedUrl(video.embedUrl, isMuted)}
          title={video.title}
          className={cn(
            "absolute inset-0 h-full w-full transition-opacity duration-300",
            isActive ? "opacity-100" : "opacity-0"
          )}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : null}
    </>
  );
}

export function ShortsPage() {
  const { currentUser } = useAppData();
  const [videos, setVideos] = useState<CuratedShortItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [heartBurstVideoId, setHeartBurstVideoId] = useState<string | null>(null);
  const [reactionState, setReactionState] = useState<ShortsReactionMap>({});
  const [drawerVideoId, setDrawerVideoId] = useState<string | null>(null);
  const [draftComment, setDraftComment] = useState("");
  const [pausedShortId, setPausedShortId] = useState<string | null>(null);
  const [showPauseFlash, setShowPauseFlash] = useState(false);
  const [shareVideoId, setShareVideoId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLElement | null>>([]);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const lastTapRef = useRef<{ at: number; x: number; y: number } | null>(null);
  const tapTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      setIsLoading(true);
      const items = await getCuratedShorts();
      if (!isMounted) {
        return;
      }

      setVideos(sortShortsForFeed(items).slice(0, 18));
      setIsLoading(false);
    })();

    recordSectionUsage("videos", 2);
    logEvent("reels_open", currentUser?.id);

    const storedMuted =
      typeof window !== "undefined" ? window.localStorage.getItem(SHORTS_MUTED_STORAGE_KEY) : null;
    setIsMuted(storedMuted == null ? true : storedMuted !== "false");
    setReactionState(readShortsReactionState());

    return () => {
      isMounted = false;
      if (tapTimerRef.current) {
        clearTimeout(tapTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(SHORTS_MUTED_STORAGE_KEY, String(isMuted));
  }, [isMuted]);

  useEffect(() => {
    setDrawerVideoId(null);
    setDraftComment("");
    setShareVideoId(null);
  }, [activeIndex]);

  useEffect(() => {
    if (!videos.length || !scrollRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

        if (!visibleEntry) {
          return;
        }

        const nextIndex = Number((visibleEntry.target as HTMLElement).dataset.index ?? "0");
        setActiveIndex((current) => (current === nextIndex ? current : nextIndex));
      },
      {
        root: scrollRef.current,
        threshold: [0.62, 0.8, 0.95]
      }
    );

    cardRefs.current.forEach((node) => {
      if (node) {
        observer.observe(node);
      }
    });

    return () => observer.disconnect();
  }, [videos]);

  useEffect(() => {
    const activeVideo = videos[activeIndex];
    if (!activeVideo) {
      return;
    }

    trackEvent("play_video", {
      video_id: activeVideo.id,
      title: activeVideo.title,
      category: activeVideo.category,
      surface: "shorts_feed"
    });

    recordVideoEngagement({
      hashtags: activeVideo.hashtags,
      weight: 4
    });
  }, [activeIndex, videos]);

  useEffect(() => {
    const activeVideo = videos[activeIndex];
    const raf = window.requestAnimationFrame(() => {
      videos.forEach((video, index) => {
        const node = videoRefs.current[video.id];
        if (!node || video.playbackMode !== "file") {
          return;
        }

        if (index !== activeIndex) {
          node.pause();
          node.currentTime = node.currentTime;
          return;
        }

        node.muted = isMuted;

        if (pausedShortId === activeVideo?.id) {
          node.pause();
          return;
        }

        void node.play().catch(() => {
          setPausedShortId(video.id);
        });
      });
    });

    return () => window.cancelAnimationFrame(raf);
  }, [activeIndex, isMuted, pausedShortId, videos]);

  function scrollToIndex(nextIndex: number) {
    const clamped = Math.max(0, Math.min(nextIndex, videos.length - 1));
    cardRefs.current[clamped]?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveIndex(clamped);
  }

  function updateReactionState(
    videoId: string,
    updater: (current: ShortReactionState) => ShortReactionState
  ) {
    setReactionState((current) => {
      const next = {
        ...current,
        [videoId]: updater(getReactionStateForVideo(current, videoId))
      };
      writeShortsReactionState(next);
      return next;
    });
  }

  function triggerLike(video: CuratedShortItem) {
    updateReactionState(video.id, (current) => ({
      ...current,
      liked: true,
      likeCount: current.liked ? current.likeCount : current.likeCount + 1
    }));

    setHeartBurstVideoId(video.id);
    window.setTimeout(() => {
      setHeartBurstVideoId((current) => (current === video.id ? null : current));
    }, 820);

    trackEvent("short_like", {
      video_id: video.id
    });
  }

  function togglePlayback(video: CuratedShortItem) {
    if (video.playbackMode !== "file") {
      return;
    }

    const nextPaused = pausedShortId === video.id ? null : video.id;
    setPausedShortId(nextPaused);
    setShowPauseFlash(true);
    window.setTimeout(() => setShowPauseFlash(false), 520);
  }

  function handleVideoTap(video: CuratedShortItem, event: React.PointerEvent<HTMLButtonElement>) {
    const nextTap = {
      at: Date.now(),
      x: event.clientX,
      y: event.clientY
    };

    const previousTap = lastTapRef.current;
    lastTapRef.current = nextTap;

    if (
      previousTap &&
      nextTap.at - previousTap.at <= SHORTS_DOUBLE_TAP_MS &&
      Math.hypot(nextTap.x - previousTap.x, nextTap.y - previousTap.y) <= SHORTS_DOUBLE_TAP_DISTANCE_PX
    ) {
      if (tapTimerRef.current) {
        clearTimeout(tapTimerRef.current);
        tapTimerRef.current = null;
      }
      triggerLike(video);
      trackEvent("short_double_tap_like", {
        video_id: video.id,
        title: video.title,
        surface: "shorts_feed"
      });
      lastTapRef.current = null;
      return;
    }

    if (tapTimerRef.current) {
      clearTimeout(tapTimerRef.current);
    }

    tapTimerRef.current = window.setTimeout(() => {
      togglePlayback(video);
      tapTimerRef.current = null;
    }, SHORTS_SINGLE_TAP_DELAY_MS);
  }

  function addQuickReaction(videoId: string, emoji: string) {
    updateReactionState(videoId, (current) => ({
      ...current,
      emojiCounts: {
        ...current.emojiCounts,
        [emoji]: (current.emojiCounts[emoji] ?? 0) + 1
      }
    }));
  }

  function submitComment(videoId: string) {
    const text = draftComment.trim();
    if (!text) {
      return;
    }

    updateReactionState(videoId, (current) => ({
      ...current,
      comments: [
        ...current.comments,
        {
          id: createId("short_comment"),
          username: currentUser?.username ?? "guest",
          text,
          createdAt: new Date().toISOString()
        }
      ]
    }));

    setDraftComment("");
  }

  const activeVideo = videos[activeIndex];
  const activeReactions = activeVideo
    ? getReactionStateForVideo(reactionState, activeVideo.id)
    : getDefaultReactionState();
  const drawerVideo = drawerVideoId ? videos.find((video) => video.id === drawerVideoId) ?? null : null;
  const drawerReactions = drawerVideo
    ? getReactionStateForVideo(reactionState, drawerVideo.id)
    : getDefaultReactionState();
  const activeProgress = useMemo(() => {
    if (!videos.length) {
      return 0;
    }

    return ((activeIndex + 1) / videos.length) * 100;
  }, [activeIndex, videos.length]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black px-3 py-3 text-white sm:px-4">
        <div className="mx-auto max-w-md space-y-3">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="min-h-[calc(100dvh-1.5rem)] animate-pulse rounded-[32px] bg-white/10"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!videos.length) {
    return (
      <div className="min-h-screen bg-black px-4 py-10">
        <div className="mx-auto max-w-xl">
          <EmptyState
            title="No shorts available yet"
            description="Curated shorts will appear here once admins publish vertical-friendly short-form clips into the dedicated shorts collection."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-40 h-32 bg-gradient-to-b from-black/70 via-black/18 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 h-36 bg-gradient-to-t from-black/82 via-black/26 to-transparent" />

      <div className="absolute inset-x-0 top-0 z-50 px-3 pb-2 pt-[calc(0.75rem+env(safe-area-inset-top))] sm:px-4">
        <div className="mx-auto flex max-w-md items-start justify-between gap-3">
          <Link
            href="/"
            className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-black/28 text-white backdrop-blur-xl transition hover:bg-black/40"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div className="min-w-0 flex-1 rounded-full border border-white/10 bg-black/28 px-4 py-2.5 text-center backdrop-blur-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">Shorts</p>
            <p className="truncate text-sm font-semibold text-white/92">
              {activeIndex + 1} of {videos.length}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsMuted((current) => !current)}
            className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-black/28 text-white backdrop-blur-xl transition hover:bg-black/40"
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
        </div>

        <div className="mx-auto mt-3 max-w-md">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/12">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 via-orange-400 to-brand-200 transition-[width] duration-300"
              style={{ width: `${activeProgress}%` }}
            />
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="h-screen snap-y snap-mandatory overflow-y-auto overscroll-y-contain no-scrollbar touch-pan-y"
      >
        {videos.map((video, index) => {
          const isActive = index === activeIndex;
          const shouldPreload = index === activeIndex || index === activeIndex + 1 || index === activeIndex - 1;
          const isPaused = pausedShortId === video.id;
          const reactions = getReactionStateForVideo(reactionState, video.id);

          return (
            <article
              key={video.id}
              ref={(node) => {
                cardRefs.current[index] = node;
              }}
              data-index={index}
              className="relative h-screen snap-start"
            >
              <div className="absolute inset-0">
                <MediaLayer
                  video={video}
                  isActive={isActive}
                  shouldPreload={shouldPreload}
                  isMuted={isMuted}
                  isPaused={isPaused}
                  videoRef={(node) => {
                    videoRefs.current[video.id] = node;
                  }}
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.16)_68%,rgba(0,0,0,0.34)_100%)]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/18 to-black/10" />
                <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/46 via-black/14 to-transparent" />
              </div>

              {isActive ? (
                <button
                  type="button"
                  aria-label="Toggle playback or double tap to like"
                  onPointerUp={(event) => handleVideoTap(video, event)}
                  className="absolute inset-0 z-[5] block h-full w-full"
                />
              ) : (
                <button
                  type="button"
                  aria-label={`Open ${video.title}`}
                  onClick={() => scrollToIndex(index)}
                  className="absolute inset-0 z-[5] block h-full w-full"
                />
              )}

              {heartBurstVideoId === video.id ? (
                <div className="pointer-events-none absolute inset-0 z-[7] flex items-center justify-center">
                  <div className="animate-[ping_700ms_cubic-bezier(0.22,1,0.36,1)] rounded-full bg-white/12 p-10">
                    <Heart className="h-16 w-16 fill-white text-white drop-shadow-[0_18px_36px_rgba(0,0,0,0.38)]" />
                  </div>
                </div>
              ) : null}

              {isActive && showPauseFlash ? (
                <div className="pointer-events-none absolute inset-0 z-[7] flex items-center justify-center">
                  <div className="rounded-full bg-black/34 p-5 backdrop-blur-xl">
                    {isPaused ? (
                      <Play className="h-10 w-10 fill-white text-white" />
                    ) : (
                      <Pause className="h-10 w-10 fill-white text-white" />
                    )}
                  </div>
                </div>
              ) : null}

              <div className="absolute inset-x-0 bottom-0 z-[8] px-3 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-4">
                <div className="mx-auto max-w-md">
                  <div className="grid items-end gap-4 md:grid-cols-[minmax(0,1fr)_64px]">
                    <div className="min-w-0">
                      <div className="mb-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-white/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-xl">
                          {video.category}
                        </span>
                        <span className="rounded-full bg-black/35 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-xl">
                          {video.duration}
                        </span>
                        <span className="rounded-full bg-black/35 px-3 py-1 text-[11px] font-semibold text-white/82 backdrop-blur-xl">
                          {video.publishLabel ?? "Fresh pick"}
                        </span>
                      </div>

                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/68">
                        {video.source}
                      </p>
                      <h1 className="mt-2 line-clamp-2 text-[1.9rem] font-black tracking-[-0.045em] text-white sm:text-[2.15rem]">
                        {video.title}
                      </h1>
                      <p className="mt-3 max-w-[26rem] text-sm leading-6 text-white/85 sm:text-[15px]">
                        {video.summary}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                                                {video.hashtags?.slice(0, 4).map((tag) => (
                          <Link
                            key={tag}
                            href={`/topic/${tag}`}
                            className="pointer-events-auto rounded-full bg-white/12 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-xl transition hover:bg-white/18"
                          >
                            #{tag}
                          </Link>
                        ))}
                      </div>

                      <div className="pointer-events-auto mt-4 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => togglePlayback(video)}
                          className="inline-flex min-h-10 items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-semibold text-ink shadow-soft transition hover:bg-card/92 active:scale-[0.98]"
                        >
                          {isPaused ? (
                            <Play className="h-4 w-4 fill-current" />
                          ) : (
                            <Pause className="h-4 w-4 fill-current" />
                          )}
                          {isPaused ? "Play" : "Pause"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDrawerVideoId(video.id)}
                          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/14 bg-white/12 px-4 py-2 text-sm font-semibold text-white backdrop-blur-xl transition hover:bg-white/18"
                        >
                          <MessageCircle className="h-4 w-4" />
                          React
                        </button>
                        <button
                          type="button"
                          onClick={() => setShareVideoId((current) => (current === video.id ? null : video.id))}
                          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/14 bg-white/12 px-4 py-2 text-sm font-semibold text-white backdrop-blur-xl transition hover:bg-white/18"
                        >
                          <Share2 className="h-4 w-4" />
                          Share
                        </button>
                      </div>

                      {shareVideoId === video.id ? (
                        <div className="pointer-events-auto mt-3 w-fit rounded-[24px] border border-white/12 bg-black/28 px-3 py-3 backdrop-blur-xl">
                          <ShareActions
                            path={`/shorts/${video.id}`}
                            title={video.title}
                            text={video.summary}
                            compact
                          />
                        </div>
                      ) : null}
                    </div>

                    <div className="pointer-events-auto flex flex-row gap-3 md:flex-col md:items-center md:justify-end">
                      <button
                        type="button"
                        onClick={() => triggerLike(video)}
                        className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/12 text-white shadow-lg backdrop-blur-xl transition hover:bg-white/18"
                      >
                        <div className="relative">
                          <Heart className={cn("h-5 w-5", reactions.liked && "fill-white text-white")} />
                          {reactions.likeCount > 0 ? (
                            <span className="absolute -right-3 -top-3 rounded-full bg-card/90 px-1.5 py-0.5 text-[10px] font-bold text-ink">
                              {reactions.likeCount}
                            </span>
                          ) : null}
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDrawerVideoId(video.id)}
                        className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/12 text-white shadow-lg backdrop-blur-xl transition hover:bg-white/18"
                      >
                        <div className="relative">
                          <MessageCircle className="h-5 w-5" />
                          {reactions.comments.length > 0 ? (
                            <span className="absolute -right-3 -top-3 rounded-full bg-card/90 px-1.5 py-0.5 text-[10px] font-bold text-ink">
                              {reactions.comments.length}
                            </span>
                          ) : null}
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsMuted((current) => !current)}
                        className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/12 text-white shadow-lg backdrop-blur-xl transition hover:bg-white/18"
                      >
                        {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                      </button>
                      <Link
                        href={`/shorts/${video.id}`}
                        className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/12 text-white shadow-lg backdrop-blur-xl transition hover:bg-white/18"
                      >
                        <ExternalLink className="h-5 w-5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {drawerVideo ? (
        <ShortsDrawer
          video={drawerVideo}
          reactions={drawerReactions}
          draftComment={draftComment}
          onChangeDraft={setDraftComment}
          onClose={() => {
            setDrawerVideoId(null);
            setDraftComment("");
          }}
          onSubmitComment={() => submitComment(drawerVideo.id)}
          onReact={(emoji) => addQuickReaction(drawerVideo.id, emoji)}
        />
      ) : null}
    </div>
  );
}
