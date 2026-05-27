"use client";

import { useEffect } from "react";
import Link from "next/link";
import { logEvent } from "@/lib/analytics-events";
import { ArrowRight, Flame, Mic2, Trophy } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { SectionHeader } from "@/components/ui/section-header";
import { ShareActions } from "@/components/ui/share-actions";
import { mmaHub } from "@/services/mma-hub-data";
import { MMAPredictionPollCard } from "@/components/mma/mma-prediction-poll-card";

export function MMAPage() {
  const featured = mmaHub.featuredFight;

  useEffect(() => {
    logEvent("mma_hub_open");
  }, []);

  return (
    <AppShell>
      <div className="page-stack">
        <section className="page-hero border-b border-brand-100/80 bg-white/96 sm:border">
          <div className="bg-gradient-to-br from-red-700 via-orange-500 to-brand-500 px-4 py-5 text-white sm:px-6 sm:py-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">MMA</p>
                <h1 className="page-title mt-1">Official events, honest hype</h1>
                <p className="mt-3 text-sm leading-6 text-white/90 sm:text-[15px]">
                  A premium MMA/UFC destination for verified official events, clearly labeled community prompts, and fight-night rooms that do not depend on shaky live-score feeds.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-white/95">
                    <Flame className="h-3.5 w-3.5" />
                    {mmaHub.upcomingFightCards.length} official events
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-white/95">
                    <Trophy className="h-3.5 w-3.5" />
                    {mmaHub.recentResults.length} verified results
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-white/95">
                    <Mic2 className="h-3.5 w-3.5" />
                    {mmaHub.liveRooms.length} live rooms
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:min-w-[17rem]">
                <div className="rounded-[24px] bg-white/12 px-4 py-3 backdrop-blur">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">Featured</p>
                  <p className="mt-2 text-xl font-black">{featured.weightClass}</p>
                </div>
                <div className="rounded-[24px] bg-white/12 px-4 py-3 backdrop-blur">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">Trust label</p>
                  <p className="mt-2 text-sm font-black leading-5">{mmaHub.sourceLabel}</p>
                </div>
                <div className="col-span-2 rounded-[24px] bg-white/12 p-3 backdrop-blur">
                  <ShareActions
                    path="/football"
                    title="MMA on HabeshaGram"
                    text="Open HabeshaGram's MMA hub for verified UFC events, community prompts, and fight-week rooms."
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="surface-panel p-4 sm:p-5">
          <SectionHeader
            eyebrow="Source label"
            title={mmaHub.sourceLabel}
            description="Verified UFC events stay separate from community prompts. If a full card is not confirmed yet, HabeshaGram says so directly."
          />
        </section>

        <section className="surface-panel p-4 sm:p-5">
          <SectionHeader
            eyebrow="Featured fight"
            title={featured.headline}
            description={featured.note}
          />

            <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <article className="rounded-[26px] border border-brand-100/80 bg-gradient-to-br from-white via-white to-brand-50/35 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-brand-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-800">
                  {featured.promotion}
                </span>
                <span className="text-sm font-medium text-stone-500">{featured.dateLabel}</span>
              </div>
              <p className="mt-4 text-2xl font-black tracking-tight text-ink">
                {featured.redCorner.name} vs {featured.blueCorner.name}
              </p>
              <p className="mt-2 text-sm font-semibold text-brand-800">{featured.weightClass}</p>
              <p className="mt-2 text-sm leading-6 text-stone-600">{featured.venue}</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[22px] bg-white px-4 py-4 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">Red corner</p>
                  <p className="mt-2 text-lg font-black text-ink">{featured.redCorner.name}</p>
                  {featured.redCorner.record ? (
                    <p className="mt-1 text-sm text-brand-800">{featured.redCorner.record}</p>
                  ) : null}
                  <p className="mt-2 text-sm leading-6 text-stone-600">{featured.redCorner.summary}</p>
                </div>
                <div className="rounded-[22px] bg-white px-4 py-4 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">Blue corner</p>
                  <p className="mt-2 text-lg font-black text-ink">{featured.blueCorner.name}</p>
                  {featured.blueCorner.record ? (
                    <p className="mt-1 text-sm text-brand-800">{featured.blueCorner.record}</p>
                  ) : null}
                  <p className="mt-2 text-sm leading-6 text-stone-600">{featured.blueCorner.summary}</p>
                </div>
              </div>
              <div className="mt-4 rounded-[22px] bg-white px-4 py-4 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">Official card notes</p>
                <div className="mt-3 space-y-3">
                  {featured.mainCardFights.length > 0 ? (
                    featured.mainCardFights.map((fight) => (
                      <div key={fight.id}>
                        <p className="text-sm font-bold text-ink">{fight.fighterAName} vs {fight.fighterBName}</p>
                        <p className="text-xs text-stone-500">
                          {fight.weightClass}
                          {fight.stakes ? ` | ${fight.stakes}` : ""}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-stone-500">Fight card details coming soon.</p>
                  )}
                </div>
              </div>
              {featured.discussionPrompt ? (
                <div className="mt-4 rounded-[22px] bg-brand-50 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">{mmaHub.communityLabel}</p>
                  <p className="mt-2 text-sm leading-6 text-brand-950">{featured.discussionPrompt}</p>
                  {featured.relatedRoomTitle ? (
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-brand-800">
                      Room tonight: {featured.relatedRoomTitle}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </article>

            {mmaHub.fighterSpotlight ? (
              <article className="rounded-[26px] border border-brand-100/80 bg-white p-5 shadow-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">Fighter spotlight</p>
                <p className="mt-3 text-2xl font-black tracking-tight text-ink">{mmaHub.fighterSpotlight.name}</p>
                <p className="mt-2 text-sm font-semibold text-brand-800">{mmaHub.fighterSpotlight.weightClass}</p>
                <p className="mt-1 text-sm text-stone-500">
                  {mmaHub.communityLabel} | {mmaHub.fighterSpotlight.country}
                </p>
                <p className="mt-3 text-sm leading-6 text-stone-600">{mmaHub.fighterSpotlight.summary}</p>
              </article>
            ) : null}
          </div>
        </section>

        {mmaHub.featuredPoll ? (
          <section className="surface-panel p-4 sm:p-5">
            <SectionHeader
              eyebrow="Community predictions"
              title="Where is the room leaning?"
              description="One vote per member, locked before the main event. Community picks only."
            />
            <div className="mt-4 lg:max-w-2xl">
              <MMAPredictionPollCard poll={mmaHub.featuredPoll} />
            </div>
          </section>
        ) : null}

        <section className="surface-panel p-4 sm:p-5">
          <SectionHeader
            eyebrow="Official UFC events"
            title="What is next on the calendar"
            description="Only verified UFC events appear here. If details are pending, the desk says so clearly."
          />

            <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {mmaHub.upcomingFightCards.map((card) => (
              <article key={card.id} className="rounded-[24px] border border-brand-100/80 bg-white px-4 py-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-800">
                    {card.promotion}
                  </span>
                  <span className="text-xs font-medium text-stone-500">{card.dateLabel}</span>
                </div>
                <p className="mt-3 text-lg font-black tracking-tight text-ink">{card.eventName}</p>
                <p className="mt-2 text-sm font-semibold text-brand-800">{card.headlineFight}</p>
                <p className="mt-2 text-sm text-stone-600">{card.venue}</p>
                <p className="mt-3 text-sm leading-6 text-stone-600">{card.note}</p>
                <div className="mt-4 space-y-3">
                  {card.mainCardFights.length > 0 ? (
                    card.mainCardFights.map((fight) => (
                      <div key={fight.id}>
                        <p className="text-sm font-bold text-ink">{fight.fighterAName} vs {fight.fighterBName}</p>
                        <p className="text-xs text-stone-500">
                          {fight.weightClass}
                          {fight.stakes ? ` | ${fight.stakes}` : ""}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[18px] bg-stone-50 px-3 py-3">
                      <p className="text-sm font-semibold text-ink">Fight card details coming soon.</p>
                      <p className="mt-2 text-xs leading-5 text-stone-500">
                        This is an official UFC event. HabeshaGram will add matchup depth only after UFC confirms it.
                      </p>
                    </div>
                  )}
                </div>
                {card.discussionPrompt ? (
                  <div className="mt-4 rounded-[18px] bg-brand-50 px-3 py-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-700">{mmaHub.communityLabel}</p>
                    <p className="mt-2 text-sm leading-6 text-brand-950">{card.discussionPrompt}</p>
                    {card.relatedRoomTitle ? (
                      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-brand-800">
                        Related room: {card.relatedRoomTitle}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <section className="surface-panel p-4 sm:p-5">
            <SectionHeader
              eyebrow="Verified results"
              title="Recent results"
              description="Results only appear once they can be verified from official UFC sources."
            />
            {mmaHub.recentResults.length > 0 ? (
              <div className="mt-4 space-y-3">
                {mmaHub.recentResults.map((result) => (
                  <article key={result.id} className="rounded-[22px] border border-brand-100/80 bg-white px-4 py-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-stone-500">{result.eventName}</p>
                      <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-700">
                        {result.method} {result.round}
                      </span>
                    </div>
                    <p className="mt-3 text-lg font-black tracking-tight text-ink">{result.headline}</p>
                    <p className="mt-2 text-sm font-semibold text-brand-800">
                      {result.winnerName} def. {result.loserName}
                    </p>
                    <p className="mt-2 text-sm text-stone-500">{result.timeLabel} | {result.weightClass}</p>
                    <p className="mt-3 text-sm leading-6 text-stone-600">{result.summary}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-[22px] border border-brand-100/80 bg-white px-4 py-4 shadow-sm">
                <p className="text-lg font-black tracking-tight text-ink">Results coming soon</p>
                <p className="mt-3 text-sm leading-6 text-stone-600">
                  Official UFC results will appear here after verified cards conclude.
                </p>
              </div>
            )}
          </section>

          <section className="surface-panel p-4 sm:p-5">
            <SectionHeader
              eyebrow="Community prompts"
              title="What people are talking about"
              description="Clearly labeled editorial and community discussion cards."
            />
            <div className="mt-4 space-y-3">
              {mmaHub.trendingDiscussions.map((discussion) => (
                <article key={discussion.id} className="rounded-[22px] border border-brand-100/80 bg-white px-4 py-4 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">{mmaHub.communityLabel}</p>
                  <p className="mt-2 text-base font-black tracking-tight text-ink">{discussion.title}</p>
                  <p className="mt-2 text-sm leading-6 text-stone-600">{discussion.summary}</p>
                  <p className="mt-3 text-xs font-medium text-stone-500">{discussion.source} | {discussion.timeAgo}</p>
                  {discussion.discussionPrompt ? (
                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-brand-800">
                      {discussion.discussionPrompt}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        </div>

        <section className="surface-panel p-4 sm:p-5">
          <SectionHeader
            eyebrow="Live rooms"
            title="Major-fight audio rooms"
            description="A simple bridge from the MMA desk into the audio side of HabeshaGram."
            action={
              <Link
                href="/live-rooms"
                className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-800 transition hover:bg-brand-100"
              >
                <Mic2 className="h-3.5 w-3.5" />
                Open rooms
              </Link>
            }
          />

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {mmaHub.liveRooms.map((room) => (
              <article key={room.id} className="rounded-[24px] border border-brand-100/80 bg-gradient-to-br from-white to-orange-50/50 px-4 py-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-800">
                    {room.status === "live" ? "Live room" : "Scheduled"}
                  </span>
                  <span className="text-xs font-medium text-stone-500">{room.listeners} listeners</span>
                </div>
                <p className="mt-3 text-lg font-black tracking-tight text-ink">{room.title}</p>
                <p className="mt-2 text-sm leading-6 text-stone-600">{room.topic}</p>
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-700">Official event room</p>
                <Link
                  href="/live-rooms"
                  className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand-800 transition hover:text-brand-900"
                >
                  Join the room
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </article>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
