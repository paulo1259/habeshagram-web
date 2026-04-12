"use client";

import { Headphones, Radio } from "lucide-react";
import { RadioStation } from "@/types";
import { cn } from "@/lib/utils";

export function RadioStationCard({
  station,
  compact = false,
  isSelected = false,
  onSelect
}: {
  station: RadioStation;
  compact?: boolean;
  isSelected?: boolean;
  onSelect?: (station: RadioStation) => void;
}) {
  const statusText = station.embedUrl
    ? "Loads the live widget in HabeshaGram"
    : station.streamUrl
      ? "Uses direct audio playback in HabeshaGram"
      : "Shows a playback placeholder until a source is added";

  return (
    <article
      className={`border bg-white/96 shadow-soft ${
        compact
          ? "min-w-[272px] rounded-[26px] p-4"
          : "rounded-[28px] p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
      } ${
        isSelected ? "border-brand-300 ring-2 ring-brand-200/70" : "border-brand-100"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            {station.frequency}
          </p>
          <h3 className="mt-1 text-lg font-bold tracking-tight text-ink">{station.name}</h3>
          <p className="mt-1 text-xs text-stone-500">{station.city}</p>
        </div>
        <div className="rounded-full bg-brand-50 p-2 text-brand-700">
          <Radio className="h-4 w-4" />
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-stone-600">{station.description}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {(station.tags ?? []).map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-brand-50 px-3 py-1 text-[11px] font-medium text-brand-800"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium text-emerald-700">Live</p>
          <p className="text-xs text-stone-500">{statusText}</p>
        </div>
        <button
          type="button"
          onClick={() => onSelect?.(station)}
          className={cn(
            "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-brand-500 px-4 text-sm font-semibold text-white shadow-soft transition duration-150 hover:bg-brand-600 active:scale-[0.98]",
            compact ? "shrink-0" : ""
          )}
        >
          <Headphones className="h-4 w-4" />
          <span className="whitespace-nowrap">Load player</span>
        </button>
      </div>
    </article>
  );
}
