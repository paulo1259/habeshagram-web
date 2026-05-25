"use client";

import Link from "next/link";
import { Globe2 } from "lucide-react";
import { worldCupPromo } from "@/services/mma-hub-data";

export function WorldCupBanner() {
  if (!worldCupPromo.enabled) {
    return null;
  }

  return (
    <section className="overflow-hidden rounded-[28px] border border-brand-100/80 bg-gradient-to-r from-white via-brand-50/70 to-orange-50/80 p-4 shadow-soft sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">
            {worldCupPromo.statusLabel}
          </p>
          <h3 className="mt-1 text-lg font-black tracking-tight text-ink">{worldCupPromo.title}</h3>
          <p className="mt-2 text-sm leading-6 text-stone-600">{worldCupPromo.subtitle}</p>
          <p className="mt-2 text-sm leading-6 text-stone-500">{worldCupPromo.body}</p>
        </div>
        <Link
          href={worldCupPromo.href}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-800 shadow-soft transition hover:bg-brand-50"
        >
          <Globe2 className="h-4 w-4" />
          Open World Cup hub
        </Link>
      </div>
    </section>
  );
}
