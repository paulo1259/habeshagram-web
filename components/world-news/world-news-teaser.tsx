"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Headphones, Loader2, Pause, Sparkles } from "lucide-react";
import { SaveStoryButton } from "@/components/library/library-buttons";
import { LANE_BY_SECTION } from "@/components/world-news/world-news-page";
import { useBriefPlayer } from "@/hooks/use-brief-player";
import { useLanguage } from "@/hooks/use-language";
import { logEvent } from "@/lib/analytics-events";
import { getWorldNewsDigest } from "@/services/ai-digest-client-service";
import { getWorldNewsFeed } from "@/services/world-news-client-service";
import type { WorldNewsItem } from "@/types";

const HEADLINE_COUNT = 4;

/**
 * Listen straight from the home page. The brief is only fetched when someone
 * actually asks for it, so opening the home page never costs an AI call.
 */
function BriefListenButton() {
  const { state, src, play, pause } = useBriefPlayer();
  const { t, lang } = useLanguage();
  const [fetching, setFetching] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const mine = Boolean(src?.includes("/api/world-news/digest/audio"));
  const playing = mine && state === "playing";
  const busy = fetching || (mine && state === "loading");

  if (unavailable) return null;

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        if (playing) return pause();
        if (mine && src) return play(src);
        setFetching(true);
        try {
          const digest = await getWorldNewsDigest(lang);
          if (digest.audioUrl) play(digest.audioUrl);
          else setUnavailable(true);
        } catch {
          setUnavailable(true);
        } finally {
          setFetching(false);
        }
      }}
      aria-label={t(playing ? "news.pauseBrief" : "news.listenBrief")}
      className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl bg-orange-500 px-3.5 text-[13px] font-semibold text-white transition hover:brightness-110 active:scale-[0.97] disabled:opacity-80"
    >
      {busy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : playing ? (
        <Pause className="h-3.5 w-3.5 fill-current" />
      ) : (
        <Headphones className="h-3.5 w-3.5" />
      )}
      {playing ? t("news.pause") : t("news.listen")}
    </button>
  );
}

/** The home page's news card: the freshest headlines, one tap from each. */
export function WorldNewsTeaser() {
  const [items, setItems] = useState<WorldNewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    let isMounted = true;

    getWorldNewsFeed()
      .then((payload) => isMounted && setItems(payload.topStories.slice(0, HEADLINE_COUNT)))
      .catch(() => undefined)
      .finally(() => isMounted && setIsLoading(false));

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="rounded-[26px] border border-white/[0.08] bg-card/90 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-stone-400">{t("news.latest")}</span>
        <Link
          href="/world-news"
          className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand-700 transition hover:text-ink"
        >
          {t("news.all")}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <ul className="mt-3 divide-y divide-white/[0.06]">
        {isLoading
          ? Array.from({ length: HEADLINE_COUNT }, (_, index) => (
              <li key={index} className="py-4" aria-hidden="true">
                <div className="h-2.5 w-20 animate-pulse rounded bg-white/[0.06]" />
                <div className="mt-3 h-4 w-11/12 animate-pulse rounded bg-white/[0.06]" />
                <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-white/[0.06]" />
              </li>
            ))
          : items.map((item) => {
              const lane = LANE_BY_SECTION[item.section] ?? LANE_BY_SECTION.top;
              return (
                <li key={item.id} className="flex items-start gap-2 py-4 first:pt-3">
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() =>
                      logEvent("story_opened", null, {
                        surface: "home_teaser",
                        category: item.category,
                        source: item.source
                      })
                    }
                    className="group min-w-0 flex-1"
                  >
                    <span className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: lane.tone }} />
                      <span
                        className="font-mono text-[10px] font-medium uppercase tracking-[0.12em]"
                        style={{ color: lane.tone }}
                      >
                        {t(lane.labelKey)}
                      </span>
                    </span>
                    <span className="mt-2 block text-[15.5px] font-semibold leading-[1.4] text-ink transition group-hover:text-brand-700">
                      {item.headline}
                    </span>
                    <span className="mt-1.5 block font-mono text-[11px] text-stone-400">
                      {item.source} · {item.publishLabel}
                    </span>
                  </a>
                  <SaveStoryButton item={item} className="-mr-2" />
                </li>
              );
            })}
      </ul>

      {!isLoading && !items.length ? (
        <p className="py-4 text-sm text-stone-500">
          {t("news.refreshing")}
        </p>
      ) : null}

      <div className="mt-2 flex items-center gap-3 rounded-[18px] border border-orange-500/30 bg-gradient-to-br from-orange-500/[0.16] to-orange-500/[0.03] px-4 py-3.5">
        <Sparkles className="h-4 w-4 shrink-0 text-orange-700" aria-hidden="true" />
        <Link href="/world-news" className="group min-w-0 flex-1">
          <span className="block text-sm font-semibold text-ink transition group-hover:text-brand-700">
            {t("news.briefCardTitle")}
          </span>
          <span className="block text-[12.5px] text-stone-500">{t("news.briefCardBody")}</span>
        </Link>
        <BriefListenButton />
      </div>
    </section>
  );
}
