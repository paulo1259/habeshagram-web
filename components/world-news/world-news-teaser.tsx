"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Globe2 } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { getWorldNewsFeed } from "@/services/world-news-client-service";
import { WorldNewsItem } from "@/types";

export function WorldNewsTeaser() {
  const [items, setItems] = useState<WorldNewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        const payload = await getWorldNewsFeed();
        if (isMounted) {
          setItems(payload.topStories.slice(0, 3));
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

  return (
    <section className="overflow-hidden rounded-[30px] border border-brand-100/80 bg-white/96 p-4 shadow-soft sm:p-5">
      <SectionHeader
        eyebrow="World News"
        title="A dedicated world-news lane for diaspora readers"
        description="Top stories, United States, Ethiopia, and immigration updates now have a clearer home instead of competing with the main feed."
        action={
          <Link
            href="/world-news"
            className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-800 transition hover:bg-brand-100"
          >
            <Globe2 className="h-3.5 w-3.5" />
            Open World News
          </Link>
        }
      />

      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <div className="rounded-[26px] bg-gradient-to-r from-brand-500 via-orange-300 to-brand-200 px-4 py-4 text-ink sm:px-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-900/65">
            Curated lanes
          </p>
          <p className="mt-2 text-lg font-black tracking-tight">
            United States, Ethiopia, and immigration in one clearer news destination.
          </p>
          <p className="mt-2 text-sm text-stone-700">
            Use the dedicated World News page when you want cleaner, diaspora-relevant headlines without a generic news dump.
          </p>
          <div className="mt-4">
            <Link
              href="/world-news"
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-800 shadow-soft transition hover:bg-brand-50"
            >
              Open World News
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="rounded-[24px] border border-brand-100/80 bg-brand-50/35 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
            Top headlines
          </p>
          <div className="mt-3 space-y-3">
            {isLoading ? (
              <div className="rounded-[20px] bg-white/90 px-4 py-4 text-sm text-stone-500">
                Loading headlines...
              </div>
            ) : items.length ? (
              items.map((item) => (
                <a
                  key={item.id}
                  href={item.link}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-[20px] bg-white/92 px-4 py-3 transition hover:-translate-y-0.5 hover:shadow-sm"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-700">
                    {item.category}
                  </p>
                  <p className="mt-2 text-sm font-bold leading-6 text-ink">{item.headline}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    {item.source} · {item.publishLabel}
                  </p>
                </a>
              ))
            ) : (
              <div className="rounded-[20px] bg-white/90 px-4 py-4 text-sm text-stone-500">
                Fresh headlines will appear here as soon as the world-news lanes update.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
