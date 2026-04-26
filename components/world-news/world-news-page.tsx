"use client";

import { useEffect, useState } from "react";
import { Globe2, Landmark, MapPinned, ScrollText } from "lucide-react";
import { NewsCard } from "@/components/discovery/news-card";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { getWorldNewsFeed } from "@/services/world-news-client-service";
import type { WorldNewsFeedPayload } from "@/services/world-news-service";
import type { LocalNewsItem, WorldNewsItem } from "@/types";

function toCardItem(item: WorldNewsItem): LocalNewsItem {
  return {
    id: item.id,
    headline: item.headline,
    source: `${item.source} · ${item.publishLabel}`,
    summary: item.summary,
    category: item.category,
    imageURL: item.imageURL,
    link: item.link,
    createdAt: item.publishedAt,
    publishLabel: item.publishLabel
  };
}

function WorldNewsLane({
  eyebrow,
  title,
  description,
  items,
  emptyLabel
}: {
  eyebrow: string;
  title: string;
  description: string;
  items: WorldNewsItem[];
  emptyLabel: string;
}) {
  return (
    <section className="surface-panel p-4 sm:p-5">
      <SectionHeader eyebrow={eyebrow} title={title} description={description} />
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {items.length ? (
          items.map((item) => <NewsCard key={item.id} item={toCardItem(item)} compact />)
        ) : (
          <EmptyState title={emptyLabel} description="Fresh coverage will appear here once this lane updates." />
        )}
      </div>
    </section>
  );
}

export function WorldNewsPage() {
  const [payload, setPayload] = useState<WorldNewsFeedPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");
        const nextPayload = await getWorldNewsFeed();
        if (isMounted) {
          setPayload(nextPayload);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error ? error.message : "Unable to load World News right now."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const topStories = payload?.topStories ?? [];
  const usStories = payload?.us ?? [];
  const ethiopiaStories = payload?.ethiopia ?? [];
  const immigrationStories = payload?.immigration ?? [];

  return (
    <AppShell>
      <div className="page-stack">
        <section className="page-hero border-b border-brand-100/80 bg-white/96 sm:border">
          <div className="bg-gradient-to-br from-brand-500 via-orange-300 to-brand-200 px-4 py-5 sm:px-6 sm:py-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-900/70">
                  World News
                </p>
                <h1 className="page-title mt-1 text-ink">
                  World News
                </h1>
                <p className="mt-3 text-sm leading-6 text-stone-700 sm:text-[15px]">
                  A dedicated world-news lane for Ethiopian and diaspora readers, with distinct United States, Ethiopia, and immigration coverage instead of one noisy generic feed.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:min-w-[17rem]">
                <div className="rounded-[24px] bg-white/70 px-4 py-3 backdrop-blur">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
                    Top stories
                  </p>
                  <p className="mt-2 text-xl font-black text-ink">{topStories.length}</p>
                </div>
                <div className="rounded-[24px] bg-white/70 px-4 py-3 backdrop-blur">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
                    Lanes
                  </p>
                  <p className="mt-2 text-xl font-black text-ink">3</p>
                </div>
                <div className="col-span-2 rounded-[24px] bg-white/70 px-4 py-3 backdrop-blur">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
                    Source strategy
                  </p>
                  <p className="mt-2 text-sm font-semibold text-ink">
                    Trusted U.S. outlets, Ethiopia-focused reporting, and official immigration updates.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {payload?.message ? (
          <div className="rounded-[24px] border border-brand-100 bg-brand-50/50 px-4 py-3 text-sm text-brand-900">
            {payload.message}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-[24px] border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <section className="surface-panel p-4 sm:p-5">
          <SectionHeader
            eyebrow="Top stories"
            title="The most relevant headlines for Habesha diaspora readers"
            description="Top stories pull from the dedicated U.S., Ethiopia, and immigration lanes, then deduplicate overlapping coverage before surfacing the freshest items."
          />

          {isLoading ? (
            <div className="mt-4 rounded-[24px] border border-brand-100/80 bg-brand-50/35 px-4 py-5 text-sm text-stone-500">
              Loading World News...
            </div>
          ) : topStories.length ? (
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {topStories.map((item, index) => (
                <div key={item.id} className={index === 0 ? "lg:col-span-2" : ""}>
                  <NewsCard item={toCardItem(item)} compact={index !== 0} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No top stories yet"
              description="The world-news lanes are available, but the current source mix has not surfaced any fresh stories yet."
            />
          )}
        </section>

        <div className="grid gap-4 lg:grid-cols-3">
          <section className="surface-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-800">
                <Landmark className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                  United States
                </p>
                <p className="mt-1 text-sm text-stone-600">Trusted U.S. headlines that matter to diaspora readers.</p>
              </div>
            </div>
          </section>
          <section className="surface-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-700">
                <MapPinned className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Ethiopia
                </p>
                <p className="mt-1 text-sm text-stone-600">Dedicated Ethiopia reporting stays visible as its own lane.</p>
              </div>
            </div>
          </section>
          <section className="surface-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-100 text-brand-900">
                <ScrollText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Immigration
                </p>
                <p className="mt-1 text-sm text-stone-600">Official and high-trust immigration updates stay separate from general politics.</p>
              </div>
            </div>
          </section>
        </div>

        <WorldNewsLane
          eyebrow="United States"
          title="United States"
          description="A dedicated U.S. lane for diaspora readers who want the biggest American headlines without losing Ethiopia or immigration context."
          items={usStories}
          emptyLabel="No U.S. stories right now"
        />
        <WorldNewsLane
          eyebrow="Ethiopia"
          title="Ethiopia"
          description="Ethiopia-focused reporting stays in its own lane so it does not get buried under broader world or immigration coverage."
          items={ethiopiaStories}
          emptyLabel="No Ethiopia stories right now"
        />
        <WorldNewsLane
          eyebrow="Immigration"
          title="Immigration"
          description="Immigration updates stay clearly separated, prioritizing official and high-trust sources that matter to real family and paperwork decisions."
          items={immigrationStories}
          emptyLabel="No immigration updates right now"
        />

        <section className="surface-card bg-brand-50/40 px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-brand-800 shadow-sm">
              <Globe2 className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-800">
                Source notes
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                This page uses layered source lanes rather than one generic news dump. Stories are deduplicated, ranked by freshness and relevance, and grouped so U.S., Ethiopia, and immigration coverage stay distinct.
              </p>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
