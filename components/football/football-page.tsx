"use client";

import Link from "next/link";
import { Activity, ArrowRight, Radio, Shield, Trophy } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { MatchdayCenter } from "@/components/discovery/matchday-center";
import { BreakingNow } from "@/components/discovery/breaking-now";
import { PremierLeagueStandings } from "@/components/discovery/premier-league-standings";
import { SectionHeader } from "@/components/ui/section-header";
import { useAppData } from "@/hooks/use-app-data";
import { useLiveMatchPulse } from "@/hooks/use-live-match-pulse";
import { getMatchdayGroups } from "@/services/matchday-service";

function FootballBoard({
  title,
  emptyLabel,
  fixtures
}: {
  title: string;
  emptyLabel: string;
  fixtures: ReturnType<typeof getMatchdayGroups>["live"];
}) {
  return (
    <section className="rounded-[24px] border border-brand-100/80 bg-brand-50/30 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">{title}</p>
      <div className="mt-3 space-y-3">
        {fixtures.length ? (
          fixtures.map((fixture) => (
            <article
              key={fixture.id}
              className="rounded-[20px] border border-brand-100/80 bg-white/92 px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
                  {fixture.status}
                </span>
                {fixture.heatSignal ? (
                  <span className="rounded-full bg-orange-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-700">
                    {fixture.heatSignal}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm font-bold leading-6 text-ink">
                {fixture.status === "finished"
                  ? `FT ${fixture.homeTeam} ${fixture.homeScore ?? 0}-${fixture.awayScore ?? 0} ${fixture.awayTeam}`
                  : fixture.status === "live"
                    ? `${fixture.homeTeam} ${fixture.homeScore ?? 0}-${fixture.awayScore ?? 0} ${fixture.awayTeam}`
                    : `${fixture.homeTeam} vs ${fixture.awayTeam}`}
              </p>
              <p className="mt-1 text-sm text-stone-600">{fixture.venue}</p>
              <div className="mt-3">
                <Link
                  href="/match/live"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-800 transition hover:text-brand-900"
                >
                  Open live center
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-[20px] bg-white/85 px-4 py-4 text-sm text-stone-600">{emptyLabel}</div>
        )}
      </div>
    </section>
  );
}

export function FootballPage() {
  const { posts } = useAppData();
  const { matches, message } = useLiveMatchPulse({ posts });
  const groups = getMatchdayGroups(matches);

  return (
    <AppShell>
      <div className="space-y-5">
        <section className="overflow-hidden border-b border-brand-100/80 bg-white/96 sm:rounded-[32px] sm:border sm:shadow-soft">
          <div className="bg-gradient-to-br from-red-600 via-orange-400 to-brand-500 px-4 py-5 text-white sm:px-6 sm:py-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">Football</p>
                <h1 className="mt-1 text-[2rem] font-black tracking-tight sm:text-[2.6rem]">
                  Club pulse, live scores, and the table in one place
                </h1>
                <p className="mt-3 text-sm leading-6 text-white/90 sm:text-[15px]">
                  A dedicated football section for tracked clubs, with live action, upcoming fixtures, recent final scores, the Premier League table, and breaking headlines.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-white/95">
                    <Activity className="h-3.5 w-3.5" />
                    {groups.live.length} live now
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-white/95">
                    <Shield className="h-3.5 w-3.5" />
                    {groups.upcoming.length} upcoming
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-white/95">
                    <Trophy className="h-3.5 w-3.5" />
                    {groups.results.length} recent FT
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:min-w-[17rem]">
                <div className="rounded-[24px] bg-white/12 px-4 py-3 backdrop-blur">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">Coverage</p>
                  <p className="mt-2 text-xl font-black">{matches.length}</p>
                </div>
                <div className="rounded-[24px] bg-white/12 px-4 py-3 backdrop-blur">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">Destination</p>
                  <p className="mt-2 text-xl font-black">Football</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {message ? (
          <div className="rounded-[24px] border border-brand-100 bg-brand-50/45 px-4 py-3 text-sm text-brand-900">
            {message}
          </div>
        ) : null}

        <section className="rounded-[30px] border border-brand-100/80 bg-white/96 p-4 shadow-soft sm:p-5">
          <SectionHeader
            eyebrow="Football Boards"
            title="Live now, upcoming, and recent finals"
            description="Tracked-club coverage stays grouped here so upcoming Arsenal nights and recent final scores do not disappear into the general feed."
            action={
              <Link
                href="/match/live"
                className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-800 transition hover:bg-brand-100"
              >
                <Radio className="h-3.5 w-3.5" />
                Open live center
              </Link>
            }
          />

          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            <FootballBoard title="Live now" emptyLabel="No live tracked-club matches right now" fixtures={groups.live} />
            <FootballBoard title="Upcoming fixtures" emptyLabel="No upcoming tracked-club fixtures right now" fixtures={groups.upcoming} />
            <FootballBoard title="Recent results" emptyLabel="No recent final scores yet" fixtures={groups.results} />
          </div>
        </section>

        <MatchdayCenter liveMatches={matches} />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <BreakingNow />
          <PremierLeagueStandings />
        </div>
      </div>
    </AppShell>
  );
}
