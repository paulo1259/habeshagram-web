"use client";

import Link from "next/link";
import { Headphones, Pause, Play, Radio, Volume2 } from "lucide-react";
import { radioStations } from "@/services/discovery-data";
import { cn } from "@/lib/utils";
import { useRadio } from "@/hooks/use-radio";
import { logEvent } from "@/lib/analytics-events";

export function RadioTeaser({ compact = false }: { compact?: boolean }) {
  const featuredStation = radioStations.find((station) => station.featured) ?? radioStations[0];
  const quickPlayStation = radioStations.find(
    (station) => station.playbackMode === "stream" && station.streamUrl
  );
  const { station: activeStation, isPlaying, playStation, togglePlayback } = useRadio();

  if (!featuredStation) {
    return null;
  }

  return (
    <section
      className={cn(
        "overflow-hidden rounded-[28px] border border-brand-100/80 bg-card/96 shadow-soft",
        compact ? "p-4" : "p-4 sm:p-5"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">
            Radio
          </p>
          <h3 className="mt-1 text-lg font-black tracking-tight text-ink">Live stations, one place</h3>
          <p className="mt-1 text-sm text-stone-500">
            Featured now: {featuredStation.name}
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-[11px] font-semibold text-brand-800">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Radio
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-stone-600">
        {compact
          ? "Start a live stream and keep listening while you browse the rest of HabeshaGram."
          : "Radio now has a persistent global player with background playback, station switching, volume, reconnect, and device media controls."}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-stone-500">
        <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1.5">
          <Radio className="h-3.5 w-3.5 text-brand-700" />
          {radioStations.length} stations
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1.5">
          <Headphones className="h-3.5 w-3.5 text-brand-700" />
          Persistent player
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1.5">
          <Volume2 className="h-3.5 w-3.5 text-brand-700" />
          Background-ready streams
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {quickPlayStation ? (
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-brand-500 to-orange-400 px-4 py-2 text-sm font-semibold text-brand-950 shadow-soft transition hover:brightness-105"
            onClick={() => {
              if (activeStation?.id === quickPlayStation.id) {
                void togglePlayback();
              } else {
                logEvent("radio_play");
                void playStation(quickPlayStation);
              }
            }}
          >
            {activeStation?.id === quickPlayStation.id && isPlaying ? (
              <Pause className="mr-2 h-4 w-4 fill-current" />
            ) : (
              <Play className="mr-2 h-4 w-4 fill-current" />
            )}
            {activeStation?.id === quickPlayStation.id && isPlaying
              ? "Pause radio"
              : `Play ${quickPlayStation.name}`}
          </button>
        ) : null}
        <Link
          href="/radio"
          className="inline-flex items-center justify-center rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-800 transition hover:bg-brand-100"
        >
          Open Radio
        </Link>
        {!compact ? (
          <p className="text-sm text-stone-500">
            Playback continues when you leave the Radio page.
          </p>
        ) : null}
      </div>
    </section>
  );
}
