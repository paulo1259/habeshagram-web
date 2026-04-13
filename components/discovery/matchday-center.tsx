"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BellRing, ChevronRight, Radio, Sparkles, Trophy } from "lucide-react";
import { useAppData } from "@/hooks/use-app-data";
import { formatDate } from "@/lib/utils";
import { getTeamSlug } from "@/services/football-hub-data";
import {
  formatFixtureTime,
  formatKickoffCountdown,
  getMatchdayAlerts,
  getMostActiveFanbaseToday,
  getTodayFixtures
} from "@/services/matchday-service";
import { LiveMatch, MatchdayAlert, MatchdayFixture } from "@/types";

const teamAccent = {
  "Manchester United": "border-red-100 bg-red-50 text-red-700",
  Arsenal: "border-rose-100 bg-rose-50 text-rose-700",
  Chelsea: "border-blue-100 bg-blue-50 text-blue-700",
  "Manchester City": "border-sky-100 bg-sky-50 text-sky-700"
} as const;

const alertAccent: Record<MatchdayAlert["badge"], string> = {
  GOAL: "bg-emerald-500 text-white",
  "RED CARD": "bg-red-500 text-white",
  BREAKING: "bg-stone-900 text-white"
};

function getFixtureStatusCopy(fixture: MatchdayFixture) {
  if (fixture.status === "live") {
    return "Live now";
  }
  if (fixture.status === "finished") {
    return "Finished";
  }
  return formatKickoffCountdown(fixture.kickoffAt);
}

