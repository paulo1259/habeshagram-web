"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Clapperboard,
  ExternalLink,
  Heart,
  MessageCircle,
  Play,
  Share2,
  Volume2,
  VolumeX,
  X
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { ShareActions } from "@/components/ui/share-actions";
import { useAppData } from "@/hooks/use-app-data";
import { trackEvent } from "@/lib/analytics";
import { recordSectionUsage, recordVideoEngagement } from "@/lib/personalization";
import { cn, createId, formatRelativeTime } from "@/lib/utils";
import { getCuratedVideos } from "@/services/curated-video-service";
import { getTeamSlug } from "@/services/football-hub-data";
import { CuratedVideoItem } from "@/types";

const SHORTS_MUTED_STORAGE_KEY = "habeshagram-shorts-muted";
const SHORTS_REACTIONS_STORAGE_KEY = "habeshagram-shorts-reactions-v2";
const SHORTS_DOUBLE_TAP_MS = 280;
const SHORTS_DOUBLE_TAP_DISTANCE_PX = 24;
const QUICK_REACTIONS = ["🔥", "👏", "😂", "🇪🇹"] as const;

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

function parseDurationToSeconds(value: string) {
  const cleaned = value.trim();
  if (!cleaned) {
    return Number.POSITIVE_INFINITY;
  }

  const parts = cleaned.split(":").map((part) => Number.parseInt(part, 10));
  if (parts.some((part) => Number.isNaN(part))) {
    return Number.POSITIVE_INFINITY;
  }

  if (parts.length === 1) {
    return parts[0];
  }

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  return parts[0] * 3600 + parts[1] * 60 + parts[2];
}

function isLikelyShort(video: CuratedVideoItem) {
  const tags = (video.hashtags ?? []).map((tag) => tag.toLowerCase());
  if (tags.some((tag) => ["short", "shorts", "reel", "clips", "clip"].includes(tag))) {
    return true;
  }

  return parseDurationToSeconds(video.duration) <= 180;
}

function selectShortVideos(videos: CuratedVideoItem[]) {
  const candidates = videos.filter(isLikelyShort);
  return (candidates.length >= 3 ? candidates : videos).slice(0, 12);
}

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
    if (!raw) {
      return {};
    }

    return JSON.parse(raw) as ShortsReactionMap;
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

