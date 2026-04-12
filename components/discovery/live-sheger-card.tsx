"use client";

import { useState } from "react";
import { Radio, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

const shegerStation = {
  name: "Sheger 102.1",
  frequency: "102.1 FM",
  city: "Addis Ababa",
  description: "News, talk, and entertainment with a warm city voice.",
  embedUrl: "https://zeno.fm/player/sheger-fm"
};

export function LiveShegerCard({
  compact = false,
  className
}: {
  compact?: boolean;
  className?: string;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <section
      className={cn(
        "relative isolate overflow-hidden rounded-[28px] border border-brand-100 bg-white/96 shadow-soft",
        compact ? "p-4" : "p-5",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">
            Live On Air
          </p>
          <h3 className="mt-1 text-lg font-black tracking-tight text-ink">{shegerStation.name}</h3>
          <p className="mt-1 text-sm text-stone-500">
            {shegerStation.frequency} / {shegerStation.city}
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-[11px] font-semibold text-brand-800">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Live
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-stone-600">{shegerStation.description}</p>

      <div className="mt-4 rounded-[22px] border border-brand-100 bg-stone-100 p-2">
        <div className="relative overflow-hidden rounded-[18px] bg-white" style={{ height: compact ? 150 : 176 }}>
          {isLoading ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-white/92 text-sm text-stone-600">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
              Loading Sheger FM...
            </div>
          ) : null}
          {hasError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-5 text-center text-sm text-stone-600">
              <Radio className="h-5 w-5 text-brand-700" />
              The live widget could not load right now.
            </div>
          ) : null}
          <iframe
            title="Sheger 102.1 live player"
            src={shegerStation.embedUrl}
            className="relative z-0 h-full w-full border-0"
            loading="lazy"
            allow="autoplay; encrypted-media"
            onLoad={() => {
              setIsLoading(false);
              setHasError(false);
            }}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-stone-500">
        <Volume2 className="h-4 w-4 text-brand-700" />
        Embedded player is isolated inside this card so the rest of the page stays fully clickable.
      </div>
    </section>
  );
}
