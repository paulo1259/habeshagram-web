"use client";

import Link from "next/link";
import { Flame, Mic2, Swords } from "lucide-react";
import { mmaHub } from "@/services/mma-hub-data";

export function MMATeaser() {
  const featured = mmaHub.featuredFight;

  return (
    <section className="overflow-hidden rounded-[28px] border border-brand-100/80 bg-white/96 p-4 shadow-soft sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">MMA</p>
          <h3 className="mt-1 text-lg font-black tracking-tight text-ink">{featured.headline}</h3>
          <p className="mt-1 text-sm text-stone-500">
            {featured.dateLabel} · {featured.venue}
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-[11px] font-semibold text-brand-800">
          <Flame className="h-3.5 w-3.5" />
          Fight week
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-stone-600">{featured.note}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-stone-500">
        <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1.5">
          <Swords className="h-3.5 w-3.5 text-brand-700" />
          {featured.redCorner.name} vs {featured.blueCorner.name}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1.5">
          <Mic2 className="h-3.5 w-3.5 text-brand-700" />
          {mmaHub.liveRooms.length} live rooms queued
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Link
          href="/football"
          className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-brand-500 to-orange-400 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:brightness-105"
        >
          Open MMA hub
        </Link>
        <p className="text-sm text-stone-500">One place for headline fights, recent finishes, and live-room energy.</p>
      </div>
    </section>
  );
}