function ShortsActionRail({
  video,
  reactions,
  canGoUp,
  canGoDown,
  onUp,
  onDown,
  onOpenDrawer
}: {
  video: CuratedVideoItem;
  reactions: ShortReactionState;
  canGoUp: boolean;
  canGoDown: boolean;
  onUp: () => void;
  onDown: () => void;
  onOpenDrawer: () => void;
}) {
  return (
    <div className="flex flex-row gap-2 overflow-x-auto no-scrollbar xl:flex-col xl:items-center xl:justify-end">
      <button
        type="button"
        onClick={onUp}
        disabled={!canGoUp}
        className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/14 text-white shadow-lg backdrop-blur transition hover:bg-white/22 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronUp className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={onDown}
        disabled={!canGoDown}
        className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/14 text-white shadow-lg backdrop-blur transition hover:bg-white/22 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronDown className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={onOpenDrawer}
        className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/14 text-white shadow-lg backdrop-blur transition hover:bg-white/22"
      >
        <div className="relative">
          <Heart className={cn("h-4 w-4", reactions.liked && "fill-white text-white")} />
          {reactions.likeCount > 0 ? (
            <span className="absolute -right-3 -top-3 rounded-full bg-white/90 px-1.5 py-0.5 text-[10px] font-bold text-ink">
              {reactions.likeCount}
            </span>
          ) : null}
        </div>
      </button>
      <button
        type="button"
        onClick={onOpenDrawer}
        className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/14 text-white shadow-lg backdrop-blur transition hover:bg-white/22"
      >
        <div className="relative">
          <MessageCircle className="h-4 w-4" />
          {reactions.comments.length ? (
            <span className="absolute -right-3 -top-3 rounded-full bg-white/90 px-1.5 py-0.5 text-[10px] font-bold text-ink">
              {reactions.comments.length}
            </span>
          ) : null}
        </div>
      </button>
      <Link
        href={`/videos/${video.id}`}
        className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/14 text-white shadow-lg backdrop-blur transition hover:bg-white/22"
      >
        <ExternalLink className="h-4 w-4" />
      </Link>
      <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/14 text-white shadow-lg backdrop-blur">
        <Share2 className="h-4 w-4" />
      </div>
    </div>
  );
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
  video: CuratedVideoItem;
  reactions: ShortReactionState;
  draftComment: string;
  onChangeDraft: (value: string) => void;
  onClose: () => void;
  onSubmitComment: () => void;
  onReact: (emoji: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/45 backdrop-blur-[2px]">
      <button type="button" aria-label="Close reactions drawer" className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full rounded-t-[32px] border border-brand-100/80 bg-white p-4 shadow-[0_-20px_60px_rgba(21,16,12,0.22)] sm:p-5">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-brand-100" />
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Reactions</p>
            <h3 className="mt-1 line-clamp-2 text-lg font-black tracking-tight text-ink">{video.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-800 transition hover:bg-brand-100"
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
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-brand-100 bg-brand-50/60 px-4 py-2 text-sm font-semibold text-brand-900 transition hover:bg-brand-100"
            >
              <span className="text-base">{emoji}</span>
              <span>{reactions.emojiCounts[emoji] ?? 0}</span>
            </button>
          ))}
        </div>

        <div className="mt-5 rounded-[24px] bg-brand-50/45 px-4 py-3">
          <div className="flex items-center gap-2 text-brand-800">
            <Heart className={cn("h-4 w-4", reactions.liked && "fill-current")} />
            <p className="text-sm font-semibold text-ink">{reactions.likeCount} likes on this short</p>
          </div>
          <p className="mt-1 text-sm text-stone-600">
            Double tap on the active short to like it instantly with a quick heart burst.
          </p>
        </div>

        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-ink">Comments</p>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-stone-500">
              {reactions.comments.length} total
            </p>
          </div>

          <div className="max-h-56 space-y-3 overflow-y-auto pr-1">
            {reactions.comments.length ? (
              reactions.comments
                .slice()
                .reverse()
                .map((comment) => (
                  <div key={comment.id} className="rounded-[20px] border border-brand-100 bg-white px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-ink">@{comment.username}</p>
                      <p className="text-xs text-stone-500">{formatRelativeTime(comment.createdAt)}</p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-stone-600">{comment.text}</p>
                  </div>
                ))
            ) : (
              <div className="rounded-[20px] border border-dashed border-brand-100 bg-brand-50/35 px-4 py-4 text-sm text-stone-600">
                No comments yet. Start the conversation without leaving the shorts feed.
              </div>
            )}
          </div>

          <div className="rounded-[24px] border border-brand-100 bg-white p-3">
            <textarea
              value={draftComment}
              onChange={(event) => onChangeDraft(event.target.value)}
              placeholder="Drop a quick reaction..."
              rows={3}
              className="w-full resize-none rounded-[18px] bg-brand-50/40 px-3 py-3 text-sm outline-none placeholder:text-stone-400"
            />
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={onSubmitComment}
                className="inline-flex min-h-10 items-center gap-2 rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-600"
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

