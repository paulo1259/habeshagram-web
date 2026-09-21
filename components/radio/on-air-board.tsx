"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Pause, Play } from "lucide-react";
import { useOnAirBoard } from "@/hooks/use-on-air-board";
import { useRadio } from "@/hooks/use-radio";
import { useLanguage } from "@/hooks/use-language";
import { useStationHealth } from "@/hooks/use-station-health";
import { cn } from "@/lib/utils";
import { radioStations } from "@/services/discovery-data";
import { stationDescription } from "@/lib/i18n/stations";

/**
 * Every station at a glance, with what each one is playing right now. Titles
 * arrive live and animate in as they change, so the page is visibly moving
 * the moment it opens.
 */
export function OnAirBoard() {
  const ref = useRef<HTMLElement | null>(null);
  const [onScreen, setOnScreen] = useState(false);
  const titles = useOnAirBoard(onScreen);
  const { healthOf } = useStationHealth();
  const { station: active, isPlaying, status, playStation, togglePlayback } = useRadio();
  const { t, lang } = useLanguage();

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setOnScreen(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), {
      rootMargin: "200px"
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="rounded-[26px] border border-white/[0.08] bg-card/90 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500/60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-stone-400">{t("onAir.title")}</span>
        </span>
        <span className="font-mono text-[11px] text-stone-400">{t("onAir.subtitle")}</span>
      </div>

      <ul className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {radioStations.map((station) => {
          const isActive = active?.id === station.id;
          const live = isActive && isPlaying;
          const busy = isActive && (status === "loading" || status === "reconnecting");
          const health = healthOf(station.id);
          const title = titles[station.id];

          return (
            <li
              key={station.id}
              className={cn(
                "group relative flex min-w-0 items-center gap-3 rounded-[18px] border p-3 transition",
                isActive
                  ? "border-brand-500/40 bg-brand-500/[0.06]"
                  : "border-white/[0.07] bg-white/[0.02] hover:border-white/[0.14]",
                health === "offline" && !isActive && "opacity-55"
              )}
            >
              <button
                type="button"
                onClick={() => void (isActive ? togglePlayback() : playStation(station))}
                aria-label={t(live ? "radio.pauseName" : "radio.playName", { name: station.name })}
                className={cn(
                  "relative z-10 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition active:scale-[0.94]",
                  isActive
                    ? "bg-brand-500 text-brand-950"
                    : "bg-white/[0.06] text-stone-500 group-hover:bg-brand-500 group-hover:text-brand-950"
                )}
              >
                {live ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />}
              </button>

              <div className="min-w-0 flex-1">
                <Link
                  href={`/radio/${station.id}`}
                  className="flex items-center gap-1.5 text-[13.5px] font-semibold text-ink after:absolute after:inset-0 after:rounded-[18px]"
                >
                  <span className="truncate">{station.name}</span>
                  {health ? (
                    <span
                      className={cn(
                        "h-1.5 w-1.5 shrink-0 rounded-full",
                        health === "online" ? "bg-emerald-500" : "bg-stone-500"
                      )}
                      aria-label={t(health === "online" ? "radio.badgeOnAir" : "radio.badgeOffAir")}
                    />
                  ) : null}
                </Link>
                <div className="relative mt-0.5 h-[18px] overflow-hidden">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.p
                      key={title || "none"}
                      initial={{ y: 12, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -12, opacity: 0 }}
                      transition={{ duration: 0.28 }}
                      className={cn(
                        "truncate text-[12.5px]",
                        title ? "text-stone-500" : "text-stone-400"
                      )}
                    >
                      {busy ? t("onAir.tuning") : title || (health === "offline" ? t("onAir.offAirNow") : stationDescription(station, lang))}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>

              {live ? (
                <span className="flex h-4 items-end gap-[2px]" aria-hidden="true">
                  {[0, 1, 2].map((bar) => (
                    <span
                      key={bar}
                      className="wave-bar w-[3px] rounded-full bg-brand-500"
                      style={{ height: "100%", animationDelay: `${bar * 0.18}s` }}
                    />
                  ))}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
