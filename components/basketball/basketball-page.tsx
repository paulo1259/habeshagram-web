"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Activity, ArrowRight, Dribbble, TimerReset, Trophy } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { fetchBasketballLive, fetchBasketballStandings } from "@/services/basketball-client-service";
import { BasketballLiveMatch } from "@/services/basketball-service";
import { LeagueStandingRow } from "@/types";

function getScoreLine(match: BasketballLiveMatch) {
  if (match.status === "UPCOMING") {
    return `${match.homeTeam} vs ${match.awayTeam}`;
  }

  if (match.status === "FT") {
    return `FT ${match.homeTeam} ${match.homeScore}-${match.awayScore} ${match.awayTeam}`;
  }

  return `${match.homeTeam} ${match.homeScore}-${match.awayScore} ${match.awayTeam}`;
}

function statusAccent(status: BasketballLiveMatch["status"]) {
  if (status === "LIVE") {
    return "bg-red-500 text-white";
  }

  if (status === "HT") {
    return "bg-orange-500 text-white";
  }

  if (status === "FT") {
    return "bg-stone-900 text-white";
  }

  return "bg-brand-500 text-white";
}

function MatchBucket({
  title,
  description,
  matches,
  isLoading
}: {
  title: string;
  description: string;
  matches: BasketballLiveMatch[];
  isLoading: boolean;
}) {
  return (
    <section className="surface-panel p-4 sm:p-5">
      <SectionHeader eyebrow="Basketball" title={title} description={description} />

      {isLoading ? (
        <div className="mt-4 space-y-3">
          {[1, 2].map((item) => (
            <div key={item} className="rounded-[24px] border border-brand-100/80 bg-brand-50/40 px-4 py-4">
              <div className="h-4 w-1/4 animate-pulse rounded-full bg-brand-100" />
              <div className="mt-3 h-5 animate-pulse rounded-full bg-brand-100" />
              <div className="mt-3 h-4 w-2/3 animate-pulse rounded-full bg-brand-100" />
            </div>
          ))}
        </div>
      ) : matches.length ? (
        <div className="mt-4 space-y-3">
          {matches.map((match) => (
            <article key={match.id} className="surface-card px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${statusAccent(match.status)}`}>
                    {match.status}
                  </span>
                  <span className="text-xs font-medium uppercase tracking-[0.14em] text-stone-500">
                    {match.matchClock}
                  </span>
                </div>
                <p className="text-xs font-medium text-stone-500">{match.venue}</p>
              </div>

              <p className="mt-3 text-lg font-black tracking-tight text-ink">{getScoreLine(match)}</p>
              <p className="mt-2 text-sm text-stone-600">
                {match.league}
                {match.country ? ` · ${match.country}` : ""}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-4">
          <EmptyState title={`No ${title.toLowerCase()} right now`} description={description} />
        </div>
      )}
    </section>
  );
}

function BasketballStandingsCard({
  rows,
  isLoading,
  message
}: {
  rows: LeagueStandingRow[];
  isLoading: boolean;
  message: string;
}) {
  const visibleRows = rows.slice(0, 10);
  const isPlanLimited = message.toLowerCase().includes("does not include standings access");

  return (
    <section className="surface-panel p-4 sm:p-5">
      <SectionHeader
        eyebrow="Table Watch"
        title="Basketball standings"
        description="A compact table view from the configured basketball data source so the section stays familiar and easy to scan."
      />

      {message ? (
        <div className="mt-3 rounded-[20px] border border-brand-100 bg-brand-50/45 px-4 py-3 text-sm text-brand-900">
          {message}
        </div>
      ) : null}

      {isLoading ? (
        <div className="mt-4 overflow-hidden rounded-[24px] border border-brand-100/80">
          <div className="grid grid-cols-[2.25rem_minmax(0,1fr)_3rem_3rem_3rem] bg-brand-50/60 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
            <span>Pos</span>
            <span>Team</span>
            <span className="text-right">P</span>
            <span className="text-right">Diff</span>
            <span className="text-right">Pts</span>
          </div>
          <div className="divide-y divide-brand-100/70 bg-white">
            {[1, 2, 3, 4, 5].map((row) => (
              <div key={row} className="grid grid-cols-[2.25rem_minmax(0,1fr)_3rem_3rem_3rem] px-3 py-3">
                <div className="h-4 w-4 animate-pulse rounded-full bg-brand-100" />
                <div className="h-4 animate-pulse rounded-full bg-brand-100" />
                <div className="ml-auto h-4 w-6 animate-pulse rounded-full bg-brand-100" />
                <div className="ml-auto h-4 w-6 animate-pulse rounded-full bg-brand-100" />
                <div className="ml-auto h-4 w-6 animate-pulse rounded-full bg-brand-100" />
              </div>
            ))}
          </div>
        </div>
      ) : isPlanLimited ? (
        <div className="mt-4 rounded-[24px] border border-brand-100/80 bg-white px-4 py-5">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-brand-50 p-2 text-brand-800">
              <Trophy className="h-4 w-4" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-ink">Standings are available when your BALldontlie plan includes NBA table access.</p>
              <p className="text-sm leading-6 text-stone-600">
                Live games, upcoming tip-offs, and recent finals still work through the current basketball integration. If you stay on the free tier, this page now keeps standings intentionally hidden instead of showing a broken-looking empty table.
              </p>
            </div>
          </div>
        </div>
      ) : visibleRows.length ? (
        <div className="mt-4 overflow-hidden rounded-[24px] border border-brand-100/80">
          <div className="grid grid-cols-[2.25rem_minmax(0,1fr)_3rem_3rem_3rem] bg-brand-50/60 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
            <span>Pos</span>
            <span>Team</span>
            <span className="text-right">P</span>
            <span className="text-right">Diff</span>
            <span className="text-right">Pts</span>
          </div>
          <div className="divide-y divide-brand-100/70 bg-white">
            {visibleRows.map((row) => (
              <div
                key={`${row.position}-${row.team}`}
                className="grid grid-cols-[2.25rem_minmax(0,1fr)_3rem_3rem_3rem] items-center px-3 py-3 text-sm text-stone-700"
              >
                <span className="font-semibold text-stone-500">{row.position}</span>
                <div className="min-w-0">
                  <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-brand-100 bg-brand-50/70 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-brand-800">
                    <Trophy className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{row.team}</span>
                  </span>
                </div>
                <span className="text-right text-stone-500">{row.played}</span>
                <span className="text-right text-stone-500">{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</span>
                <span className="text-right font-bold text-ink">{row.points}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <EmptyState title="No basketball standings yet" description="The standings route is live, but it does not have rows from the configured league right now." />
        </div>
      )}
    </section>
  );
}

export function BasketballPage() {
  const [matches, setMatches] = useState<BasketballLiveMatch[]>([]);
  const [rows, setRows] = useState<LeagueStandingRow[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const [standingsLoading, setStandingsLoading] = useState(true);
  const [liveMessage, setLiveMessage] = useState("");
  const [standingsMessage, setStandingsMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      const [livePayload, standingsPayload] = await Promise.all([fetchBasketballLive(), fetchBasketballStandings()]);

      if (!isMounted) {
        return;
      }

      setMatches(livePayload.matches);
      setRows(standingsPayload.standings);
      setLiveMessage(livePayload.message ?? "");
      setStandingsMessage(standingsPayload.message ?? "");
      setMatchesLoading(false);
      setStandingsLoading(false);
    };

    void load();
    const interval = window.setInterval(() => {
      void load();
    }, 30000);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const liveGames = useMemo(() => matches.filter((match) => match.status === "LIVE" || match.status === "HT"), [matches]);
  const upcomingGames = useMemo(() => matches.filter((match) => match.status === "UPCOMING"), [matches]);
  const finalGames = useMemo(() => matches.filter((match) => match.status === "FT"), [matches]);

  return (
    <AppShell>
      <div className="page-stack">
        <section className="page-hero border-b border-brand-100/80 bg-white/96 sm:border">
          <div className="bg-gradient-to-br from-orange-500 via-brand-500 to-rose-500 px-4 py-5 text-white sm:px-6 sm:py-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">Basketball</p>
                <h1 className="page-title mt-1">Live hoops, same HabeshaGram feel</h1>
                <p className="mt-3 text-sm leading-6 text-white/90 sm:text-[15px]">
                  A dedicated basketball zone powered by the new internal routes, with live scoreboards, upcoming tip-offs, recent finals, and a compact table watch.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-white/95">
                    <Activity className="h-3.5 w-3.5" />
                    {liveGames.length} live now
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-white/95">
                    <Dribbble className="h-3.5 w-3.5" />
                    {matches.length} games loaded
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:min-w-[17rem]">
                <div className="rounded-[24px] bg-white/12 px-4 py-3 backdrop-blur">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">Standings rows</p>
                  <p className="mt-2 text-xl font-black">{rows.length}</p>
                </div>
                <div className="rounded-[24px] bg-white/12 px-4 py-3 backdrop-blur">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">Refresh loop</p>
                  <p className="mt-2 text-xl font-black">30s</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_23rem]">
          <div className="space-y-4">
            {liveMessage ? (
              <div className="rounded-[24px] border border-brand-100 bg-brand-50/45 px-4 py-3 text-sm text-brand-900">
                {liveMessage}
              </div>
            ) : null}

            <MatchBucket
              title="Live games"
              description="Games already in progress show up here first, so the page feels immediate when basketball is active."
              matches={liveGames}
              isLoading={matchesLoading}
            />

            <MatchBucket
              title="Upcoming tip-offs"
              description="Scheduled games stay visible in the same card rhythm, so users can scan what is next without leaving the section."
              matches={upcomingGames}
              isLoading={matchesLoading}
            />

            <MatchBucket
              title="Recent finals"
              description="Final scores remain visible for a quick after-the-buzzer pulse."
              matches={finalGames}
              isLoading={matchesLoading}
            />
          </div>

          <div className="space-y-4">
            <BasketballStandingsCard rows={rows} isLoading={standingsLoading} message={standingsMessage} />

            <section className="surface-panel p-4 sm:p-5">
              <SectionHeader
                eyebrow="What this section does"
                title="Basketball without a new UI system"
                description="This page reuses the same HabeshaGram sports language: warm cards, compact tables, fast scanning, and server-backed routes."
              />
              <div className="mt-4 space-y-3">
                <div className="rounded-[24px] bg-brand-50/60 px-4 py-3">
                  <div className="flex items-center gap-2 text-brand-800">
                    <TimerReset className="h-4 w-4" />
                    <p className="text-xs font-semibold uppercase tracking-[0.14em]">Server only</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-stone-700">
                    The browser only talks to internal HabeshaGram routes. The basketball API key stays on the server.
                  </p>
                </div>
                <Link
                  href="/match/live"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-brand-800 transition hover:text-brand-900"
                >
                  Football live center still lives here
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