export function ShortsPage() {
  const { currentUser } = useAppData();
  const [videos, setVideos] = useState<CuratedVideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [heartBurstVideoId, setHeartBurstVideoId] = useState<string | null>(null);
  const [reactionState, setReactionState] = useState<ShortsReactionMap>({});
  const [drawerVideoId, setDrawerVideoId] = useState<string | null>(null);
  const [draftComment, setDraftComment] = useState("");
  const cardRefs = useRef<Array<HTMLElement | null>>([]);
  const lastTapRef = useRef<{ at: number; x: number; y: number } | null>(null);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      setIsLoading(true);
      const items = await getCuratedVideos();
      if (!isMounted) {
        return;
      }

      setVideos(selectShortVideos(items));
      setIsLoading(false);
    })();

    recordSectionUsage("videos", 3);

    const storedMuted =
      typeof window !== "undefined" ? window.localStorage.getItem(SHORTS_MUTED_STORAGE_KEY) : null;
    setIsMuted(storedMuted == null ? true : storedMuted !== "false");
    setReactionState(readShortsReactionState());

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(SHORTS_MUTED_STORAGE_KEY, String(isMuted));
  }, [isMuted]);

  useEffect(() => {
    if (!videos.length) {
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
        threshold: [0.55, 0.75]
      }
    );

    cardRefs.current.forEach((node) => {
      if (node) {
        observer.observe(node);
      }
    });

    return () => {
      observer.disconnect();
    };
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
      team_tag: activeVideo.teamTag ?? null,
      surface: "shorts_feed"
    });

    recordVideoEngagement({
      teamTag: activeVideo.teamTag,
      hashtags: activeVideo.hashtags,
      weight: 4
    });
  }, [activeIndex, videos]);

  function scrollToIndex(nextIndex: number) {
    const clamped = Math.max(0, Math.min(nextIndex, videos.length - 1));
    cardRefs.current[clamped]?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveIndex(clamped);
  }

  function updateReactionState(videoId: string, updater: (current: ShortReactionState) => ShortReactionState) {
    setReactionState((current) => {
      const next = {
        ...current,
        [videoId]: updater(getReactionStateForVideo(current, videoId))
      };
      writeShortsReactionState(next);
      return next;
    });
  }

  function triggerLike(video: CuratedVideoItem) {
    updateReactionState(video.id, (current) => ({
      ...current,
      liked: true,
      likeCount: current.liked ? current.likeCount : current.likeCount + 1
    }));

    setHeartBurstVideoId(video.id);
    window.setTimeout(() => {
      setHeartBurstVideoId((current) => (current === video.id ? null : current));
    }, 900);

    trackEvent("share_action", {
      action: "short_like",
      video_id: video.id
    });
  }

  function handleVideoTap(video: CuratedVideoItem, event: React.PointerEvent<HTMLButtonElement>) {
    const nextTap = {
      at: Date.now(),
      x: event.clientX,
      y: event.clientY
    };

    const previousTap = lastTapRef.current;
    lastTapRef.current = nextTap;

    if (!previousTap) {
      return;
    }

    const diffMs = nextTap.at - previousTap.at;
    const distance = Math.hypot(nextTap.x - previousTap.x, nextTap.y - previousTap.y);

    if (diffMs <= SHORTS_DOUBLE_TAP_MS && distance <= SHORTS_DOUBLE_TAP_DISTANCE_PX) {
      triggerLike(video);
      trackEvent("play_video", {
        video_id: video.id,
        title: video.title,
        surface: "shorts_double_tap_like"
      });
      lastTapRef.current = null;
    }
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
  const activeReactions = activeVideo ? getReactionStateForVideo(reactionState, activeVideo.id) : getDefaultReactionState();
  const drawerVideo = drawerVideoId ? videos.find((video) => video.id === drawerVideoId) ?? null : null;
  const drawerReactions = drawerVideo ? getReactionStateForVideo(reactionState, drawerVideo.id) : getDefaultReactionState();

  const activeProgress = useMemo(() => {
    if (!videos.length) {
      return 0;
    }

    return ((activeIndex + 1) / videos.length) * 100;
  }, [activeIndex, videos.length]);

  return (
    <AppShell>
      <div className="page-stack pb-20 lg:pb-8">
        <section className="page-hero overflow-hidden border-b border-brand-100/80 bg-white/96 sm:border">
          <div className="bg-gradient-to-br from-stone-950 via-stone-900 to-brand-950 px-4 py-5 text-white sm:px-6 sm:py-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Shorts</p>
                <h1 className="page-title mt-1 text-white">Swipeable clips, HabeshaGram style</h1>
                <p className="mt-3 text-sm leading-6 text-white/82 sm:text-[15px]">
                  Shorts v2 adds persistent sound state, faster next-clip loading, double-tap likes, and a clean reactions drawer while keeping the feed fast and focused.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-white/90">
                  <Clapperboard className="h-3.5 w-3.5" />
                  {videos.length || 0} clips loaded
                </span>
                <Link
                  href="/"
                  className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/16"
                >
                  Back home
                </Link>
              </div>
            </div>
          </div>
        </section>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((item) => (
              <div key={item} className="surface-panel overflow-hidden rounded-[32px] p-3 sm:p-4">
                <div className="min-h-[calc(100dvh-11rem)] animate-pulse rounded-[28px] bg-brand-100/80" />
              </div>
            ))}
          </div>
        ) : !videos.length ? (
          <EmptyState
            title="No shorts available yet"
            description="Curated clips will appear here once the video collection has enough short-form videos to power the vertical feed."
          />
        ) : (
          <>
            <div className="surface-panel sticky top-[74px] z-20 overflow-hidden rounded-[24px] px-4 py-3 shadow-soft sm:top-[82px]">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Shorts feed</p>
                  <p className="truncate text-sm text-stone-600">
                    {activeIndex + 1} of {videos.length}
                    {activeVideo ? ` · ${activeVideo.title}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsMuted((current) => !current)}
                    className="inline-flex min-h-10 items-center gap-2 rounded-full border border-brand-100 bg-white px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-800 shadow-sm transition hover:bg-brand-50"
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    {isMuted ? "Muted" : "Sound on"}
                  </button>
                </div>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-brand-100/80">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-500 via-orange-400 to-brand-300 transition-[width] duration-300"
                  style={{ width: `${activeProgress}%` }}
                />
              </div>
            </div>

            <div className="max-h-[calc(100dvh-8.75rem)] snap-y snap-mandatory overflow-y-auto no-scrollbar">
              <div className="space-y-4">
                {videos.map((video, index) => {
                  const isActive = index === activeIndex;
                  const shouldPreloadNext = index === activeIndex + 1;
                  const reactions = getReactionStateForVideo(reactionState, video.id);

                  return (
                    <article
                      key={video.id}
                      ref={(node) => {
                        cardRefs.current[index] = node;
                      }}
                      data-index={index}
                      className="snap-start"
                    >
                      <div className="surface-panel overflow-hidden rounded-[32px] p-2.5 sm:p-3">
                        <div className="relative min-h-[calc(100dvh-9.5rem)] overflow-hidden rounded-[28px] bg-black shadow-soft">
                          {(isActive || shouldPreloadNext) ? (
                            <iframe
                              key={`${video.id}-${isMuted ? "muted" : "sound"}-${isActive ? "active" : "preload"}`}
                              src={buildShortsEmbedUrl(video.embedUrl, isMuted)}
                              title={video.title}
                              className={cn(
                                "absolute inset-0 h-full w-full",
                                isActive ? "pointer-events-none opacity-100" : "pointer-events-none opacity-0"
                              )}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                            />
                          ) : null}

                          {!isActive ? (
                            <button
                              type="button"
                              onClick={() => scrollToIndex(index)}
                              className="absolute inset-0 block h-full w-full text-left"
                            >
                              <img
                                src={video.thumbnailURL}
                                alt={video.title}
                                loading={shouldPreloadNext ? "eager" : "lazy"}
                                decoding="async"
                                className="h-full w-full object-cover transition duration-500"
                              />
                            </button>
                          ) : null}

                          {isActive ? (
                            <button
                              type="button"
                              aria-label="Double tap to like this short"
                              onPointerUp={(event) => handleVideoTap(video, event)}
                              className="absolute inset-0 z-[1] block h-full w-full"
                            />
                          ) : null}

                          <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/28 to-transparent" />
                          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/45 via-black/10 to-transparent" />

                          {heartBurstVideoId === video.id ? (
                            <div className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center">
                              <div className="animate-[ping_700ms_cubic-bezier(0.22,1,0.36,1)] rounded-full bg-white/18 p-10">
                                <Heart className="h-16 w-16 fill-white text-white drop-shadow-[0_10px_26px_rgba(0,0,0,0.35)]" />
                              </div>
                            </div>
                          ) : null}

                          <div className="absolute inset-x-4 top-4 z-[3] flex items-start justify-between gap-3 sm:inset-x-5">
                            <div className="flex flex-wrap gap-2">
                              <span className="rounded-full bg-white/14 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur">
                                {video.category}
                              </span>
                              <span className="rounded-full bg-black/35 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur">
                                {video.duration}
                              </span>
                            </div>
                            <span className="rounded-full bg-white/14 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur">
                              Clip {index + 1}
                            </span>
                          </div>

                          <div className="absolute inset-x-4 bottom-4 z-[3] sm:inset-x-5 sm:bottom-5">
                            <div className="grid items-end gap-4 xl:grid-cols-[minmax(0,1fr)_5rem]">
                              <div className="space-y-4">
                                <div className="max-w-2xl">
                                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/72">{video.source}</p>
                                  <h2 className="mt-2 line-clamp-2 text-2xl font-black tracking-tight text-white sm:text-[2rem]">
                                    {video.title}
                                  </h2>
                                  <p className="mt-3 line-clamp-3 max-w-xl text-sm leading-6 text-white/86 sm:text-[15px]">
                                    {video.summary}
                                  </p>
                                </div>

                                <div className="flex flex-wrap gap-2 text-xs font-medium text-white/85">
                                  <span className="rounded-full bg-white/12 px-3 py-1.5 backdrop-blur">
                                    {video.publishLabel ?? "Fresh pick"}
                                  </span>
                                  {video.teamTag ? (
                                    <Link
                                      href={`/football/${getTeamSlug(video.teamTag)}`}
                                      className="pointer-events-auto rounded-full bg-white/12 px-3 py-1.5 font-semibold backdrop-blur transition hover:bg-white/20"
                                    >
                                      {video.teamTag}
                                    </Link>
                                  ) : null}
                                </div>

                                {video.hashtags?.length ? (
                                  <div className="flex flex-wrap gap-2">
                                    {video.hashtags.slice(0, 4).map((tag) => (
                                      <Link
                                        key={tag}
                                        href={`/topic/${tag}`}
                                        className="pointer-events-auto rounded-full bg-white/12 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/20"
                                      >
                                        #{tag}
                                      </Link>
                                    ))}
                                  </div>
                                ) : null}

                                <div className="pointer-events-auto flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => scrollToIndex(Math.min(index + 1, videos.length - 1))}
                                    className="inline-flex min-h-10 items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink shadow-soft transition hover:scale-[1.01] hover:bg-white/92 active:scale-[0.98]"
                                  >
                                    <Play className="h-4 w-4 fill-current" />
                                    {index === videos.length - 1 ? "Replay current" : "Next clip"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDrawerVideoId(video.id)}
                                    className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/16 bg-white/12 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/18"
                                  >
                                    <MessageCircle className="h-4 w-4" />
                                    React
                                  </button>
                                  <Link
                                    href={`/videos/${video.id}`}
                                    className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/16 bg-white/12 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/18"
                                  >
                                    Full page
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </Link>
                                </div>
                              </div>

                              <div className="pointer-events-auto xl:justify-self-end">
                                <ShortsActionRail
                                  video={video}
                                  reactions={reactions}
                                  canGoUp={index > 0}
                                  canGoDown={index < videos.length - 1}
                                  onUp={() => scrollToIndex(index - 1)}
                                  onDown={() => scrollToIndex(index + 1)}
                                  onOpenDrawer={() => setDrawerVideoId(video.id)}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-col gap-3 rounded-[24px] bg-gradient-to-r from-white to-brand-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">Share this clip</p>
                            <p className="truncate text-sm text-stone-600">Send people straight to the full HabeshaGram video route.</p>
                          </div>
                          <ShareActions
                            path={`/videos/${video.id}`}
                            title={video.title}
                            text={video.summary}
                          />
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </>
        )}

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
    </AppShell>
  );
}