export function MatchdayCenter({
  compact = false,
  liveMatches
}: {
  compact?: boolean;
  liveMatches?: LiveMatch[];
}) {
  const { posts } = useAppData();
  const [alerts, setAlerts] = useState<MatchdayAlert[]>(() => getMatchdayAlerts());
  const [activeAlertIndex, setActiveAlertIndex] = useState(0);

  const fixtures = useMemo(() => getTodayFixtures(liveMatches), [liveMatches]);
  const featuredFixture = fixtures[0] ?? null;
  const activeFanbase = useMemo(() => getMostActiveFanbaseToday(posts, liveMatches), [liveMatches, posts]);
  const activeAlert = alerts[activeAlertIndex] ?? null;

  useEffect(() => {
    setAlerts(getMatchdayAlerts());
  }, []);

  useEffect(() => {
    if (alerts.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveAlertIndex((current) => (current + 1) % alerts.length);
    }, 7000);

    return () => window.clearInterval(interval);
  }, [alerts]);

  const visibleFixtures = fixtures.slice(0, compact ? 3 : 4);

  return (
    <section className={`rounded-[30px] border border-brand-100/80 bg-white/96 shadow-soft ${compact ? "p-4" : "p-4 sm:p-5"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">
            Matchday Center
          </p>
          <h3 className="mt-1 text-xl font-black tracking-tight text-ink">
            {compact ? "Today’s football pulse" : "Everything shaping football day on HabeshaGram"}
          </h3>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            {compact
              ? "Quick football energy in one glance."
              : "Kickoff countdowns, live moments, fan heat, and easy entry points into reactions and fan zones."}
          </p>
        </div>
        {!compact ? (
          <Link
            href="/match/live"
            className="inline-flex shrink-0 items-center rounded-full bg-brand-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-800 transition hover:bg-brand-100"
          >
            Match center
          </Link>
        ) : null}
      </div>

      {activeAlert ? (
        <div className="mt-4 rounded-[24px] border border-brand-100/80 bg-gradient-to-r from-white via-white to-orange-50/60 px-4 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${alertAccent[activeAlert.badge]}`}>
              {activeAlert.badge}
            </span>
            <span className="text-xs font-medium text-stone-500">{formatDate(activeAlert.timestamp)}</span>
          </div>
          <p className="mt-3 text-sm font-bold leading-6 text-ink sm:text-[15px]">{activeAlert.headline}</p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm leading-6 text-stone-600">{activeAlert.detail}</p>
            <Link
              href={activeAlert.team ? `/football/${getTeamSlug(activeAlert.team)}` : "/match/live"}
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-800 transition hover:text-brand-900"
            >
              Open now
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      ) : null}

      {featuredFixture ? (
        <div className="mt-4 rounded-[26px] border border-brand-100/80 bg-gradient-to-br from-brand-600 via-orange-400 to-rose-400 p-4 text-white sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]">
              {featuredFixture.status === "live" ? "Live spotlight" : "Kickoff watch"}
            </span>
            <span className="text-xs font-medium text-white/80">{featuredFixture.venue}</span>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-lg font-black tracking-tight">
                {featuredFixture.homeTeam} vs {featuredFixture.awayTeam}
              </p>
              <p className="mt-2 text-sm text-white/90">
                {featuredFixture.status === "live" || featuredFixture.status === "finished"
                  ? `${featuredFixture.homeScore ?? 0} - ${featuredFixture.awayScore ?? 0}`
                  : `Tonight at ${formatFixtureTime(featuredFixture.kickoffAt)}`}
              </p>
            </div>
            <div className="rounded-[22px] bg-white/15 px-4 py-3 text-right backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/75">
                Status
              </p>
              <p className="mt-2 text-base font-black">{getFixtureStatusCopy(featuredFixture)}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/match/live"
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-800 transition hover:bg-brand-50"
            >
              <Radio className="h-3.5 w-3.5" />
              Join live reactions
            </Link>
            <Link
              href={`/football/${getTeamSlug(featuredFixture.homeTeam)}`}
              className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-white/20"
            >
              <Trophy className="h-3.5 w-3.5" />
              Enter fan zone
            </Link>
            <Link
              href={`/create?text=${encodeURIComponent(`Matchday take on ${featuredFixture.homeTeam} vs ${featuredFixture.awayTeam}: #HabeshaFootball`)}`}
              className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-white/20"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Post your take
            </Link>
          </div>
        </div>
      ) : null}

      <div className={`mt-4 grid gap-3 ${compact ? "" : "lg:grid-cols-[minmax(0,1fr)_18rem]"}`}>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Today’s key fixtures</p>
            <Link href="/match/live" className="text-xs font-semibold text-brand-800 transition hover:text-brand-900">
              View all
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {visibleFixtures.map((fixture) => (
              <article
                key={fixture.id}
                className="rounded-[24px] border border-brand-100/80 bg-brand-50/35 px-4 py-4 transition hover:-translate-y-0.5 hover:shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
                    {fixture.status}
                  </span>
                  <span className="text-xs font-medium text-stone-500">{formatFixtureTime(fixture.kickoffAt)}</span>
                </div>
                <p className="mt-3 text-sm font-bold leading-6 text-ink">
                  {fixture.homeTeam} vs {fixture.awayTeam}
                </p>
                <p className="mt-2 text-sm text-stone-600">
                  {fixture.status === "upcoming"
                    ? getFixtureStatusCopy(fixture)
                    : `${fixture.homeScore ?? 0} - ${fixture.awayScore ?? 0}`}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={fixture.status === "live" ? "/match/live" : `/football/${getTeamSlug(fixture.homeTeam)}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-800 transition hover:text-brand-900"
                  >
                    {fixture.status === "live" ? "Join live" : "Fan zone"}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] border border-brand-100/80 bg-white px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
            Most active fanbase today
          </p>
          {activeFanbase ? (
            <div className="mt-3 space-y-3">
              <Link
                href={`/football/${getTeamSlug(activeFanbase.team)}`}
                className={`block rounded-[22px] border px-4 py-4 transition hover:-translate-y-0.5 hover:shadow-sm ${teamAccent[activeFanbase.team]}`}
              >
                <p className="text-sm font-bold">{activeFanbase.team}</p>
                <p className="mt-2 text-sm">
                  {activeFanbase.activityCount} team-tagged posts are driving the day so far.
                </p>
              </Link>
              <p className="text-xs leading-5 text-stone-500">
                Based on today’s recent team-tagged post activity from the live HabeshaGram feed.
              </p>
            </div>
          ) : (
            <div className="mt-3 rounded-[22px] bg-brand-50/40 px-4 py-4">
              <p className="text-sm leading-6 text-stone-600">
                Team-tagged posts will crown today’s loudest fanbase once the timeline heats up.
              </p>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/match/live"
              className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-800 transition hover:bg-brand-100"
            >
              <BellRing className="h-3.5 w-3.5" />
              Join live reactions
            </Link>
            <Link
              href="/create?text=%23HabeshaFootball"
              className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-orange-700 transition hover:bg-orange-100"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Post your take
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
