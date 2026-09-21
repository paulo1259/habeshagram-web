"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { SaveStoryButton } from "@/components/library/library-buttons";
import { AppShell } from "@/components/layout/app-shell";
import { logEvent } from "@/lib/analytics-events";
import { cn } from "@/lib/utils";
import { getWorldNewsDigest, type WorldNewsDigestPayload } from "@/services/ai-digest-client-service";
import { getWorldNewsFeed } from "@/services/world-news-client-service";
import type { WorldNewsFeedPayload } from "@/services/world-news-service";
import type { WorldNewsItem } from "@/types";

type LaneKey = "top" | "ethiopia" | "eastafrica" | "diaspora";

const LANES: Array<{ key: LaneKey; label: string; tone: string; blurb: string }> = [
  { key: "top", label: "Top", tone: "#45e0c8", blurb: "The freshest stories across every lane, deduplicated." },
  { key: "ethiopia", label: "Ethiopia", tone: "#45e0c8", blurb: "Local and international reporting centred on Ethiopia." },
  { key: "eastafrica", label: "East Africa", tone: "#7c6cf6", blurb: "Kenya, Somalia, Eritrea, Sudan, Uganda and the wider Horn." },
  { key: "diaspora", label: "Diaspora", tone: "#f0a868", blurb: "Community, immigration and remittance stories for readers abroad." }
];

const LANE_BY_SECTION: Record<string, { label: string; tone: string }> = {
  ethiopia: { label: "Ethiopia", tone: "#45e0c8" },
  eastafrica: { label: "East Africa", tone: "#7c6cf6" },
  diaspora: { label: "Diaspora", tone: "#f0a868" },
  top: { label: "Top story", tone: "#45e0c8" }
};

function openStory(item: WorldNewsItem, surface: string) {
  logEvent("story_opened", null, {
    surface,
    category: item.category,
    source: item.source
  });
}

function WhyItMatters({ text }: { text?: string }) {
  if (!text) return null;

  return (
    <p className="mt-3 flex gap-2 border-t border-white/[0.06] pt-3 text-[12.5px] leading-5 text-stone-500">
      <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-700" aria-hidden="true" />
      <span>
        <span className="sr-only">Why it matters: </span>
        {text}
      </span>
    </p>
  );
}

function LeadStory({ item, why }: { item: WorldNewsItem; why?: string }) {
  const lane = LANE_BY_SECTION[item.section] ?? LANE_BY_SECTION.top;

  return (
    <div className="relative">
      <a
        href={item.link}
        target="_blank"
        rel="noreferrer"
        onClick={() => openStory(item, "news_lead")}
        className="group grid gap-5 rounded-[24px] border border-white/[0.09] bg-white/[0.03] p-5 transition hover:border-white/[0.16] sm:grid-cols-[200px_minmax(0,1fr)] sm:p-6"
      >
        <div className="relative aspect-[16/10] overflow-hidden rounded-[16px] border border-white/[0.08] bg-gradient-to-br from-brand-500/[0.18] to-orange-500/[0.2] sm:aspect-auto sm:h-full sm:min-h-[140px]">
          {item.imageURL ? (
            // RSS images come from arbitrary hosts, so a plain img avoids having
            // to allowlist every publisher domain for next/image.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.imageURL} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] uppercase tracking-[0.14em] text-stone-500">
              {lane.label}
            </span>
          )}
        </div>
  
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5 sm:pr-10">
            <span
              className="rounded-md px-2 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.12em]"
              style={{ color: lane.tone, background: `${lane.tone}22` }}
            >
              {lane.label}
            </span>
            <span className="font-mono text-[11px] text-stone-400">
              {item.source} · {item.publishLabel}
            </span>
          </div>
          <h3 className="mt-3 font-display text-[1.35rem] font-semibold leading-[1.25] tracking-[-0.02em] text-ink transition group-hover:text-brand-700 sm:text-[1.5rem]">
            {item.headline}
          </h3>
          <p className="mt-2.5 text-sm leading-6 text-stone-500">{item.summary}</p>
          <WhyItMatters text={why} />
        </div>
      </a>
      <SaveStoryButton item={item} className="absolute right-3 top-3 bg-surface/70 backdrop-blur" />
    </div>
  );
}

