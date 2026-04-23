"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { getTeamSlug } from "@/services/football-hub-data";
import { getFootballBuzzItems } from "@/services/news-service";
import { FootballNewsItem } from "@/types";

const teamStyles: Record<FootballNewsItem["team"], string> = {
  "Manchester United": "from-red-600/90 to-red-500/60 text-red-50",
  Arsenal: "from-rose-600/90 to-red-500/60 text-red-50",
  Chelsea: "from-blue-700/90 to-sky-500/60 text-blue-50",
  "Manchester City": "from-sky-600/90 to-cyan-400/60 text-sky-50"
};

export function FootballBuzz() {
  const [items, setItems] = useState<FootballNewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const next = await getFootballBuzzItems();
      setItems(next);
      setIsLoading(false);
    })();
  }, []);

  return (
    <section className="space-y-4 rounded-[30px] border border-brand-100/80 bg-white/96 p-4 shadow-soft sm:p-5">
      <SectionHeader
        eyebrow="Football Buzz"
        title="Premier League takes for Habesha group chats"
        description="A dedicated lane for football story cards once the editorial football source is connected."
        action={
          <Link
            href="/match/live"
            className="inline-flex items-center rounded-full bg-brand-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-800 transition hover:bg-brand-100"
          >
            Live match center
          </Link>
        }
      />

      <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 lg:grid lg:grid-cols-2 lg:overflow-visible lg:pb-0">
        {isLoading
          ? [1, 2, 3].map((item) => (
              <div
                key={item}
                className="min-w-[82%] snap-start rounded-[26px] border border-brand-100 bg-brand-50/50 p-4 lg:min-w-0"
              >
                <div className="h-40 animate-pulse rounded-[22px] bg-brand-100" />
              </div>
            ))
          : items.length
            ? items.map((item) => (
              <article
                key={item.id}
                className="min-w-[82%] snap-start overflow-hidden rounded-[26px] border border-brand-100/80 bg-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg lg:min-w-0"
              >
                <div className={`bg-gradient-to-br p-4 ${teamStyles[item.team]}`}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]">
                      {item.category}
                    </span>
                    <span className="text-xs font-semibold">{item.team}</span>
                  </div>
                  <h3 className="mt-4 text-lg font-black leading-6 tracking-tight">{item.headline}</h3>
                </div>

                <div className="space-y-3 p-4">
                  {item.imageURL ? (
                    <img
                      src={item.imageURL}
                      alt={item.headline}
                      className="h-44 w-full rounded-[20px] object-cover"
                    />
                  ) : null}
                  <p className="text-sm leading-6 text-stone-700">{item.summary}</p>
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="rounded-full bg-brand-50 px-3 py-1 font-semibold uppercase tracking-[0.14em] text-brand-800">
                      {item.source}
                    </span>
                    <Link
                      href={`/football/${getTeamSlug(item.team)}`}
                      className="font-semibold text-brand-800 transition hover:text-brand-900"
                    >
                      Join the debate
                    </Link>
                  </div>
                </div>
              </article>
            ))
            : (
              <div className="min-w-full lg:col-span-2">
                <EmptyState
                  title="No football buzz stories right now"
                  description="Fresh football editorial cards will appear here once the football news lane is connected."
                />
              </div>
            )}
      </div>
    </section>
  );
}
