"use client";

import { useEffect, useState } from "react";
import { Globe2, MapPinned, Sparkles, UsersRound } from "lucide-react";
import { NewsCard } from "@/components/discovery/news-card";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { getWorldNewsDigest, type WorldNewsDigestPayload } from "@/services/ai-digest-client-service";
import { getWorldNewsFeed } from "@/services/world-news-client-service";
import type { WorldNewsFeedPayload } from "@/services/world-news-service";
import type { LocalNewsItem, WorldNewsItem } from "@/types";

function toCardItem(item: WorldNewsItem, aiSummary?: string): LocalNewsItem {
  return {
    id: item.id,
    headline: item.headline,
    source: `${item.source} · ${item.publishLabel}`,
    summary: aiSummary ? `✨ ${aiSummary}` : item.summary,
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
  emptyLabel,
  aiSummaries
}: {
  eyebrow: string;
  title: string;
  description: string;
  items: WorldNewsItem[];
  emptyLabel: string;
  aiSummaries?: Record<string, string>;
}) {
  return (
    <section className="surface-panel p-4 sm:p-5">
      <SectionHeader eyebrow={eyebrow} title={title} description={description} />
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {items.length ? (
          items.map((item) => <NewsCard key={item.id} item={toCardItem(item, aiSummaries?.[item.id])} compact />)
        ) : (
          <EmptyState title={emptyLabel} description="Fresh coverage will appear here once this lane updates." />
        )}
      </div>
    </section>
  );
}