function StoryCard({ item, why, surface }: { item: WorldNewsItem; why?: string; surface: string }) {
  const lane = LANE_BY_SECTION[item.section] ?? LANE_BY_SECTION.top;

  return (
    <div className="relative flex">
      <a
        href={item.link}
        target="_blank"
        rel="noreferrer"
        onClick={() => openStory(item, surface)}
        className="group flex w-full flex-col rounded-[20px] border border-white/[0.07] bg-white/[0.022] p-5 transition hover:-translate-y-0.5 hover:border-white/[0.14]"
      >
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: lane.tone }} />
          <span
            className="font-mono text-[10px] font-medium uppercase tracking-[0.12em]"
            style={{ color: lane.tone }}
          >
            {lane.label}
          </span>
          <span className="ml-auto mr-8 font-mono text-[11px] text-stone-400">{item.publishLabel}</span>
        </div>
        <h3 className="mt-3 text-[15.5px] font-semibold leading-[1.4] text-ink transition group-hover:text-brand-700">
          {item.headline}
        </h3>
        <p className="mt-2 flex items-center gap-1.5 text-[12px] text-stone-400">
          {item.source}
          <ArrowUpRight className="h-3 w-3 opacity-0 transition group-hover:opacity-100" aria-hidden="true" />
        </p>
        <WhyItMatters text={why} />
      </a>
      <SaveStoryButton item={item} className="absolute right-2 top-2" />
    </div>
  );
}

function Brief({ digest, loading }: { digest: WorldNewsDigestPayload | null; loading: boolean }) {
  const hasBrief = Boolean(digest?.headline && digest.paragraphs?.length);

  return (
    <section className="relative overflow-hidden rounded-[24px] border border-orange-500/30 bg-gradient-to-br from-orange-500/[0.16] to-orange-500/[0.03] p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-orange-700" aria-hidden="true" />
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-orange-800">The brief</span>
        </span>
        {hasBrief ? (
          <span className="font-mono text-[11px] text-stone-400">{digest?.storyCount} stories</span>
        ) : null}
      </div>

      {loading ? (
        <div className="mt-5 space-y-2.5" aria-busy="true" aria-label="Loading the brief">
          <div className="skeleton-dark h-6 w-3/4 rounded-full" />
          <div className="skeleton-dark h-4 w-full rounded-full" />
          <div className="skeleton-dark h-4 w-5/6 rounded-full" />
          <div className="skeleton-dark h-4 w-2/3 rounded-full" />
        </div>
      ) : hasBrief ? (
        <>
          <h2 className="mt-4 font-display text-[1.45rem] font-semibold leading-[1.22] tracking-[-0.02em] text-ink sm:text-[1.6rem]">
            {digest?.headline}
          </h2>
          <div className="mt-3.5 space-y-3">
            {digest?.paragraphs?.map((paragraph, index) => (
              <p key={index} className="text-[14.5px] leading-7 text-stone-600">
                {paragraph}
              </p>
            ))}
          </div>
          <p className="mt-5 border-t border-white/[0.09] pt-4 text-[11.5px] leading-5 text-stone-400">
            Written by AI from the stories below. Check the original reporting before relying on details.
            {digest?.stale ? " Showing the last brief while a fresh one is prepared." : ""}
          </p>
        </>
      ) : (
        <p className="mt-4 text-sm leading-6 text-stone-500">
          {digest?.message ?? "Today's brief will appear here once fresh stories are in."}
        </p>
      )}
    </section>
  );
}

