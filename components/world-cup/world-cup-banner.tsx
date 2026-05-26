"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Globe2 } from "lucide-react";
import {
  buildCountdown,
  getTeamById,
  getUpcomingMatches,
  getUpcomingMatchesForFavorites,
  isTournamentLive,
  loadFavorites,
  worldCupConfig,
} from "@/services/world-cup-data";

export function WorldCupBanner() {
  const openingMatchAt = worldCupConfig.openingMatchAt;
  const target = useMemo(() => new Date(openingMatchAt), [openingMatchAt]);
  const [cd, setCd] = useState(() => buildCountdown(target));
  const [isLive, setIsLive] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
    setFavoriteIds(loadFavorites());
    setIsLive(isTournamentLive());

    const timer = setInterval(() => {
      setCd(buildCountdown(target));
      setIsLive(isTournamentLive());
    }, 1000);

    return () => clearInterval(timer);
  }, [target]);

  if (!worldCupConfig.enabled) return null;

  const favMatch =
    favoriteIds.length > 0 ? getUpcomingMatchesForFavorites(favoriteIds, 1)[0] : undefined;
  const nextMatch = favMatch ?? getUpcomingMatches(1)[0];
  const hasFav = Boolean(favMatch);

  const teamA = nextMatch ? getTeamById(nextMatch.teamAId) : undefined;
  const teamB = nextMatch ? getTeamById(nextMatch.teamBId) : undefined;

  return (
    <section className="overflow-hidden rounded-[28px] border border-brand-100/80 bg-gradient-to-r from-brand-700 via-brand-600 to-orange-500 px-4 py-4 text-white shadow-soft sm:px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
            FIFA World Cup 2026
          </p>

          {isLive ? (
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
              <p className="text-lg font-black tracking-tight">Matchday mode is live</p>
            </div>
          ) : (
            <p className="text-lg font-black tracking-tight tabular-nums">
              Opens in {cd.days}d {String(cd.hours).padStart(2, "0")}h{" "}
              {String(cd.minutes).padStart(2, "0")}m {String(cd.seconds).padStart(2, "0")}s
            </p>
          )}

          {nextMatch && teamA && teamB ? (
            <div className="flex items-center gap-1.5 text-xs text-white/80">
              {hasFav ? (
                <span className="font-semibold text-amber-300">Your team:</span>
              ) : (
                <span className="font-semibold">Next:</span>
              )}
              <span>{teamA.flag} {teamA.code}</span>
              <span className="text-white/50">vs</span>
              <span>{teamB.flag} {teamB.code}</span>
              <span className="text-white/50">•</span>
              <span>{nextMatch.timeEt}</span>
              <span className="text-white/50">•</span>
              <span>{nextMatch.city}</span>
            </div>
          ) : null}

          <p className="text-xs text-white/60">
            Mexico • Canada • USA • 48 teams • Jun 11 - Jul 19
          </p>
        </div>

        <Link
          href="/world-cup"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-800 shadow-soft transition hover:bg-brand-50"
        >
          <Globe2 className="h-4 w-4" />
          {isLive ? "Today's matches" : "Open hub"}
        </Link>
      </div>
    </section>
  );
}
