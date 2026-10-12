"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, History } from "lucide-react";
import { useAirplay } from "@/hooks/use-airplay";
import { useLanguage } from "@/hooks/use-language";
import { cn } from "@/lib/utils";
import { isOnNow, type AirplayEntry } from "@/services/airplay-service";
import type { RadioStation } from "@/types";

const COLLAPSED_COUNT = 8;

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function LiveBars() {
  return (
    <span className="flex h-3 items-end gap-[2px]" aria-hidden="true">
      {[0, 1, 2].map((bar) => (
        <span
          key={bar}
          className="wave-bar w-[3px] rounded-full bg-brand-500"
          style={{ height: "100%", animationDelay: `${bar * 0.18}s` }}
        />
      ))}
    </span>
  );
}

/**
 * "Aired today" on a station page: the titles this station actually played,
 * newest first, as logged from its stream every two minutes. Nothing here is
 * scheduled or guessed — if the station sends no titles, the list says so.
 */
export function AiredTimeline({ station }: { station: RadioStation }) {
  const { entries, loaded, unavailable } = useAirplay(station.id);
  const { t, lang } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  const timeFormat = useMemo(
    () => new Intl.DateTimeFormat(lang === "am" ? "am-ET" : undefined, { hour: "numeric", minute: "2-digit" }),
    [lang]
  );

  if (unavailable) {
    return null;
  }

  const list = entries ?? [];
  const visible = expanded ? list : list.slice(0, COLLAPSED_COUNT);
  const todayKey = dayKey(new Date());

  const durationLabel = (entry: AirplayEntry) => {
    const minutes = Math.round((entry.lastSeenAt.getTime() - entry.startedAt.getTime()) / 60_000);
    return minutes >= 2 ? t("airplay.minutes", { n: minutes }) : null;
  };

  return (
    <section className="mx-4 rounded-[26px] border border-white/[0.08] bg-card/90 p-5 sm:mx-0 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <div>
          <p className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-brand-600">
            <History className="h-3.5 w-3.5" />
            {t("airplay.title")}
          </p>
          <h2 className="mt-2 font-display text-lg font-semibold tracking-[-0.02em] text-ink">
            {t("airplay.heading", { name: station.name })}
          </h2>
        </div>
        <p className="font-mono text-[11px] text-stone-400">{t("airplay.subtitle")}</p>
      </div>

      {!loaded ? (
        <ul className="mt-5 space-y-3" aria-hidden="true">
          {[0, 1, 2, 3].map((row) => (
            <li key={row} className="flex items-center gap-4">
              <span className="h-3 w-12 animate-pulse rounded bg-white/[0.06]" />
              <span className="h-3 flex-1 animate-pulse rounded bg-white/[0.06]" style={{ maxWidth: `${70 - row * 9}%` }} />
            </li>
          ))}
        </ul>
      ) : list.length === 0 ? (
        <p className="mt-5 rounded-2xl border border-dashed border-white/[0.1] px-4 py-5 text-sm leading-6 text-stone-500">
          {t("airplay.empty")}
        </p>
      ) : (
        <>
          <ol className="relative mt-5">
            {/* the spine */}
            <span
              className="absolute bottom-3 left-[5.75rem] top-3 w-px bg-gradient-to-b from-brand-500/60 via-white/[0.08] to-transparent"
              aria-hidden="true"
            />
            {visible.map((entry, index) => {
              const live = index === 0 && isOnNow(entry);
              const previous = visible[index - 1];
              const showDay =
                (index === 0 && dayKey(entry.startedAt) !== todayKey) ||
                (previous && dayKey(previous.startedAt) !== dayKey(entry.startedAt));
              const duration = durationLabel(entry);

              return (
                <li key={entry.id}>
                  {showDay ? (
                    <p className="mb-2 mt-4 pl-[7rem] font-mono text-[10.5px] uppercase tracking-[0.16em] text-stone-400 first:mt-0">
                      {dayKey(entry.startedAt) === todayKey ? t("airplay.today") : t("airplay.yesterday")}
                    </p>
                  ) : null}
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(index, 10) * 0.03 }}
                    className={cn(
                      "relative flex items-start gap-4 rounded-2xl py-2.5 pr-3",
                      live && "bg-brand-500/[0.07]"
                    )}
                  >
                    <time
                      dateTime={entry.startedAt.toISOString()}
                      className={cn(
                        "w-[4.5rem] shrink-0 whitespace-nowrap pt-0.5 text-right font-mono text-[12px] tabular-nums",
                        live ? "text-brand-600" : "text-stone-400"
                      )}
                    >
                      {timeFormat.format(entry.startedAt)}
                    </time>
                    <span
                      className={cn(
                        "relative z-10 mt-[7px] h-2 w-2 shrink-0 rounded-full ring-4 ring-card",
                        live ? "bg-brand-500 shadow-glow-sm" : "bg-stone-300"
                      )}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-[14px] leading-snug", live ? "font-semibold text-ink" : "text-stone-600")}>
                        {entry.title}
                      </p>
                      {live || duration ? (
                        <p className="mt-1 flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.12em] text-stone-400">
                          {live ? (
                            <span className="inline-flex items-center gap-1.5 text-brand-600">
                              <LiveBars />
                              {t("airplay.onNow")}
                            </span>
                          ) : null}
                          {live && duration ? <span aria-hidden="true">·</span> : null}
                          {duration ? <span>{duration}</span> : null}
                        </p>
                      ) : null}
                    </div>
                  </motion.div>
                </li>
              );
            })}
          </ol>

          {list.length > COLLAPSED_COUNT ? (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-stone-500 transition hover:bg-white/[0.05] hover:text-ink"
            >
              <ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} />
              {expanded ? t("airplay.showLess") : t("airplay.showAll", { n: list.length })}
            </button>
          ) : null}
        </>
      )}
    </section>
  );
}
