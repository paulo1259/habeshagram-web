"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, RefreshCw, Sparkles } from "lucide-react";
import { SaveStoryButton } from "@/components/library/library-buttons";
import { ListenToBrief } from "@/components/world-news/listen-to-brief";
import { AppShell } from "@/components/layout/app-shell";
import { logEvent } from "@/lib/analytics-events";
import { useLanguage } from "@/hooks/use-language";
import type { MessageKey } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";
import { getWorldNewsDigest, type WorldNewsDigestPayload } from "@/services/ai-digest-client-service";
import { getWorldNewsFeed } from "@/services/world-news-client-service";
import type { WorldNewsFeedPayload } from "@/services/world-news-service";
import type { WorldNewsItem } from "@/types";

import { filterStories, uniqueStories, publishedTime } from "@/lib/news/reader";

type LaneKey = "top" | "ethiopia" | "eastafrica" | "diaspora";

const LANES: LaneKey[] = ["top", "ethiopia", "eastafrica", "diaspora"];

export const LANE_BY_SECTION: Record<string, { labelKey: MessageKey; tone: string }> = {
  ethiopia: { labelKey: "news.lane.ethiopia", tone: "#45e0c8" },
  eastafrica: { labelKey: "news.lane.eastafrica", tone: "#7c6cf6" },
  diaspora: { labelKey: "news.lane.diaspora", tone: "#f0a868" },
  top: { labelKey: "news.laneTag.top", tone: "#45e0c8" }
};

function openStory(item: WorldNewsItem, surface: string) {
  logEvent("story_opened", null, {
    surface,
    category: item.category,
    source: item.source
  });
}

function WhyItMatters({ text }: { text?: string }) {
  const { t } = useLanguage();
  if (!text) return null;

  return (
    <p className="mt-3 flex gap-2 border-t border-white/[0.06] pt-3 text-[12.5px] leading-5 text-stone-500">
      <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-700" aria-hidden="true" />
      <span>
        <span className="block font-semibold text-orange-700">{t("news.whyItMatters")} <span className="font-normal">(AI)</span></span>
        {text}
      </span>
    </p>
  );
}

function LeadStory({ item, why }: { item: WorldNewsItem; why?: string }) {
  const { t, lang } = useLanguage();
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
              {t(lane.labelKey)}
            </span>
          )}
        </div>
  
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5 sm:pr-10">
            <span
              className="rounded-md px-2 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.12em]"
              style={{ color: lane.tone, background: `${lane.tone}22` }}
            >
              {t(lane.labelKey)}
            </span>
            <span className="font-mono text-[11px] text-stone-400">
              {item.source} · <time dateTime={item.publishedAt}>{publishedTime(item.publishedAt, lang)}</time>
            </span>
          </div>
          <h3 className="mt-3 font-display text-[1.35rem] font-semibold leading-[1.25] tracking-[-0.02em] text-ink transition group-hover:text-brand-700 sm:text-[1.5rem]">
            {item.headline}
          </h3>
          <p className="mt-4 text-[11px] font-medium uppercase tracking-wide text-stone-400">{lang === "am" ? "ከዜና ምንጩ" : "From the publisher’s feed"}</p><p className="mt-1.5 text-sm leading-6 text-stone-500">{item.summary}</p>
          <WhyItMatters text={why} />
        </div>
      </a>
      <SaveStoryButton item={item} className="absolute right-3 top-3 bg-surface/70 backdrop-blur" />
    </div>
  );
}

function StoryCard({ item, why, surface }: { item: WorldNewsItem; why?: string; surface: string }) {
  const { t, lang } = useLanguage();
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
            {t(lane.labelKey)}
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
        <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-stone-400">{lang === "am" ? "ከዜና ምንጩ" : "From the publisher’s feed"}</p>
        <p className="mt-1.5 text-sm leading-6 text-stone-500">{item.summary || (lang === "am" ? "ሙሉ ዘገባውን ያንብቡ።" : "Open the original report for details.")}</p>
        <time dateTime={item.publishedAt} className="mt-3 block text-xs leading-5 text-stone-400">{publishedTime(item.publishedAt, lang)}</time>
        <WhyItMatters text={why} />
      </a>
      <SaveStoryButton item={item} className="absolute right-2 top-2" />
    </div>
  );
}