export function WorldNewsPage() {
  const [payload, setPayload] = useState<WorldNewsFeedPayload | null>(null);
  const [digest, setDigest] = useState<WorldNewsDigestPayload | null>(null);
  const [isDigestLoading, setIsDigestLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [lane, setLane] = useState<LaneKey>("top");

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");
        const nextPayload = await getWorldNewsFeed();
        if (isMounted) setPayload(nextPayload);
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : "Unable to load the news right now.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
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
        if (!isMounted) return;
        setDigest(nextDigest);
        // Only count it as viewed when there was an actual brief to read.
        if (nextDigest?.headline && nextDigest.paragraphs?.length) {
          logEvent("brief_viewed", null, {
            story_count: nextDigest.storyCount ?? 0,
            provider: nextDigest.provider ?? null,
            stale: Boolean(nextDigest.stale)
          });
        }
      } catch {
        // The brief is an enhancement — the page works without it.
      } finally {
        if (isMounted) setIsDigestLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const why = digest?.storySummaries ?? {};

  const laneItems: Record<LaneKey, WorldNewsItem[]> = useMemo(
    () => ({
      top: payload?.topStories ?? [],
      ethiopia: payload?.ethiopia ?? [],
      eastafrica: payload?.eastafrica ?? [],
      diaspora: payload?.diaspora ?? []
    }),
    [payload]
  );

  const items = laneItems[lane];
  const [lead, ...rest] = items;
  const activeLane = LANES.find((item) => item.key === lane) ?? LANES[0];

  return (
    <AppShell>
      <div className="space-y-5 px-4 pt-4 sm:px-0 sm:pt-0">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-[2.2rem] font-bold leading-none tracking-[-0.03em] text-ink">News</h1>
            <p className="mt-2 text-sm text-stone-500">Four lanes, refreshed every 90 seconds from free wire feeds.</p>
          </div>

          <div role="tablist" aria-label="News lanes" className="flex flex-wrap gap-2">
            {LANES.map((item) => {
              const active = item.key === lane;
              return (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setLane(item.key)}
                  className={cn(
                    "min-h-9 rounded-full px-4 text-[13px] font-semibold transition",
                    active ? "bg-brand-500 text-brand-950" : "text-stone-500 ring-1 ring-white/[0.11] hover:text-ink"
                  )}
                >
                  {item.label}
                  {!isLoading ? (
                    <span className={cn("ml-1.5 font-mono text-[11px]", active ? "text-brand-950/60" : "text-stone-400")}>
                      {laneItems[item.key].length}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </header>

        {errorMessage ? (
          <p className="rounded-2xl border border-red-500/20 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p>
        ) : null}

        <Brief digest={digest} loading={isDigestLoading} />

        <section aria-live="polite">
          <p className="mb-3 text-[13px] text-stone-400">{activeLane.blurb}</p>

          {isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2" aria-busy="true">
              {[0, 1, 2, 3].map((index) => (
                <div key={index} className="h-36 rounded-[20px] border border-white/[0.06] bg-white/[0.02]">
                  <div className="skeleton-dark m-5 h-4 w-2/3 rounded-full" />
                </div>
              ))}
            </div>
          ) : lead ? (
            <div className="space-y-3">
              <LeadStory item={lead} why={why[lead.id]} />
              {rest.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {rest.map((item) => (
                    <StoryCard key={item.id} item={item} why={why[item.id]} surface={`news_${lane}`} />
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <p className="rounded-[20px] border border-white/[0.07] bg-white/[0.02] px-5 py-8 text-center text-sm text-stone-500">
              {payload?.message ?? "Nothing fresh in this lane right now. It refreshes every 90 seconds."}
            </p>
          )}
        </section>

        <p className="pb-2 text-[12px] leading-6 text-stone-400">
          Stories come from free, keyless publisher RSS and Google News search lanes. Anything older than 30 days
          is dropped, overlaps are removed, and every story has to match its lane.
        </p>
      </div>
    </AppShell>
  );
}
