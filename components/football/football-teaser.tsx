"use client";

import Link from "next/link";
import { ArrowRight, Radio, Shield } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { getFeaturedMatch, getMatchdayGroups } from "@/services/matchday-service";
import { LiveMatch } from "@/types";

function getTeaserHeadline(match: ReturnType<typeof getFeaturedMatch>) {
  if (!match) {
    return "No live matches right now";
  }

  if (match.status === "live") {
    return `${match.homeTeam} ${match.homeScore ?? 0}-${match.awayScore ?? 0} ${match.awayTeam}`;
  }

  if (match.status === "finished") {
    return `FT ${match.homeTeam} ${match.homeScore ?? 0}-${match.awayScore ?? 0} ${match.awayTeam}`;
  }

  return `${match.homeTeam} vs ${match.awayTeam}`;
}

export function FootballTeaser({ liveMatches }: { liveMatches?: LiveMatch[] }) {
  const featured = getFeaturedMatch(liveMatches);
  const groups = getMatchdayGroups(liveMatches);

  return (
    <section className="overflow-hidden rounded-[30px] border border-brand-100/80 bg-white/96 p-4 shadow-soft sm:p-5">
      <SectionHeader
        eyebrow="Football"
        title="Tracked clubs have a real home now"
        description="Use the dedicated Football page for live matches, upcoming fixtures, recent finals, the table, and breaking headlines."
        action={
          <Link
            href="/football"
            className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-800 transition hover:bg-brand-100"
          >
            <Shield className="h-3.5 w-3.5" />
            Open football
          </Link>
        }
      />

      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="rounded-[26px] bg-gradient-to-r from-red-600 via-orange-400 to-brand-500 px-4 py-4 text-white sm:px-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/75">
            Featured fixture
          </p>
          <p className="mt-2 text-lg font-black tracking-tight">{getTeaserHeadline(featured)}</p>
          <p className="mt-2 text-sm text-white/88">
            {featured
              ? featured.status === "live"
                ? "Follow the live score and jump into reactions."
                : featured.status === "finished"
                  ? "Catch the final score, then open the full football destination."
                  : "The next tracked-club fixture is waiting on the Football page."
              : "As soon as tracked-club football coverage is available, it will appear here."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/football"
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-800 shadow-soft transition hover:bg-brand-50"
            >
              Open Football
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/match/live"
              className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              <Radio className="h-4 w-4" />
              Live center
            </Link>
          </div>
        </div>

        <div className="rounded-[24px] border border-brand-100/80 bg-brand-50/35 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
            Quick pulse
          </p>
          <div className="mt-3 space-y-3">
            <div className="rounded-[20px] bg-white/90 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">Live now</p>
              <p className="mt-1 text-sm font-bold text-ink">{groups.live.length}</p>
            </div>
            <div className="rounded-[20px] bg-white/90 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">Upcoming</p>
              <p className="mt-1 text-sm font-bold text-ink">{groups.upcoming.length}</p>
            </div>
            <div className="rounded-[20px] bg-white/90 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">Recent FT</p>
              <p className="mt-1 text-sm font-bold text-ink">{groups.results.length}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
