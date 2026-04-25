"use client";

import Link from "next/link";
import { Headphones, Radio, Volume2 } from "lucide-react";
import { radioStations } from "@/services/discovery-data";
import { cn } from "@/lib/utils";

export function RadioTeaser({ compact = false }: { compact?: boolean }) {
  const featuredStation = radioStations.find((station) => station.featured) ?? radioStations[0];

  if (!featuredStation) {
    return null;
  }

  return (
    <section
      className={cn(
        "overflow-hidden rounded-[28px] border border-brand-100/80 bg-white/96 shadow-soft",
        compact ? "p-4" : "p-4 sm:p-5"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">
            Radio
          </p>
          <h3 className="mt-1 text-lg font-black tracking-tight text-ink">
            {featuredStation.name}
          </h3>
          <p className="mt-1 text-sm text-stone-500">
            {featuredStation.frequency} / {featuredStation.city}
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-[11px] font-semibold text-brand-800">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Featured
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-stone-600">
        {compact
          ? "Open the full Radio page to browse every station and play it inside its own card."
          : "Radio now has its own dedicated place. Browse every station there and play each one directly inside its own card."}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-stone-500">
        <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1.5">
          <Radio className="h-3.5 w-3.5 text-brand-700" />
          {radioStations.length} stations
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1.5">
          <Headphones className="h-3.5 w-3.5 text-brand-700" />
          In-card players
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1.5">
          <Volume2 className="h-3.5 w-3.5 text-brand-700" />
          Widget + stream support
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Link
          href="/radio"
          className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-brand-500 to-orange-400 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:brightness-105"
        >
          Open Radio
        </Link>
        {!compact ? (
          <p className="text-sm text-stone-500">
            Less clutter on the homepage, full radio experience on its own page.
          </p>
        ) : null}
      </div>
    </section>
  );
}
