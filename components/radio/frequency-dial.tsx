"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/hooks/use-language";
import { useRadio } from "@/hooks/use-radio";
import { useStationHealth } from "@/hooks/use-station-health";
import { cn } from "@/lib/utils";
import { radioStations } from "@/services/discovery-data";
import { StationArt } from "@/components/radio/station-art";
import type { RadioStation } from "@/types";

/**
 * A radio tuner for the home page: the FM band from 88 to 108 with each Addis
 * station sitting at its real frequency, and the online-only stations in a
 * NET band after it. Tapping a station tunes to it; the needle follows
 * whatever is playing (or whatever you hover).
 *
 * Positions are percentages of the dial, so it scales with the card. On a
 * phone the dial keeps a minimum width and scrolls sideways.
 */

const FM_MIN = 87.5;
const FM_MAX = 108;
// Share of the dial given to the FM band; the rest is the NET band.
const FM_SHARE = 0.72;
const EDGE = 0.04;

function frequencyOf(station: RadioStation): number | null {
  const match = station.frequency.match(/(\d{2,3}(?:\.\d)?)\s*FM/i);
  return match ? Number(match[1]) : null;
}

function fmPosition(mhz: number) {
  return EDGE + ((mhz - FM_MIN) / (FM_MAX - FM_MIN)) * (FM_SHARE - EDGE);
}

export function FrequencyDial({ className }: { className?: string }) {
  const { station: active, isPlaying, playStation, togglePlayback } = useRadio();
  const { healthOf } = useStationHealth();
  const { t } = useLanguage();
  const [hovered, setHovered] = useState<string | null>(null);

  const markers = useMemo(() => {
    const online = radioStations.filter((station) => frequencyOf(station) === null);
    const netStart = FM_SHARE + 0.1;
    const netEnd = 1 - EDGE;
    return radioStations.map((station) => {
      const mhz = frequencyOf(station);
      if (mhz !== null) return { station, x: fmPosition(mhz), label: mhz.toFixed(1) };
      const index = online.indexOf(station);
      const x = online.length === 1 ? (netStart + netEnd) / 2 : netStart + (index / (online.length - 1)) * (netEnd - netStart);
      return { station, x, label: "NET" };
    });
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
  const needleId = hovered ?? active?.id ?? featured.id;
  const needle = markers.find((marker) => marker.station.id === needleId) ?? markers[0];
  const needleLive = Boolean(active && isPlaying && active.id === needle.station.id);
  const scroller = useRef<HTMLDivElement | null>(null);

  // On a phone the dial is wider than the screen: keep the needle in view.
  useEffect(() => {
    const node = scroller.current;
    if (!node || node.scrollWidth <= node.clientWidth || hovered) return;
    const target = needle.x * node.scrollWidth - node.clientWidth / 2;
    node.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [needle.x, hovered]);

  return (
    <div ref={scroller} className={cn("no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0", className)}>
      <div className="relative h-[116px] min-w-[560px]" onMouseLeave={() => setHovered(null)}>
        {/* band labels */}
        <span className="absolute left-0 top-0 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400">FM · MHz</span>
        <span
          className="absolute top-0 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400"
          style={{ left: `${(FM_SHARE + 0.1) * 100}%` }}
        >
          {t("dial.online")}
        </span>

        {/* the scale */}
        <div className="absolute inset-x-0 top-[84px] h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        {ticks.map((tick) => (
          <span
            key={tick.x}
            className={cn("absolute top-[84px] w-px -translate-x-1/2", tick.major ? "h-3 bg-white/35" : "h-1.5 bg-white/15")}
            style={{ left: `${tick.x * 100}%` }}
            aria-hidden="true"
          />
        ))}
        {ticks
          .filter((tick) => tick.label)
          .map((tick) => (
            <span
              key={`l${tick.x}`}
              className="absolute top-[99px] -translate-x-1/2 font-mono text-[10px] tabular-nums text-stone-400"
              style={{ left: `${tick.x * 100}%` }}
              aria-hidden="true"
            >
              {tick.label}
            </span>
          ))}
        <span
          className="absolute top-[76px] h-4 w-px bg-white/20"
          style={{ left: `${(FM_SHARE + 0.05) * 100}%` }}
          aria-hidden="true"
        />

        {/* needle */}
        <motion.span
          className="pointer-events-none absolute top-[16px] h-[84px] w-[2px] -translate-x-1/2 rounded-full bg-brand-500"
          style={{ boxShadow: "0 0 14px rgba(69,224,200,0.75), 0 0 2px rgba(69,224,200,1)" }}
          animate={{ left: `${needle.x * 100}%`, opacity: needleLive ? 1 : 0.7 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          aria-hidden="true"
        />

        {/* stations */}
        {markers.map(({ station, x, label }) => {
          const isActive = active?.id === station.id;
          const live = isActive && isPlaying;
          const offAir = healthOf(station.id) === "offline" && !isActive;
          return (
            <button
              key={station.id}
              type="button"
              onMouseEnter={() => setHovered(station.id)}
              onFocus={() => setHovered(station.id)}
              onBlur={() => setHovered(null)}
              onClick={() => void (isActive ? togglePlayback() : playStation(station))}
              aria-label={t(live ? "radio.pauseName" : "radio.playName", { name: station.name })}
              className={cn(
                "group absolute top-[20px] flex -translate-x-1/2 flex-col items-center gap-1.5 rounded-xl transition",
                offAir && "opacity-45"
              )}
              style={{ left: `${x * 100}%` }}
            >
              <span
                className={cn(
                  "rounded-[12px] transition duration-300 group-hover:-translate-y-0.5",
                  isActive ? "ring-2 ring-brand-500 ring-offset-2 ring-offset-card" : "ring-1 ring-transparent"
                )}
              >
                <StationArt station={station} size={38} live={live} rounded="rounded-[12px]" />
              </span>
              <span
                className={cn(
                  "whitespace-nowrap rounded-full px-1.5 font-mono text-[9.5px] tabular-nums",
                  isActive ? "bg-brand-500 text-brand-950" : "text-transparent group-hover:text-stone-500"
                )}
              >
                {label === "NET" ? station.name.split(" ")[0] : label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
