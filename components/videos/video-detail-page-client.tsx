"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Clock3, Film, Hash, PlayCircle, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { FeedList } from "@/components/posts/feed-list";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { getTeamSlug } from "@/services/football-hub-data";
import {
  getCuratedVideoById,
  getRelatedCuratedVideos
} from "@/services/curated-video-service";
import { useAppData } from "@/hooks/use-app-data";
import { CuratedVideoItem, Post } from "@/types";

function getRelatedPosts(posts: Post[], video: CuratedVideoItem) {
  return posts
    .map((post) => {
      let score = 0;

      if (video.teamTag && post.teamTag === video.teamTag) {
        score += 4;
      }

      const overlap = (post.hashtags ?? []).filter((tag) => (video.hashtags ?? []).includes(tag)).length;
      score += overlap * 2;

      if (!score) {
        return null;
      }

      return { post, score };
    })
    .filter((entry): entry is { post: Post; score: number } => Boolean(entry))
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return +new Date(b.post.createdAt) - +new Date(a.post.createdAt);
    })
    .slice(0, 8)
    .map((entry) => entry.post);
}

export function VideoDetailPageClient({ videoId }: { videoId: string }) {
  const { posts, isLoading } = useAppData();
  const [video, setVideo] = useState<CuratedVideoItem | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<CuratedVideoItem[]>([]);
  const [isVideoLoading, setIsVideoLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      setIsVideoLoading(true);
      const nextVideo = await getCuratedVideoById(videoId);
      if (process.env.NODE_ENV !== "production") {
        console.info("[video-detail:load]", {
          requestedId: videoId,
          found: Boolean(nextVideo),
          title: nextVideo?.title ?? null
        });
      }
      if (!isMounted) {
        return;
      }

      setVideo(nextVideo);

      if (nextVideo) {
        const nextRelatedVideos = await getRelatedCuratedVideos(nextVideo, 4);
        if (process.env.NODE_ENV !== "production") {
          console.info("[video-detail:related]", {
            requestedId: videoId,
            relatedIds: nextRelatedVideos.map((item) => item.id)
          });
        }
        if (!isMounted) {
          return;
        }
        setRelatedVideos(nextRelatedVideos);
      } else {
        setRelatedVideos([]);
      }

      setIsVideoLoading(false);
    })();

    return () => {
      isMounted = false;
    };
  }, [videoId]);

  const relatedPosts = useMemo(() => (video ? getRelatedPosts(posts, video) : []), [posts, video]);

  if (!isVideoLoading && !video) {
    return (
      <AppShell>
        <EmptyState
          title="This video could not be found"
          description="The highlight may have been removed from the editorial collection, or no curated video has been published with this id."
        />
      </AppShell>
    );
  }

  if (!video) {
    return (
      <AppShell>
        <div className="rounded-[28px] border border-brand-100 bg-white/96 p-6 text-sm text-stone-500 shadow-soft">
          Loading video highlight...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <section className="overflow-hidden border-b border-brand-100/80 bg-white/96 sm:rounded-[32px] sm:border sm:shadow-soft">
          <div className="bg-gradient-to-br from-brand-600 via-orange-400 to-brand-300 px-4 py-5 text-white sm:px-6 sm:py-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/95 transition hover:bg-white/18"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to feed
            </Link>

            <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
                  Video Highlight
                </p>
                <h1 className="mt-2 text-[1.9rem] font-black tracking-tight sm:text-[2.5rem]">
                  {video.title}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/88 sm:text-[15px]">
                  {video.summary}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:min-w-[20rem]">
                <div className="rounded-[24px] bg-white/12 px-4 py-3 backdrop-blur">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
                    Source
                  </p>
                  <p className="mt-2 text-base font-bold">{video.source}</p>
                </div>
                <div className="rounded-[24px] bg-white/12 px-4 py-3 backdrop-blur">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
                    Duration
                  </p>
                  <p className="mt-2 text-base font-bold">{video.duration}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 px-4 py-4 sm:px-6 sm:py-5">
            <div className="overflow-hidden rounded-[28px] border border-brand-100 bg-stone-950 shadow-soft">
              <div className="aspect-video w-full bg-black">
                <iframe
                  src={video.embedUrl}
                  title={video.title}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-full bg-brand-50 px-3 py-1.5 font-semibold text-brand-800">
                {video.category}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-3 py-1.5 text-stone-600">
                <Clock3 className="h-3.5 w-3.5" />
                {video.publishLabel ?? new Date(video.createdAt).toLocaleDateString()}
              </span>
              {video.teamTag ? (
                <Link
                  href={`/football/${getTeamSlug(video.teamTag)}`}
                  className="rounded-full bg-white px-3 py-1.5 font-semibold text-brand-800 shadow-sm transition hover:-translate-y-0.5"
                >
                  {video.teamTag}
                </Link>
              ) : null}
            </div>

            {video.hashtags?.length ? (
              <div className="flex flex-wrap gap-2">
                {video.hashtags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/topic/${tag}`}
                    className="rounded-full bg-brand-100/70 px-3 py-1.5 text-xs font-semibold text-brand-800 transition hover:bg-brand-200/80"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-5">
            <section className="space-y-3">
              <SectionHeader
                eyebrow="Related Discussion"
                title="Posts reacting to this moment"
                description="We match discussion using the same team tags and hashtags already powering HabeshaGram discovery."
              />
              {!isLoading && !relatedPosts.length ? (
                <EmptyState
                  title="No related posts yet"
                  description="Once the community starts posting with the same team tag or hashtags, the discussion will show up here."
                />
              ) : (
                <FeedList posts={relatedPosts} isLoading={isLoading} />
              )}
            </section>
          </div>

          <div className="space-y-4">
            <section className="rounded-[30px] border border-brand-100 bg-white/96 p-4 shadow-soft sm:p-5">
              <SectionHeader
                eyebrow="More to Watch"
                title="Keep the energy going"
                description="More curated clips chosen from the same football lane, category, or hashtag mood."
              />
              <div className="mt-4 space-y-3">
                {relatedVideos.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-[24px] border border-brand-100 bg-brand-50/40 p-3 transition hover:-translate-y-0.5 hover:border-brand-200 hover:bg-white"
                  >
                    <Link href={`/videos/${item.id}`} className="group flex gap-3">
                      <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-[18px] bg-brand-100">
                        <img
                          src={item.thumbnailURL}
                          alt={item.title}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-transparent" />
                        <div className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur">
                          <PlayCircle className="h-3 w-3" />
                          {item.duration}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                          <span>{item.category}</span>
                          <span>{item.source}</span>
                        </div>
                        <h3 className="mt-2 line-clamp-2 text-sm font-bold leading-6 text-ink">
                          {item.title}
                        </h3>
                        <p className="mt-1 text-xs text-stone-500">{item.publishLabel ?? "Watch next"}</p>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-[30px] border border-brand-100 bg-white/96 p-4 shadow-soft sm:p-5">
              <SectionHeader
                eyebrow="Discovery"
                title="Where this video fits"
                description="A quick way to jump deeper into the same conversation lanes around football, culture, and Habesha discovery."
              />
              <div className="mt-4 space-y-3 text-sm text-stone-600">
                <div className="flex items-start gap-3 rounded-[22px] bg-brand-50/70 px-4 py-3">
                  <Film className="mt-0.5 h-4 w-4 text-brand-700" />
                  <p>Curated videos stay lightweight now, but the same shape is ready for a future CMS or admin dashboard.</p>
                </div>
                <div className="flex items-start gap-3 rounded-[22px] bg-orange-50/80 px-4 py-3">
                  <Hash className="mt-0.5 h-4 w-4 text-orange-700" />
                  <p>Hashtags connect each clip to topic pages and existing post conversations without adding a separate video backend.</p>
                </div>
                <div className="flex items-start gap-3 rounded-[22px] bg-brand-100/50 px-4 py-3">
                  <Sparkles className="mt-0.5 h-4 w-4 text-brand-700" />
                  <p>Team-tagged clips can route straight into football hubs, so video, fan talk, and matchday energy live in one system.</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