export function WorldNewsPage() {
  const [payload, setPayload] = useState<WorldNewsFeedPayload | null>(null);
  const [digest, setDigest] = useState<WorldNewsDigestPayload | null>(null);
  const [isDigestLoading, setIsDigestLoading] = useState(true);
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

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        const nextDigest = await getWorldNewsDigest();
        if (isMounted) {
          setDigest(nextDigest);
        }
      } catch {
        // The digest is an enhancement — the page works fine without it.
      } finally {
        if (isMounted) {
          setIsDigestLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const aiSummaries = digest?.storySummaries;
  const topStories = payload?.topStories ?? [];
  const ethiopiaStories = payload?.ethiopia ?? [];
  const eastAfricaStories = payload?.eastafrica ?? [];
  const diasporaStories = payload?.diaspora ?? [];

  return (
    <AppShell>
      <div className="page-stack">
        <section className="page-hero border-b border-brand-100/80 bg-card/96 sm:border">
          <div className="bg-gradient-to-br from-brand-500 via-orange-400 to-orange-600 px-4 py-5 sm:px-6 sm:py-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-950/70">
                  World News
                </p>
                <h1 className="page-title mt-1 text-brand-950">
                  World News
                </h1>
                <p className="mt-3 text-sm leading-6 text-brand-950/80 sm:text-[15px]">
                  Fast, Ethiopia-centered coverage with dedicated lanes for East Africa, the Horn, and Habesha diaspora communities.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:min-w-[17rem]">
                <div className="rounded-[24px] bg-card/70 px-4 py-3 backdrop-blur">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
                    Top stories
                  </p>
                  <p className="mt-2 text-xl font-black text-ink">{topStories.length}</p>
                </div>
                <div className="rounded-[24px] bg-card/70 px-4 py-3 backdrop-blur">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
                    Lanes
                  </p>
                  <p className="mt-2 text-xl font-black text-ink">3</p>
                </div>
                <div className="col-span-2 rounded-[24px] bg-card/70 px-4 py-3 backdrop-blur">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
                    Source strategy
                  </p>
                  <p className="mt-2 text-sm font-semibold text-ink">
                    Direct publisher RSS plus fast, free Ethiopia and East Africa search feeds.
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

        <section className="card-lux relative overflow-hidden p-4 sm:p-5">
          <div className="pointer-events-none absolute inset-0 bg-gold-radial opacity-60" />
          <div className="relative">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-orange-500 text-brand-950 shadow-glow-sm">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">
                    AI Daily Digest
                  </p>
                  <p className="text-xs text-stone-500">East Africa in 60 seconds</p>
                </div>
              </div>
              {digest?.generatedAt ? (
                <span className="rounded-full border border-brand-500/20 bg-brand-50 px-3 py-1 text-[11px] font-semibold text-brand-700">
                  {digest.storyCount} stories · refreshed every few hours
                </span>
              ) : null}
            </div>

            {isDigestLoading ? (
              <div className="mt-4 space-y-2.5">
                <div className="skeleton-dark h-6 w-2/3 rounded-full" />
                <div className="skeleton-dark h-4 w-full rounded-full" />
                <div className="skeleton-dark h-4 w-5/6 rounded-full" />
                <div className="skeleton-dark h-4 w-4/6 rounded-full" />
              </div>
            ) : digest?.headline && digest.paragraphs?.length ? (
              <div className="mt-4">
                <h2 className="font-display text-xl font-bold tracking-tight text-gold sm:text-2xl">
                  {digest.headline}
                </h2>
                <div className="mt-3 space-y-3">
                  {digest.paragraphs.map((paragraph, index) => (
                    <p key={index} className="text-sm leading-7 text-stone-600 sm:text-[15px]">
                      {paragraph}
                    </p>
                  ))}
                </div>
                <p className="mt-4 text-[11px] text-stone-400">
                  Generated by AI from the live news lanes below — always check the original reporting for details.
                  {digest.stale ? " Showing the most recent digest while a fresh one is prepared." : ""}
                </p>
              </div>
            ) : (
              <p className="mt-4 rounded-[20px] border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-sm leading-6 text-stone-500">
                {digest?.message ??
                  "The AI digest will appear here once fresh stories are available."}
              </p>
            )}
          </div>
        </section>

        <section className="surface-panel p-4 sm:p-5">
          <SectionHeader
            eyebrow="Top stories"
            title="The freshest headlines from Ethiopia and the Horn"
            description="Top stories pull from Ethiopia, East Africa, and diaspora lanes, then remove repeats and older coverage before surfacing the freshest relevant headlines."
          />

          {isLoading ? (
            <div className="mt-4 rounded-[24px] border border-brand-100/80 bg-brand-50/35 px-4 py-5 text-sm text-stone-500">
              Loading World News...
            </div>
          ) : topStories.length ? (
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {topStories.map((item, index) => (
                <div key={item.id} className={index === 0 ? "lg:col-span-2" : ""}>
                  <NewsCard item={toCardItem(item, aiSummaries?.[item.id])} compact={index !== 0} />
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
                <MapPinned className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Ethiopia
                </p>
                <p className="mt-1 text-sm text-stone-600">Local reporting and trusted coverage centered on Ethiopia.</p>
              </div>
            </div>
          </section>
          <section className="surface-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-700">
                <Globe2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                  East Africa
                </p>
                <p className="mt-1 text-sm text-stone-600">The Horn and neighboring countries stay visible in one regional lane.</p>
              </div>
            </div>
          </section>
          <section className="surface-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-100 text-brand-900">
                <UsersRound className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Diaspora
                </p>
                <p className="mt-1 text-sm text-stone-600">Community, immigration, and remittance stories for Habesha readers abroad.</p>
              </div>
            </div>
          </section>
        </div>

        <WorldNewsLane
          eyebrow="Ethiopia"
          title="Ethiopia"
          description="Ethiopia-focused reporting stays in its own lane, using direct local and international publisher feeds."
          items={ethiopiaStories}
          aiSummaries={aiSummaries}
          emptyLabel="No Ethiopia stories right now"
        />
        <WorldNewsLane
          eyebrow="East Africa"
          title="East Africa & the Horn"
          description="Regional coverage from Kenya, Somalia, Eritrea, Sudan, Uganda, Tanzania, Rwanda, Djibouti, and their neighbors."
          items={eastAfricaStories}
          aiSummaries={aiSummaries}
          emptyLabel="No fresh East Africa stories right now"
        />
        <WorldNewsLane
          eyebrow="Diaspora"
          title="Diaspora & Immigration"
          description="Habesha community stories and official immigration coverage that affect families living across borders."
          items={diasporaStories}
          aiSummaries={aiSummaries}
          emptyLabel="No fresh diaspora stories right now"
        />

        <section className="surface-card bg-brand-50/40 px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-card text-brand-800 shadow-sm">
              <Globe2 className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-800">
                Source notes
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                This page uses free, keyless RSS sources from publishers and Google News search lanes. Stories older than 30 days are removed, overlaps are deduplicated, and every result must match its Ethiopia, East Africa, or diaspora lane.
              </p>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