function Brief({ digest, loading, headlines }: { digest: WorldNewsDigestPayload | null; loading: boolean; headlines: WorldNewsItem[] }) {
  const { t, lang } = useLanguage();
  const hasBrief = Boolean(digest?.headline && digest.paragraphs?.length);

  return (
    <section className="relative overflow-hidden rounded-[24px] border border-orange-500/30 bg-gradient-to-br from-orange-500/[0.16] to-orange-500/[0.03] p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-orange-700" aria-hidden="true" />
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-orange-800">{t("news.brief")}</span>
        </span>
        {hasBrief ? (
          <span className="font-mono text-[11px] text-stone-400">{t("news.storyCount", { n: digest?.storyCount ?? 0 })}</span>
        ) : null}
      </div>

      {loading ? (
        <div className="mt-5 space-y-2.5" aria-busy="true" aria-label={t("news.briefLoading")}>
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
          {digest?.audioUrl ? <ListenToBrief audioUrl={digest.audioUrl} className="mt-4" /> : null}
          <div className="mt-3.5 space-y-3">
            {digest?.paragraphs?.map((paragraph, index) => (
              <p key={index} className="text-[14.5px] leading-7 text-stone-600">
                {paragraph}
              </p>
            ))}
          </div>
          {digest?.generatedAt ? <p className="mt-4 text-xs text-stone-400">{lang === "am" ? "የተዘጋጀበት ጊዜ" : "Brief generated"}: {publishedTime(digest.generatedAt, lang)}</p> : null}
          <p className="mt-5 border-t border-white/[0.09] pt-4 text-[11.5px] leading-5 text-stone-400">
            {t("news.briefDisclaimer")}
            {digest?.stale ? t("news.briefStale") : ""}
          </p>
        </>
      ) : (
        <div className="mt-4">
          <h2 className="font-display text-xl font-semibold">{lang === "am" ? "ዋና ዋና ዜናዎች" : "Headlines at a glance"}</h2>
          <p className="mt-2 text-xs leading-5 text-stone-400">{lang === "am" ? "የAI አጭር ዜና አሁን አይገኝም። ዋናዎቹን ዘገባዎች ከታች ያንብቡ።" : "The AI brief is unavailable right now. Start with the original reporting below."}</p>
          <ol className="mt-4 divide-y divide-white/10">{headlines.slice(0,3).map((item,index) => <li key={item.id} className="flex gap-3 py-3"><span className="font-mono text-brand-600">0{index+1}</span><a href={item.link} target="_blank" rel="noopener noreferrer" className="text-sm font-medium leading-6 hover:text-brand-600">{item.headline}<span className="mt-1 block text-xs text-stone-400">{item.source}</span></a></li>)}</ol>
          {!headlines.length ? <p className="mt-3 text-sm text-stone-400">{t("news.empty")}</p> : null}
        </div>
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
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [lane, setLane] = useState<LaneKey>("top");
  const { t, lang } = useLanguage();

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");
        const nextPayload = await getWorldNewsFeed(refresh > 0);
        if (isMounted) setPayload(nextPayload);
      } catch (error) {
        if (isMounted) {
          setErrorMessage(t("news.loadError"));
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [refresh]);

  useEffect(() => {
    let isMounted = true;
    setIsDigestLoading(true);
    setDigest(null);

    void (async () => {
      try {
        const nextDigest = await getWorldNewsDigest(lang);
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
  }, [lang]);

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

  const allStories = useMemo(() => uniqueStories(Object.values(laneItems).flat()), [laneItems]);
  const sources = [...new Set(laneItems[lane].map((item) => item.source))].sort();
  const items = filterStories(laneItems[lane], query, source);
  const [lead, ...rest] = items;

  return (
    <AppShell>
      <div className="space-y-5 px-4 pt-4 sm:px-0 sm:pt-0">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-[2.2rem] font-bold leading-none tracking-[-0.03em] text-ink">{t("news.title")}</h1>
            <p className="mt-2 text-sm text-stone-500">{t("news.subtitle")}</p>
          </div>

          <div role="group" aria-label={t("news.lanesLabel")} className="flex flex-wrap gap-2">
            {LANES.map((item) => {
              const active = item === lane;
              return (
                <button
                  key={item}
                  type="button"
                  aria-pressed={active}
                  onClick={() => { setLane(item); setSource(""); }}
                  className={cn(
                    "min-h-9 rounded-full px-4 text-[13px] font-semibold transition",
                    active ? "bg-brand-500 text-brand-950" : "text-stone-500 ring-1 ring-white/[0.11] hover:text-ink"
                  )}
                >
                  {t(`news.lane.${item}`)}
                  {!isLoading ? (
                    <span className={cn("ml-1.5 font-mono text-[11px]", active ? "text-brand-950/60" : "text-stone-400")}>
                      {laneItems[item].length}
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

        <Brief digest={digest} loading={isDigestLoading} headlines={laneItems.top} />

        <section aria-label={lang === "am" ? "ዜና ፈልግ" : "Find reporting"} className="rounded-[24px] border border-white/10 bg-card/90 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium">{lang === "am" ? "ዜና ፈልግ" : "Search this section"}<input type="search" value={query} onChange={(e)=>setQuery(e.target.value)} placeholder={lang === "am" ? "ርዕስ፣ ርዕሰ ጉዳይ ወይም ምንጭ" : "Headline, topic or publisher"} className="mt-2 block min-h-12 w-full rounded-xl border border-white/20 bg-surface px-3" /></label>
            <label className="text-sm font-medium">{lang === "am" ? "የዜና ምንጭ" : "Publisher"}<select value={source} onChange={(e)=>setSource(e.target.value)} className="mt-2 block min-h-12 w-full rounded-xl border border-white/20 bg-surface px-3"><option value="">{lang === "am" ? "ሁሉም ምንጮች" : "All publishers"}</option>{sources.map((name)=><option key={name}>{name}</option>)}</select></label>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-400">
            <p role="status">{payload ? <>{payload.stale ? (lang === "am" ? "የተቀመጠ ዜና" : "Showing saved coverage") : (lang === "am" ? "የመጨረሻ ዝማኔ" : "Feed updated")}: {publishedTime(payload.fetchedAt, lang)}</> : null}</p>
            <button type="button" disabled={isLoading} onClick={()=>setRefresh(value=>value+1)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 px-3 disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} aria-hidden="true" />{lang === "am" ? "አድስ" : "Refresh news"}</button>
          </div>
          {(query || source) ? <button type="button" onClick={()=>{setQuery("");setSource("");}} className="mt-2 min-h-11 text-sm text-brand-600">{lang === "am" ? "ማጣሪያዎችን አጽዳ" : "Clear filters"}</button> : null}
        </section>

        <section aria-live="polite">
          <p className="mb-3 text-[13px] text-stone-400">{t(`news.blurb.${lane}`)}</p>

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
              {allStories.filter(item => item.id !== lead.id && item.section === lead.section && item.source !== lead.source).length ? <details className="rounded-2xl border border-white/10 bg-card/70 p-4"><summary className="cursor-pointer text-sm font-semibold text-brand-600">{lang === "am" ? "በዚህ ዘርፍ ከሌሎች ምንጮች" : "More in this section, from other publishers"}</summary><ul className="mt-3 space-y-3">{allStories.filter(item => item.id !== lead.id && item.section === lead.section && item.source !== lead.source).slice(0,3).map(item=><li key={item.id}><a href={item.link} target="_blank" rel="noopener noreferrer" className="text-sm leading-6 hover:text-brand-600">{item.headline}<span className="block text-xs text-stone-400">{item.source}</span></a></li>)}</ul></details> : null}
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
              {query || source ? (lang === "am" ? "ከፍለጋዎ ጋር የሚዛመድ ዜና አልተገኘም።" : "No stories match these filters. Try another search or publisher.") : t("news.empty")}
            </p>
          )}
        </section>

        <p className="pb-2 text-[12px] leading-6 text-stone-400">
          {t("news.footnote")}
        </p>
      </div>
    </AppShell>
  );
}
