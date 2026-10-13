"use client";

import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useRadio } from "@/hooks/use-radio";
import { useStationHealth } from "@/hooks/use-station-health";
import { stationMeta } from "@/lib/i18n/stations";
import { cn } from "@/lib/utils";
import { radioStations } from "@/services/discovery-data";
import { StationArt } from "@/components/radio/station-art";
import type { RadioStation } from "@/types";

/**
 * A radio tuner for the home page: the FM band from 88 to 108 with each
 * station pinned at its real frequency, and online-only stations in a NET band
 * after it.
 *
 * Several stations sit a fraction of a megahertz apart (96.9, 97.1, 97.6), far
 * too close for a tappable icon each, so the dial works like a real tuner:
 * hovering or dragging moves the needle to the nearest station, the readout
 * shows what you are tuned to, and a tap plays it. The arrows step through
 * stations one at a time for keyboards and precise tuning.
 */

const FM_MIN = 87.5;
const FM_MAX = 108;
// Share of the dial given to the FM band; the rest is the NET band.
const FM_SHARE = 0.74;
const EDGE = 0.03;

function frequencyOf(station: RadioStation): number | null {
  const match = station.frequency.match(/(\d{2,3}(?:\.\d)?)\s*FM/i);
  return match ? Number(match[1]) : null;
}

function fmPosition(mhz: number) {
  return EDGE + ((mhz - FM_MIN) / (FM_MAX - FM_MIN)) * (FM_SHARE - EDGE);
}

type Marker = { station: RadioStation; x: number; mhz: number | null };

