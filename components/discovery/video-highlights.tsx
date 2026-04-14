"use client";

import Link from "next/link";
import { Film, Play } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { cn } from "@/lib/utils";
import { getTeamSlug } from "@/services/football-hub-data";
import { getCuratedVideoHighlights, getCuratedVideoHighlightsByTeam } from "@/services/video-highlights-data";
import { CuratedVideoCategory, FootballTeam } from "@/types";

const categoryStyles: Record<CuratedVideoCategory, string> = {
  "Football Moments": "bg-red-50 text-red-700 border-red-100",
  "Fan Reactions": "bg-orange-50 text-orange-700 border-orange-100",
  Culture: "bg-brand-50 text-brand-700 border-brand-100",
  Music: "bg-amber-50 text-amber-700 border-amber-100"
};

const teamChipStyles: Record<FootballTeam, string> = {
  "Manchester United": "bg-red-50 text-red-700 border-red-100",
  Arsenal: "bg-rose-50 text-rose-700 border-rose-100",
  Chelsea: "bg-blue-50 text-blue-700 border-blue-100",
  "Manchester City": "bg-sky-50 text-sky-700 border-sky-100"
};

type VideoHighlightsProps = {
  compact?: boolean;
  team?: FootballTeam;
  limit?: number;
};

export function VideoHighlights({ compact = false, team, limit }: VideoHighlightsProps) {
  const base = team ? getCuratedVideoHighlightsByTeam(team) : getCuratedVideoHighlights();
  const videos = typeof limit === "number" ? base.slice(0, limit) : base;
  const featuredVideo = videos.find((item) => item.featured) ?? videos[0] ?? null;
  const supportingVideos = featuredVideo ? videos.filter((item) => item.id !== featuredVideo.id) : videos;

  if (!videos.length) {
    return null;
  }

  return (
    <section
      className={cn(
        "rounded-[30px] border border-brand-100 bg-white/96 p-4 shadow-soft sm:p-5",
        compact && "rounded-[28px] p-4"
      )}
    >
      <SectionHeader
        eyebrow="Video Highlights"
        title={team ? `${team} clips worth replaying` : "Curated clips lighting up the timeline"}
        description={
          team
            ? "Admin-picked match moments, fan reactions, and watch-again clips for this fan zone."
            : "A premium mix of football moments, fan reactions, and Habesha culture clips without the cost of full user video uploads."
        }
        action={
          !compact ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
              <Film className="h-3.5 w-3.5" />
              Admin picks
            </span>
          ) : undefined
        }
      />

      {compact ? (
        <div className="mt-4 space-y-3">
          {videos.slice(0, limit ?? 3).map((video) => (
            <Link
              key={video.id}
              href={`/videos/${video.id}`}
              className="group flex w-full items-start gap-3 rounded-[24px] border border-brand-100 bg-brand-50/40 p-3 text-left transition hover:-translate-y-0.5 hover:border-brand-200 hover:bg-white"
            >
              <div className="relative h-20 w-28 overflow-hidden rounded-[18px] bg-brand-100">
                <img
                  src={video.thumbnailURL}
                  alt={video.title}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                <div className="absolute inset-x-2 bottom-2 flex items-center justify-between text-[11px] font-semibold text-white">
                  <span>{video.duration}</span>
                  <Play className="h-3.5 w-3.5 fill-white" />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]">
                  <span className={cn("rounded-full border px-2 py-1", categoryStyles[video.category])}>
                    {video.category}
                  </span>
                  <span className="text-stone-500">{video.source}</span>
                </div>
                <h3 className="mt-2 line-clamp-2 text-sm font-bold leading-6 text-ink">{video.title}</h3>
                <p className="mt-1 text-xs text-stone-500">{video.publishLabel ?? "Watch now"}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          {featuredVideo ? (
            <article className="overflow-hidden rounded-[28px] border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-orange-50 shadow-soft">
              <Link href={`/videos/${featuredVideo.id}`} className="group block w-full text-left">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src={featuredVideo.thumbnailURL}
                    alt={featuredVideo.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                    <span
                      className={cn(
                        "rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
                        categoryStyles[featuredVideo.category]
                      )}
                    >
                      {featuredVideo.category}
                    </span>
                    {featuredVideo.featured ? (
                      <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink">
                        Featured
                      </span>
                    ) : null}
                  </div>
                  <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/75">
                        {featuredVideo.source}
                      </p>
                      <h3 className="mt-2 max-w-xl text-2xl font-black tracking-tight text-white">
                        {featuredVideo.title}
                      </h3>
                    </div>
                    <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/92 text-brand-700 shadow-lg transition group-hover:scale-105">
                      <Play className="ml-1 h-5 w-5 fill-current" />
                    </span>
                  </div>
                </div>
              </Link>
              <div className="space-y-4 p-5">
                <p className="text-sm leading-6 text-stone-600">{featuredVideo.summary}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-stone-500">
                  <span className="rounded-full bg-white px-3 py-1.5 shadow-sm">{featuredVideo.duration}</span>
                  <span className="rounded-full bg-white px-3 py-1.5 shadow-sm">
                    {featuredVideo.publishLabel ?? "Fresh pick"}
                  </span>
                  {featuredVideo.teamTag ? (
                    <Link
                      href={`/football/${getTeamSlug(featuredVideo.teamTag)}`}
                      className={cn(
                        "rounded-full border px-3 py-1.5 font-semibold transition hover:-translate-y-0.5",
                        teamChipStyles[featuredVideo.teamTag]
                      )}
                    >
                      {featuredVideo.teamTag}
                    </Link>
                  ) : null}
                </div>
                {featuredVideo.hashtags?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {featuredVideo.hashtags.slice(0, 4).map((tag) => (
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
            </article>
          ) : null}

          <div className="space-y-3">
            {supportingVideos.slice(0, compact ? 3 : 4).map((video) => (
              <article
                key={video.id}
                className="group rounded-[26px] border border-brand-100 bg-white p-3 shadow-soft transition hover:-translate-y-0.5 hover:border-brand-200"
              >
                <div className="flex gap-3">
                  <Link
                    href={`/videos/${video.id}`}
                    className="relative h-24 w-36 shrink-0 overflow-hidden rounded-[20px] bg-brand-100 text-left"
                  >
                    <img
                      src={video.thumbnailURL}
                      alt={video.title}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-transparent" />
                    <div className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur">
                      <Play className="h-3 w-3 fill-current" />
                      {video.duration}
                    </div>
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]">
                      <span className={cn("rounded-full border px-2 py-1", categoryStyles[video.category])}>
                        {video.category}
                      </span>
                      <span className="text-stone-500">{video.source}</span>
                    </div>
                    <Link href={`/videos/${video.id}`} className="block">
                      <h3 className="mt-2 line-clamp-2 text-base font-black tracking-tight text-ink">
                        {video.title}
                      </h3>
                    </Link>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-600">{video.summary}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-stone-500">
                      <span>{video.publishLabel ?? "Watch now"}</span>
                      {video.teamTag ? (
                        <Link
                          href={`/football/${getTeamSlug(video.teamTag)}`}
                          className={cn(
                            "rounded-full border px-2.5 py-1 font-semibold transition hover:-translate-y-0.5",
                            teamChipStyles[video.teamTag]
                          )}
                        >
                          {video.teamTag}
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
