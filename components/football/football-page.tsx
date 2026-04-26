"use client";

import Link from "next/link";
import { Activity, ArrowRight, Radio, Shield, Trophy } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { BreakingNow } from "@/components/discovery/breaking-now";
import { PremierLeagueStandings } from "@/components/discovery/premier-league-standings";
import { SectionHeader } from "@/components/ui/section-header";
import { ShareActions } from "@/components/ui/share-actions";
import { useAppData } from "@/hooks/use-app-data";
import { useLiveMatchPulse } from "@/hooks/use-live-match-pulse";
import { getMatchdayGroups } from "@/services/matchday-service";
import { footballTeams, getTeamSlug } from "@/services/football-hub-data";
import { FootballTeam, LiveMatch } from "@/types";

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
    <section className="surface-card px-4 py-4">
      <p className="meta-label text-stone-500">{title}</p>
      <div className="mt-3 space-y-3">
        {fixtures.length ? (
          fixtures.map((fixture) => (
            <article
              key={fixture.id}
              className="surface-card px-4 py-3"
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

function getClubFocusMatch(team: FootballTeam, matches: LiveMatch[]) {
  return matches.find((match) => match.homeTeam === team || match.awayTeam === team) ?? null;
}

function getOpponent(match: LiveMatch, team: FootballTeam) {
  return match.homeTeam === team ? match.awayTeam : match.homeTeam;
}

function getClubFocusCopy(team: FootballTeam, match: LiveMatch | null) {
  if (!match) {
    return {
      badge: "Quiet now",
      headline: `No fixture surfaced yet for ${team}`,
      detail: "Coverage will appear here as soon as the tracked-club window has a match."
    };
  }

  const opponent = getOpponent(match, team);

  if (match.status === "LIVE" || match.status === "HT") {
    return {
      badge: match.status,
      headline: `${team} ${match.homeTeam === team ? match.homeScore : match.awayScore}-${match.homeTeam === team ? match.awayScore : match.homeScore} ${opponent}`,
      detail: `${match.matchClock} | ${match.venue}`
    };
  }

  if (match.status === "FT") {
    return {
      badge: "FT",
      headline: `${team} ${match.homeTeam === team ? match.homeScore : match.awayScore}-${match.homeTeam === team ? match.awayScore : match.homeScore} ${opponent}`,
      detail: `Most recent final score | ${match.venue}`
    };
  }

  return {
    badge: "Next up",
    headline: `${team} vs ${opponent}`,
    detail: `${match.matchClock} | ${match.venue}`
  };
}

export function FootballPage() {
  const { posts } = useAppData();
  const { matches, message } = useLiveMatchPulse({ posts });
  const groups = getMatchdayGroups(matches);

  return (
    <AppShell>
      <div className="page-stack">
        <section className="page-hero border-b border-brand-100/80 bg-white/96 sm:border">
          <div className="bg-gradient-to-br from-red-600 via-orange-400 to-brand-500 px-4 py-5 text-white sm:px-6 sm:py-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">Football</p>
                <h1 className="page-title mt-1">Football</h1>
                <p className="mt-3 text-sm leading-6 text-white/90 sm:text-[15px]">
                  Tracked-club match coverage, recent finals, the Premier League table, and breaking headlines in one dedicated HabeshaGram destination.
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
                <div className="col-span-2 rounded-[24px] bg-white/12 p-3 backdrop-blur">
                  <ShareActions
                    path="/football"
                    title="Football on HabeshaGram"
                    text="Follow live matches, upcoming fixtures, recent finals, and breaking football news on HabeshaGram."
                  />
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

        <section className="surface-panel p-4 sm:p-5">
          <SectionHeader
            eyebrow="Tracked Clubs"
            title="Arsenal, Man Utd, Chelsea, and Man City at a glance"
            description="Each club gets a prominent current card showing either the next fixture, a live score, or the most recent final result."
          />

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {footballTeams.map((team) => {
              const match = getClubFocusMatch(team, matches);
              const card = getClubFocusCopy(team, match);

              return (
                <Link
                  key={team}
                  href={`/football/${getTeamSlug(team)}`}
                  className="rounded-[24px] border border-brand-100/80 bg-gradient-to-br from-white via-white to-brand-50/35 px-4 py-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-800">
                    {card.badge}
                  </span>
                  <p className="mt-3 text-lg font-black tracking-tight text-ink">{team}</p>
                  <p className="mt-2 text-sm font-bold leading-6 text-ink">{card.headline}</p>
                  <p className="mt-2 text-sm leading-6 text-stone-600">{card.detail}</p>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="surface-panel p-4 sm:p-5">
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

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <PremierLeagueStandings />
          <BreakingNow />
        </div>
      </div>
    </AppShell>
  );
}
