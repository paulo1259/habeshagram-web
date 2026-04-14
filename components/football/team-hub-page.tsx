"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Flame, MessageSquareText, Radio, Sparkles, Users } from "lucide-react";
import { BreakingNow } from "@/components/discovery/breaking-now";
import { DailyDebates } from "@/components/discovery/daily-debates";
import { VideoHighlights } from "@/components/discovery/video-highlights";
import { AppShell } from "@/components/layout/app-shell";
import { FeedList } from "@/components/posts/feed-list";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { useAppData } from "@/hooks/use-app-data";
import { getTeamHubConfig, getTeamSlug, teamHubConfigs, TeamSlug } from "@/services/football-hub-data";
import { getFootballBuzzByTeam } from "@/services/news-service";
import { FootballNewsItem } from "@/types";

export function TeamHubPage({ slug }: { slug: TeamSlug }) {
  const config = getTeamHubConfig(slug);
  const { posts, isLoading } = useAppData();
  const [newsItems, setNewsItems] = useState<FootballNewsItem[]>([]);
  const [isNewsLoading, setIsNewsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      const next = await getFootballBuzzByTeam(config.team);
      if (isMounted) {
        setNewsItems(next);
        setIsNewsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [config.team]);

  const teamPosts = useMemo(
    () => posts.filter((post) => post.teamTag === config.team),
    [config.team, posts]
  );

  return (
    <AppShell>
      <div className="space-y-5">
        <section className="overflow-hidden border-b border-brand-100/80 bg-white/96 sm:rounded-[32px] sm:border sm:shadow-soft">
          <div className={`bg-gradient-to-br px-4 py-5 text-white sm:px-6 sm:py-6 ${config.heroGradient}`}>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/95 transition hover:bg-white/18"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to feed
            </Link>

            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-16 w-16 items-center justify-center rounded-[24px] bg-gradient-to-br ${config.badgeGradient} text-lg font-black tracking-[0.14em] text-white shadow-lg ring-4 ${config.accentRing}`}
                  >
                    {config.badge}
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                      Football Fan Zone
                    </p>
                    <h1 className="mt-1 text-[1.9rem] font-black tracking-tight sm:text-[2.5rem]">
                      {config.team}
                    </h1>
                  </div>
                </div>
                <p className="mt-4 max-w-xl text-sm leading-6 text-white/90 sm:text-[15px]">
                  Club buzz, Habesha debate prompts, and community takes in one fast-moving hub.
                  Keep this seeded for now and plug in live football APIs later if you want.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:min-w-[18rem]">
                <div className="rounded-[24px] bg-white/12 px-4 py-3 backdrop-blur">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
                    {config.moodLabel}
                  </p>
                  <p className="mt-2 text-base font-bold">{config.moodValue}</p>
                </div>
                <div className="rounded-[24px] bg-white/12 px-4 py-3 backdrop-blur">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
                    Live vibe
                  </p>
                  <p className="mt-2 text-base font-bold">Group chats active</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 px-4 py-4 sm:px-6 sm:py-5">
            <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
              {Object.values(teamHubConfigs).map((teamConfig) => {
                const active = teamConfig.slug === slug;
                return (
                  <Link
                    key={teamConfig.slug}
                    href={`/football/${teamConfig.slug}`}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                      active
                        ? "border-brand-500 bg-brand-500 text-white"
                        : "border-brand-100 bg-white text-stone-700 hover:border-brand-200 hover:bg-brand-50"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br ${teamConfig.badgeGradient} text-[11px] font-black text-white`}
                    >
                      {teamConfig.badge}
                    </span>
                    {teamConfig.team}
                  </Link>
                );
              })}
            </div>

            <div className={`rounded-[28px] border border-brand-100 px-4 py-4 sm:px-5 ${config.surfaceTint}`}>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-white/80 p-2 text-brand-700 shadow-sm">
                  <Radio className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                    Matchday vibe
                  </p>
                  <p className="mt-2 text-sm leading-6 text-stone-700">{config.moodDescription}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-4">
            <section className="space-y-3">
              <SectionHeader
                eyebrow="Fan Discussion"
                title={`${config.team} takes from the Habesha timeline`}
                description="These posts use a lightweight team tag so the same social feed can power football spaces too."
              />
              {!isLoading && !teamPosts.length ? (
                <EmptyState
                  title={`No ${config.team} fan posts yet`}
                  description={`Be the first to post with the ${config.team} team tag and get this fan zone moving.`}
                />
              ) : (
                <FeedList posts={teamPosts} isLoading={isLoading} />
              )}
            </section>

            <section className="space-y-3">
              <SectionHeader
                eyebrow="Football Buzz"
                title={`Latest ${config.team} storylines`}
                description="Seeded cards for now. TODO: replace this layer with live football/news APIs later without changing the page UI."
              />
              {isNewsLoading ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {[1, 2].map((item) => (
                    <div
                      key={item}
                      className="rounded-[28px] border border-brand-100 bg-white p-4 shadow-soft"
                    >
                      <div className="h-40 animate-pulse rounded-[22px] bg-brand-100" />
                    </div>
                  ))}
                </div>
              ) : newsItems.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {newsItems.map((item) => (
                    <article
                      key={item.id}
                      className="overflow-hidden rounded-[28px] border border-brand-100 bg-white shadow-soft"
                    >
                      {item.imageURL ? (
                        <img
                          src={item.imageURL}
                          alt={item.headline}
                          className="h-44 w-full object-cover"
                        />
                      ) : null}
                      <div className="space-y-3 p-4">
                        <div className="flex items-center justify-between gap-3 text-xs">
                          <span className="rounded-full bg-brand-50 px-3 py-1 font-semibold uppercase tracking-[0.14em] text-brand-800">
                            {item.category}
                          </span>
                          <span className={`font-semibold ${config.accentText}`}>{item.source}</span>
                        </div>
                        <h2 className="text-lg font-black tracking-tight text-ink">{item.headline}</h2>
                        <p className="text-sm leading-6 text-stone-600">{item.summary}</p>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Fresh football stories are on the way"
                  description={`We do not have seeded ${config.team} stories here yet, but the hub is ready for live data.`}
                />
              )}
            </section>
          </div>

          <div className="space-y-4">
            <BreakingNow compact team={config.team} />
            <VideoHighlights compact team={config.team} limit={3} />
            <DailyDebates compact team={config.team} />

            <section className="rounded-[30px] border border-brand-100 bg-white/96 p-4 shadow-soft sm:p-5">
              <SectionHeader
                eyebrow="Debate Corner"
                title={`${config.team} topics blowing up group chats`}
                description="Fun prompts to make each fan zone feel social even before a full dedicated posting system exists."
              />
              <div className="space-y-3">
                {config.debatePrompts.map((prompt) => (
                  <div
                    key={prompt}
                    className="rounded-[24px] border border-brand-100 bg-brand-50/50 px-4 py-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-full bg-white p-2 text-brand-700 shadow-sm">
                        <MessageSquareText className="h-4 w-4" />
                      </div>
                      <p className="text-sm leading-6 text-stone-700">{prompt}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[30px] border border-brand-100 bg-white/96 p-4 shadow-soft sm:p-5">
              <SectionHeader
                eyebrow="Club Energy"
                title="Why this hub feels alive"
                description="A compact social snapshot for fans landing here from the discovery feed."
              />
              <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                <div className="rounded-[24px] bg-brand-50/70 px-4 py-3">
                  <div className="flex items-center gap-2 text-brand-800">
                    <Flame className="h-4 w-4" />
                    <p className="text-xs font-semibold uppercase tracking-[0.14em]">Hot takes</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-stone-700">
                    Community posts tagged for {config.team} stay in the same main feed system.
                  </p>
                </div>
                <div className="rounded-[24px] bg-orange-50/80 px-4 py-3">
                  <div className="flex items-center gap-2 text-orange-700">
                    <Users className="h-4 w-4" />
                    <p className="text-xs font-semibold uppercase tracking-[0.14em]">Fan base</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-stone-700">
                    Easy to follow from discovery cards, search, and future football collections.
                  </p>
                </div>
                <div className="rounded-[24px] bg-brand-100/50 px-4 py-3">
                  <div className="flex items-center gap-2 text-brand-800">
                    <Sparkles className="h-4 w-4" />
                    <p className="text-xs font-semibold uppercase tracking-[0.14em]">Future-ready</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-stone-700">
                    Swap seeded stories for live football/news APIs later with a single service update.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
