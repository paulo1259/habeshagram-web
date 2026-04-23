"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { SectionHeader } from "@/components/ui/section-header";
import { fetchStandings } from "@/services/standings-service";
import { getTeamSlug } from "@/services/football-hub-data";
import { FootballTeam, LeagueStandingRow } from "@/types";

const trackedAccent: Record<FootballTeam, string> = {
  "Manchester United": "bg-red-50 text-red-700 border-red-100",
  Arsenal: "bg-rose-50 text-rose-700 border-rose-100",
  Chelsea: "bg-blue-50 text-blue-700 border-blue-100",
  "Manchester City": "bg-sky-50 text-sky-700 border-sky-100"
};

export function PremierLeagueStandings({ compact = false }: { compact?: boolean }) {
  const [rows, setRows] = useState<LeagueStandingRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadStandings = async () => {
      try {
        const payload = await fetchStandings();
        if (!isMounted) {
          return;
        }

        setRows(payload.standings);
        setMessage(payload.message ?? "");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadStandings();
  }, []);

  const visibleRows = rows.slice(0, compact ? 6 : 8);

  return (
    <section className={`rounded-[30px] border border-brand-100/80 bg-white/96 shadow-soft ${compact ? "p-4" : "p-4 sm:p-5"}`}>
      <SectionHeader
        eyebrow="Premier League"
        title="Table watch"
        description={compact ? "Quick table pulse." : "Compact standings for the clubs shaping the conversation."}
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
            <span className="text-right">GD</span>
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
      ) : visibleRows.length ? (
        <div className="mt-4 overflow-hidden rounded-[24px] border border-brand-100/80">
          <div className="grid grid-cols-[2.25rem_minmax(0,1fr)_3rem_3rem_3rem] bg-brand-50/60 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">
            <span>Pos</span>
            <span>Team</span>
            <span className="text-right">P</span>
            <span className="text-right">GD</span>
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
                  {row.teamTag ? (
                    <Link
                      href={`/football/${getTeamSlug(row.teamTag)}`}
                      className={`inline-flex max-w-full items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${trackedAccent[row.teamTag]}`}
                    >
                      <Trophy className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{row.team}</span>
                    </Link>
                  ) : (
                    <span className="truncate font-medium">{row.team}</span>
                  )}
                </div>
                <span className="text-right text-stone-500">{row.played}</span>
                <span className="text-right text-stone-500">{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</span>
                <span className="text-right font-bold text-ink">{row.points}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-[24px] border border-dashed border-brand-200 bg-white/80 px-4 py-5 text-sm leading-6 text-stone-600">
          No Premier League standings are available right now.
        </div>
      )}
    </section>
  );
}
