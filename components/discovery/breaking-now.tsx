"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BellRing, Radio, Siren } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { formatDate, getBreakingDiscussionPostId } from "@/lib/utils";
import { getBreakingItems } from "@/services/news-service";
import { BreakingItem } from "@/types";

const badgeStyles: Record<BreakingItem["badge"], string> = {
  BREAKING: "bg-red-500 text-white",
  LIVE: "bg-orange-500 text-white",
  "JUST IN": "bg-stone-900 text-white"
};


export function BreakingNow({
  compact = false
}: {
  compact?: boolean;
}) {
  const [items, setItems] = useState<BreakingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadBreakingItems = async () => {
      try {
        const nextItems = await getBreakingItems();

        if (isMounted) {
          setItems(nextItems);
          setMessage("");
        }
      } catch {
        if (isMounted) {
          setMessage("Live breaking news is temporarily unavailable.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadBreakingItems();

    const interval = window.setInterval(() => {
      void loadBreakingItems();
    }, 5 * 60 * 1000);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const visibleItems = items.slice(0, compact ? 3 : 4);

  return (
    <section className={`rounded-[30px] border border-brand-100/80 bg-card/96 shadow-soft ${compact ? "p-4" : "p-4 sm:p-5"}`}>
      <SectionHeader
        eyebrow="Breaking Now"
        title="What just hit the timeline"
        description={
          compact
            ? "Quick hits worth opening right now."
            : "Urgent East Africa headlines pulled from a live server-side feed and linked straight into HabeshaGram discussion."
        }
        action={
          !compact ? (
            <Link
              href="/match/live"
              className="inline-flex items-center rounded-full bg-red-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-red-700 transition hover:bg-red-100"
            >
              Match center
            </Link>
          ) : null
        }
      />

      <div className={`mt-4 ${compact ? "space-y-2.5" : "space-y-3"}`}>
        {!isLoading && message ? (
          <div className="rounded-[20px] border border-brand-100 bg-brand-50/50 px-4 py-3 text-sm text-brand-900">
            {message}
          </div>
        ) : null}
        {isLoading
          ? [1, 2, 3].map((item) => (
              <div key={item} className="rounded-[24px] border border-brand-100 bg-brand-50/40 px-4 py-4">
                <div className="h-4 w-24 animate-pulse rounded-full bg-brand-100" />
                <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-brand-100" />
                <div className="mt-2 h-3.5 w-2/3 animate-pulse rounded-full bg-brand-100" />
              </div>
            ))
          : !visibleItems.length ? (
              <EmptyState
                title="No breaking stories right now"
                description="Breaking updates will appear here when the live news feed has fresh headlines."
              />
            ) : visibleItems.map((item, index) => (
              <article
                key={item.id}
                className="rounded-[24px] border border-brand-100/80 bg-gradient-to-r from-card via-card to-brand-50/45 px-4 py-4 transition hover:-translate-y-0.5 hover:shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${badgeStyles[item.badge]}`}>
                    {item.badge}
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                    {item.category}
                  </span>
                  <span className="text-xs text-stone-400">&bull;</span>
                  <span className="text-xs text-stone-500">{formatDate(item.timestamp)}</span>
                </div>

                <h3 className="mt-3 text-sm font-bold leading-6 text-ink sm:text-[15px]">
                  {index === 0 && !compact ? (
                    <span className="mr-2 inline-flex items-center gap-1 text-red-600">
                      <Siren className="h-4 w-4" />
                    </span>
                  ) : null}
                  {item.headline}
                </h3>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-brand-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-800">
                      {item.source}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-orange-700">
                      <BellRing className="h-3.5 w-3.5" />
                      {item.category}
                    </span>
                  </div>
                  <Link
                    href={`/#post-${getBreakingDiscussionPostId(item.headline, item.source)}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-800 transition hover:text-brand-900"
                  >
                    <Radio className="h-3.5 w-3.5" />
                    Open discussion
                  </Link>
                </div>
              </article>
            ))}
      </div>
    </section>
  );
}
