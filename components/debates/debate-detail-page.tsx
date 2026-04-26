"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, MessageSquareText, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { ShareActions } from "@/components/ui/share-actions";
import { getDailyDebateById } from "@/services/news-service";
import { DailyDebatePrompt } from "@/types";

export function DebateDetailPage({ debateId }: { debateId: string }) {
  const [debate, setDebate] = useState<DailyDebatePrompt | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      setIsLoading(true);
      const nextDebate = await getDailyDebateById(debateId);
      if (isMounted) {
        setDebate(nextDebate);
        setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [debateId]);

  if (!isLoading && !debate) {
    return (
      <AppShell>
        <EmptyState
          title="This debate could not be found"
          description="The prompt may have been removed, rotated out, or has not been published yet."
        />
      </AppShell>
    );
  }

  if (!debate) {
    return (
      <AppShell>
        <div className="rounded-[28px] border border-brand-100 bg-white/96 p-6 text-sm text-stone-500 shadow-soft">
          Loading debate...
        </div>
      </AppShell>
    );
  }

  const createHref = debate.teamTag
    ? `/create?text=${encodeURIComponent(debate.suggestedText)}&team=${encodeURIComponent(debate.teamTag)}`
    : `/create?text=${encodeURIComponent(debate.suggestedText)}`;

  return (
    <AppShell>
      <div className="space-y-5">
        <section className="overflow-hidden border-b border-brand-100/80 bg-white/96 sm:rounded-[32px] sm:border sm:shadow-soft">
          <div className="bg-gradient-to-br from-brand-600 via-orange-400 to-brand-300 px-4 py-5 text-white sm:px-6 sm:py-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/95 transition hover:bg-white/18"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to feed
                </Link>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-white/75">Daily debate</p>
                <h1 className="mt-2 text-[1.8rem] font-black tracking-tight sm:text-[2.4rem]">
                  {debate.prompt}
                </h1>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/90">
                  <span className="rounded-full bg-white/12 px-3 py-1.5">{debate.category}</span>
                  {debate.teamTag ? <span className="rounded-full bg-white/12 px-3 py-1.5">{debate.teamTag}</span> : null}
                  {debate.publishLabel ? <span className="rounded-full bg-white/12 px-3 py-1.5">{debate.publishLabel}</span> : null}
                </div>
              </div>
              <ShareActions
                path={`/debates/${debate.id}`}
                title="HabeshaGram debate"
                text={debate.prompt}
                className="rounded-[24px] bg-white/12 p-3 backdrop-blur"
              />
            </div>
          </div>
        </section>

        <section className="rounded-[30px] border border-brand-100/80 bg-white/96 p-4 shadow-soft sm:p-5">
          <div className="space-y-4">
            <div className="rounded-[24px] border border-brand-100/80 bg-gradient-to-br from-brand-50/70 via-white to-orange-50/50 px-4 py-4">
              <p className="text-sm leading-7 text-stone-700">{debate.suggestedText}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={createHref}
                className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-600"
              >
                <MessageSquareText className="h-4 w-4" />
                Post your take
              </Link>
              {debate.hashtag ? (
                <Link
                  href={`/topic/${debate.hashtag.toLowerCase()}`}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-800 shadow-sm ring-1 ring-brand-100 transition hover:bg-brand-50"
                >
                  <Sparkles className="h-4 w-4" />
                  #{debate.hashtag}
                </Link>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
