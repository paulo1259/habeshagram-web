"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Clock3, ExternalLink, PlayCircle, Volume2, VolumeX } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { ShareActions } from "@/components/ui/share-actions";
import { getTeamSlug } from "@/services/football-hub-data";
import {
  getCuratedShortById,
  getCuratedShorts
} from "@/services/curated-shorts-service";
import { CuratedShortItem } from "@/types";

function buildShortDetailEmbedUrl(embedUrl: string, muted: boolean) {
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

export function ShortDetailPageClient({ shortId }: { shortId: string }) {
  const [short, setShort] = useState<CuratedShortItem | null>(null);
  const [relatedShorts, setRelatedShorts] = useState<CuratedShortItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      setIsLoading(true);
      const nextShort = await getCuratedShortById(shortId);
      if (!isMounted) {
        return;
      }

      setShort(nextShort);

      const allShorts = await getCuratedShorts();
      if (!isMounted) {
        return;
      }

      setRelatedShorts(allShorts.filter((item) => item.id !== shortId).slice(0, 4));
      setIsLoading(false);
    })();

    return () => {
      isMounted = false;
    };
  }, [shortId]);

  const publishedLabel = useMemo(() => {
    if (!short) {
      return "";
    }

    return short.publishLabel ?? new Date(short.createdAt).toLocaleDateString();
  }, [short]);

  if (!isLoading && !short) {
    return (
      <AppShell>
        <EmptyState
          title="This short could not be found"
          description="The short may have been removed from the curated shorts collection, or it has not been published yet."
        />
      </AppShell>
    );
  }

  if (!short) {
    return (
      <AppShell>
        <div className="rounded-[28px] border border-brand-100 bg-white/96 p-6 text-sm text-stone-500 shadow-soft">
          Loading short...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="page-stack">
        <section className="overflow-hidden border-b border-brand-100/80 bg-white/96 sm:rounded-[32px] sm:border sm:shadow-soft">
          <div className="bg-gradient-to-br from-stone-950 via-stone-900 to-brand-950 px-4 py-5 text-white sm:px-6 sm:py-6">
            <Link
              href="/shorts"
              className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/95 transition hover:bg-white/18"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to shorts
            </Link>

            <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
                  Curated Short
                </p>
                <h1 className="mt-2 text-[1.9rem] font-black tracking-tight sm:text-[2.5rem]">
                  {short.title}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/88 sm:text-[15px]">
                  {short.summary}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-white/12 px-4 py-2 text-sm font-semibold backdrop-blur">
                  {short.category}
                </span>
                <button
                  type="button"
                  onClick={() => setIsMuted((current) => !current)}
                  className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/16 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/16"
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  {isMuted ? "Muted" : "Sound on"}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4 px-4 py-4 sm:px-6 sm:py-5">
            <div className="overflow-hidden rounded-[28px] border border-brand-100 bg-stone-950 shadow-soft">
              <div className="mx-auto aspect-[9/16] w-full max-w-[28rem] bg-black">
                <iframe
                  src={buildShortDetailEmbedUrl(short.embedUrl, isMuted)}
                  title={short.title}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded-full bg-brand-50 px-3 py-1.5 font-semibold text-brand-800">
                {short.source}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-3 py-1.5 text-stone-600">
                <Clock3 className="h-3.5 w-3.5" />
                {publishedLabel}
              </span>
              <span className="rounded-full bg-stone-100 px-3 py-1.5 font-medium text-stone-700">
                {short.duration}
              </span>
              {short.teamTag ? (
                <Link
                  href={`/football/${getTeamSlug(short.teamTag)}`}
                  className="rounded-full bg-white px-3 py-1.5 font-semibold text-brand-800 shadow-sm transition hover:-translate-y-0.5"
                >
                  {short.teamTag}
                </Link>
              ) : null}
            </div>

            {short.hashtags?.length ? (
              <div className="flex flex-wrap gap-2">
                {short.hashtags.map((tag) => (
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

            <ShareActions path={`/shorts/${short.id}`} title={short.title} text={short.summary} />
          </div>
        </section>

        <section className="rounded-[30px] border border-brand-100 bg-white/96 p-4 shadow-soft sm:p-5">
          <SectionHeader
            eyebrow="More Shorts"
            title="Keep scrolling"
            description="A few more admin-curated short-form clips from the dedicated shorts lane."
          />

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {relatedShorts.map((item) => (
              <Link
                key={item.id}
                href={`/shorts/${item.id}`}
                className="rounded-[24px] border border-brand-100 bg-brand-50/35 p-3 transition hover:-translate-y-0.5 hover:border-brand-200 hover:bg-white"
              >
                <div className="relative overflow-hidden rounded-[18px] bg-brand-100">
                  <div className="aspect-[9/16]">
                    <img
                      src={item.thumbnailURL}
                      alt={item.title}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur">
                    <PlayCircle className="h-3 w-3" />
                    {item.duration}
                  </div>
                </div>
                <h3 className="mt-3 line-clamp-2 text-sm font-bold leading-6 text-ink">{item.title}</h3>
                <div className="mt-2 flex items-center gap-2 text-xs text-stone-500">
                  <span>{item.category}</span>
                  <span>•</span>
                  <span>{item.publishLabel ?? "Short"}</span>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-4">
            <Link
              href="/shorts"
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-brand-100 bg-white px-4 py-2 text-sm font-semibold text-brand-800 transition hover:bg-brand-50"
            >
              Return to the feed
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
