"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MessageSquareText, Sparkles } from "lucide-react";
import { recordDebateEngagement } from "@/lib/personalization";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { ShareActions } from "@/components/ui/share-actions";
import { getDailyDebates } from "@/services/news-service";
import { DailyDebatePrompt } from "@/types";


export function DailyDebates({
  compact = false
}: {
  compact?: boolean;
}) {
  const [prompts, setPrompts] = useState<DailyDebatePrompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      const next = await getDailyDebates();
      if (isMounted) {
        setPrompts(next);
        setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const visiblePrompts = prompts.slice(0, compact ? 2 : 3);

  return (
    <section className={`rounded-[30px] border border-brand-100/80 bg-card/96 shadow-soft ${compact ? "p-4" : "p-4 sm:p-5"}`}>
      <SectionHeader
        eyebrow="Today's Debate"
        title="Prompts built to start group chat arguments"
        description={
          compact
            ? "Quick prompts to turn scrolling into posting."
            : "Daily editorial debate cards that nudge people to react, post, and keep the timeline moving."
        }
      />

      <div className={`mt-4 ${compact ? "space-y-2.5" : "space-y-3"}`}>
        {isLoading
          ? [1, 2].map((item) => (
              <div key={item} className="rounded-[24px] border border-brand-100 bg-brand-50/40 px-4 py-4">
                <div className="h-4 w-24 animate-pulse rounded-full bg-brand-100" />
                <div className="mt-3 h-4 w-full animate-pulse rounded-full bg-brand-100" />
                <div className="mt-4 h-10 w-40 animate-pulse rounded-full bg-brand-100" />
              </div>
            ))
          : !visiblePrompts.length ? (
              <EmptyState
                title="No debates today"
                description="Fresh debate prompts will show up here once the editorial collection is updated."
              />
            ) : visiblePrompts.map((item) => {
              const href = `/create?text=${encodeURIComponent(item.suggestedText)}`;

              return (
                <article
                  key={item.id}
                  className="rounded-[24px] border border-brand-100/80 bg-gradient-to-br from-brand-50/70 via-card to-orange-50/50 px-4 py-4"
                >
                  <div className="flex items-center gap-2 text-brand-800">
                    <span className="rounded-full bg-card px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] shadow-sm">
                      {item.category}
                    </span>
                    {item.publishLabel ? (
                      <span className="text-xs text-stone-400">{item.publishLabel}</span>
                    ) : null}
                  </div>
                  <h3 className="mt-3 text-sm font-bold leading-6 text-ink sm:text-[15px]">
                    {item.prompt}
                  </h3>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Link
                      href={href}
                      onClick={() =>
                        recordDebateEngagement({
                          hashtag: item.hashtag,
                          weight: 3
                        })
                      }
                      className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-950 transition hover:bg-brand-600"
                    >
                      <MessageSquareText className="h-3.5 w-3.5" />
                      Post your take
                    </Link>
                    {item.hashtag ? (
                      <Link
                        href={`/topic/${item.hashtag.toLowerCase()}`}
                        onClick={() =>
                          recordDebateEngagement({
                            hashtag: item.hashtag,
                            weight: 2
                          })
                        }
                        className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-800 ring-1 ring-brand-100 transition hover:bg-brand-50"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        #{item.hashtag}
                      </Link>
                    ) : null}
                  </div>
                  <div className="mt-3">
                    <ShareActions
                      path={`/debates/${item.id}`}
                      title="HabeshaGram debate"
                      text={item.prompt}
                      compact
                    />
                  </div>
                </article>
              );
            })}
      </div>
    </section>
  );
}