export function FrequencyDial({ className }: { className?: string }) {
  const { station: active, isPlaying, status, playStation, togglePlayback } = useRadio();
  const { healthOf } = useStationHealth();
  const { t, lang } = useLanguage();
  const [tunedId, setTunedId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const band = useRef<HTMLDivElement | null>(null);

  // Ordered along the dial: FM by frequency, then the NET band.
  const markers = useMemo<Marker[]>(() => {
    const fm = radioStations
      .map((station) => ({ station, mhz: frequencyOf(station) }))
      .filter((item): item is { station: RadioStation; mhz: number } => item.mhz !== null)
      .sort((a, b) => a.mhz - b.mhz)
      .map(({ station, mhz }) => ({ station, mhz, x: fmPosition(mhz) }));
    const online = radioStations.filter((station) => frequencyOf(station) === null);
    const netStart = FM_SHARE + 0.07;
    const netEnd = 1 - EDGE;
    const net = online.map((station, index) => ({
      station,
      mhz: null,
      x: online.length === 1 ? (netStart + netEnd) / 2 : netStart + (index / (online.length - 1)) * (netEnd - netStart)
    }));
    return [...fm, ...net];
  }, []);

  const ticks = useMemo(() => {
    const list: Array<{ x: number; major: boolean; label?: string }> = [];
    for (let mhz = 88; mhz <= 108; mhz += 0.5) {
      const major = mhz % 4 === 0;
      list.push({ x: fmPosition(mhz), major, label: major ? String(mhz) : undefined });
    }
    return list;
  }, []);

  const featured = radioStations.find((station) => station.featured) ?? radioStations[0];
  const tuned = markers.find((marker) => marker.station.id === (tunedId ?? active?.id ?? featured.id)) ?? markers[0];
  const tunedIsActive = active?.id === tuned.station.id;
  const tunedLive = tunedIsActive && isPlaying;
  const tunedBusy = tunedIsActive && (status === "loading" || status === "reconnecting");

  const nearestAt = (clientX: number) => {
    const rect = band.current?.getBoundingClientRect();
    if (!rect) return tuned;
    const x = (clientX - rect.left) / rect.width;
    return markers.reduce((best, marker) => (Math.abs(marker.x - x) < Math.abs(best.x - x) ? marker : best));
  };

  const play = (station: RadioStation) => void (active?.id === station.id ? togglePlayback() : playStation(station));

  const step = (direction: 1 | -1) => {
    const index = markers.indexOf(tuned);
    const next = markers[(index + direction + markers.length) % markers.length];
    setTunedId(next.station.id);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" || dragging) setTunedId(nearestAt(event.clientX).station.id);
  };

  return (
    <div className={cn("select-none", className)}>
      {/* readout */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => play(tuned.station)}
          aria-label={t(tunedLive ? "radio.pauseName" : "radio.playName", { name: tuned.station.name })}
          className="group relative shrink-0 rounded-[14px] transition active:scale-95"
        >
          <StationArt station={tuned.station} size={48} live={tunedLive} rounded="rounded-[14px]" />
          <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-surface shadow-soft ring-2 ring-card">
            {tunedBusy ? (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-surface/25 border-t-surface" />
            ) : tunedLive ? (
              <Pause className="h-3 w-3 fill-current" />
            ) : (
              <Play className="ml-[1px] h-3 w-3 fill-current" />
            )}
          </span>
        </button>
        <div className="min-w-0 flex-1" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={tuned.station.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16 }}
            >
              <p className="flex items-center gap-2 truncate font-display text-[15px] font-semibold text-ink">
                <span className="truncate">{tuned.station.name}</span>
                {healthOf(tuned.station.id) ? (
                  <span
                    className={cn(
                      "h-1.5 w-1.5 shrink-0 rounded-full",
                      healthOf(tuned.station.id) === "online" ? "bg-emerald-500" : "bg-stone-500"
                    )}
                  />
                ) : null}
              </p>
              <p className="truncate font-mono text-[11px] text-stone-400">{stationMeta(tuned.station, lang)}</p>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label={t("dial.previous")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-stone-500 ring-1 ring-white/[0.1] transition hover:text-ink"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label={t("dial.next")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-stone-500 ring-1 ring-white/[0.1] transition hover:text-ink"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* the band */}
      <div
        ref={band}
        className="relative mt-4 h-[74px] cursor-pointer touch-pan-y"
        onPointerMove={onPointerMove}
        onPointerDown={(event) => {
          setDragging(true);
          setTunedId(nearestAt(event.clientX).station.id);
        }}
        onPointerUp={(event) => {
          // A mouse click tunes and plays. On touch, sliding only tunes — the
          // pins are millimetres apart, so playing waits for a tap on the readout.
          if (dragging && event.pointerType === "mouse") play(nearestAt(event.clientX).station);
          setDragging(false);
        }}
        onPointerCancel={() => setDragging(false)}
        onPointerLeave={(event) => {
          setDragging(false);
          if (event.pointerType === "mouse") setTunedId(null);
        }}
        aria-hidden="true"
      >
        <span className="absolute left-0 top-0 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400">FM · MHz</span>
        <span
          className="absolute top-0 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400"
          style={{ left: `${(FM_SHARE + 0.07) * 100}%` }}
        >
          {t("dial.online")}
        </span>

        <div className="absolute inset-x-0 top-[40px] h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        {ticks.map((tick) => (
          <span
            key={tick.x}
            className={cn("absolute top-[40px] w-px -translate-x-1/2", tick.major ? "h-3 bg-white/35" : "h-1.5 bg-white/15")}
            style={{ left: `${tick.x * 100}%` }}
          />
        ))}
        {ticks
          .filter((tick) => tick.label)
          .map((tick) => (
            <span
              key={`l${tick.x}`}
              className="absolute top-[58px] -translate-x-1/2 font-mono text-[10px] tabular-nums text-stone-400"
              style={{ left: `${tick.x * 100}%` }}
            >
              {tick.label}
            </span>
          ))}
        <span className="absolute top-[34px] h-4 w-px bg-white/20" style={{ left: `${(FM_SHARE + 0.035) * 100}%` }} />

        {/* station pins */}
        {markers.map((marker) => {
          const isActive = active?.id === marker.station.id;
          const offAir = healthOf(marker.station.id) === "offline" && !isActive;
          return (
            <span
              key={marker.station.id}
              className={cn(
                "absolute top-[22px] h-[18px] w-[3px] -translate-x-1/2 rounded-full transition-colors",
                isActive ? "bg-brand-500" : marker.station.id === tuned.station.id ? "bg-ink" : "bg-white/45",
                offAir && "bg-white/15"
              )}
              style={{ left: `${marker.x * 100}%` }}
            />
          );
        })}

        {/* needle */}
        <motion.span
          className="pointer-events-none absolute top-[14px] h-[40px] w-[2px] -translate-x-1/2 rounded-full bg-brand-500"
          style={{ boxShadow: "0 0 14px rgba(69,224,200,0.75), 0 0 2px rgba(69,224,200,1)" }}
          animate={{ left: `${tuned.x * 100}%`, opacity: tunedLive ? 1 : 0.75 }}
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
        />
      </div>
      <p className="mt-1 font-mono text-[10.5px] text-stone-400">{t("dial.hint", { n: radioStations.length })}</p>
    </div>
  );
}
