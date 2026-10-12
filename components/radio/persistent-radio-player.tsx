"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import {
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Moon,
  Pause,
  Play,
  RefreshCw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/hooks/use-language";
import { radioErrorText } from "@/lib/i18n/radio-errors";
import { useRadio } from "@/hooks/use-radio";
import { useAirplay } from "@/hooks/use-airplay";
import { isOnNow } from "@/services/airplay-service";
import { StationArt, stationPalette } from "@/components/radio/station-art";
import type { RadioStation } from "@/types";

const SLEEP_OPTIONS = [15, 30, 60, 90] as const;

const SHEET_WAVE = [38, 64, 82, 50, 92, 58, 100, 44, 74, 96, 56, 88, 40, 70, 84, 52, 94, 46, 78, 60, 90, 48, 72, 36];

function formatElapsed(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return hours ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}

function EqualizerBars({ active }: { active: boolean }) {
  return (
    <span className="flex h-3.5 shrink-0 items-end gap-[3px]" aria-hidden="true">
      {[0, 1, 2, 3].map((bar) => (
        <span
          key={bar}
          className={cn(
            "w-[3px] rounded-full bg-gradient-to-t from-brand-500 to-brand-700",
            active ? "eq-bar" : "h-1 opacity-40"
          )}
          style={active ? { animationDelay: `${bar * 140}ms` } : undefined}
        />
      ))}
    </span>
  );
}

/**
 * The last few things this station played, from the aired-today log.
 * Mounted only while the player is expanded or the sheet is open, so a
 * collapsed player costs no extra requests.
 */
function EarlierOnStation({ station }: { station: RadioStation }) {
  const { entries } = useAirplay(station.id);
  const { t, lang } = useLanguage();
  const earlier = (entries ?? []).filter((entry, index) => !(index === 0 && isOnNow(entry))).slice(0, 3);

  if (!earlier.length) {
    return null;
  }

  const format = new Intl.DateTimeFormat(lang === "am" ? "am-ET" : undefined, { hour: "numeric", minute: "2-digit" });

  return (
    <div>
      <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-stone-400">
        {t("airplay.earlier", { name: station.name })}
      </p>
      <ul className="mt-2 space-y-1.5">
        {earlier.map((entry) => (
          <li key={entry.id} className="flex items-baseline gap-3 text-[13px]">
            <time className="w-16 shrink-0 whitespace-nowrap font-mono text-[11px] tabular-nums text-stone-400">
              {format.format(entry.startedAt)}
            </time>
            <span className="min-w-0 truncate text-stone-600">{entry.title}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const controlClass =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.05] text-stone-600 transition hover:border-brand-500/35 hover:text-brand-700";

function useStatusLabel() {
  const { status } = useRadio();
  const { t } = useLanguage();
  return t(
    status === "playing"
      ? "radio.player.live"
      : status === "loading"
        ? "radio.player.connecting"
        : status === "reconnecting"
          ? "radio.player.reconnecting"
          : status === "error"
            ? "radio.player.issue"
            : "radio.player.paused"
  );
}

/**
 * Full-screen "Now playing" sheet for phones. Opens from the mini player,
 * closes with the chevron, the backdrop, or a downward swipe on the handle.
 */
function NowPlayingSheet({ station, onClose }: { station: RadioStation; onClose: () => void }) {
  const {
    status,
    isPlaying,
    volume,
    isMuted,
    errorMessage,
    nowPlaying,
    togglePlayback,
    playPrevious,
    playNext,
    retry,
    setVolume,
    toggleMute,
    sleepAt,
    elapsedSeconds,
    setSleepTimer
  } = useRadio();
  const { t } = useLanguage();
  const statusLabel = useStatusLabel();
  const drag = useDragControls();
  const [from, to] = stationPalette(station);
  const sleepRemainingMinutes = sleepAt ? Math.max(0, Math.ceil((sleepAt - Date.now()) / 60_000)) : null;

  // Lock the page behind the sheet, and let Escape close it.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label={t("radio.nowPlaying")}>
      <motion.button
        type="button"
        aria-label={t("radio.player.closeSheet")}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="absolute inset-x-0 bottom-0 top-[max(0.75rem,env(safe-area-inset-top))] flex flex-col overflow-hidden rounded-t-[32px] border-t border-white/[0.1] bg-surface"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 36 }}
        drag="y"
        dragListener={false}
        dragControls={drag}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > 110 || info.velocity.y > 600) onClose();
        }}
      >
        {/* ambient colour from the station's art */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[60%] opacity-60"
          style={{
            background: `radial-gradient(60% 50% at 20% 10%, ${from}40, transparent 70%), radial-gradient(60% 50% at 85% 30%, ${to}40, transparent 70%)`
          }}
        />

        <div
          className="relative flex touch-none items-center justify-between px-5 pb-2 pt-3"
          onPointerDown={(event) => drag.start(event)}
        >
          <button type="button" onClick={onClose} className={controlClass} aria-label={t("radio.player.closeSheet")}>
            <ChevronDown className="h-4 w-4" />
          </button>
          <span className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-white/25" aria-hidden="true" />
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-stone-400">{t("radio.nowPlaying")}</span>
          <Link
            href={`/radio/${station.id}`}
            onClick={onClose}
            className={controlClass}
            aria-label={t("radio.player.stationPage")}
          >
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="relative flex-1 overflow-y-auto px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto mt-4 flex w-full max-w-[19rem] justify-center">
            <StationArt
              station={station}
              size={264}
              live={isPlaying}
              rounded="rounded-[36px]"
              className="shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
            />
          </div>

          <div className="mx-auto mt-7 max-w-sm">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-[0.14em]",
                  isPlaying ? "bg-red-500/[0.14] text-red-700" : "bg-white/[0.06] text-stone-500"
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", isPlaying ? "animate-pulse bg-red-600" : "bg-stone-400")} />
                {statusLabel}
              </span>
              {isPlaying || status === "paused" ? (
                <span className="font-mono text-[11px] tabular-nums text-stone-400">{formatElapsed(elapsedSeconds)}</span>
              ) : null}
              {sleepRemainingMinutes ? (
                <span className="ml-auto inline-flex items-center gap-1 font-mono text-[11px] text-brand-600">
                  <Moon className="h-3 w-3" />
                  {sleepRemainingMinutes}m
                </span>
              ) : null}
            </div>

            <h2 className="mt-3 font-display text-[1.9rem] font-bold leading-[1.08] tracking-[-0.03em] text-ink">
              {station.name}
            </h2>
            <p className="mt-1.5 min-h-[1.5rem] text-[15px] leading-6 text-stone-500">
              {nowPlaying || station.description}
            </p>

            <div className="mt-6 flex h-10 items-end gap-[3px]" aria-hidden="true">
              {SHEET_WAVE.map((height, index) => (
                <span
                  key={index}
                  className={cn("flex-1 rounded-[2px]", isPlaying ? "wave-bar" : "opacity-30")}
                  style={{
                    height: `${height}%`,
                    background: index % 6 === 0 ? to : from,
                    animationDelay: isPlaying ? `${(index * 97) % 1150}ms` : undefined
                  }}
                />
              ))}
            </div>

            <div className="mt-7 flex items-center justify-center gap-7">
              <button
                type="button"
                onClick={() => void playPrevious()}
                aria-label={t("radio.previous")}
                className="inline-flex h-14 w-14 items-center justify-center rounded-full text-stone-600 transition active:scale-90"
              >
                <SkipBack className="h-6 w-6 fill-current" />
              </button>
              <button
                type="button"
                onClick={() => void togglePlayback()}
                aria-label={t(isPlaying ? "radio.player.pause" : "radio.player.play")}
                className="inline-flex h-[4.75rem] w-[4.75rem] items-center justify-center rounded-full bg-ink text-surface shadow-[0_12px_40px_rgba(69,224,200,0.25)] transition active:scale-95"
              >
                {status === "loading" || status === "reconnecting" ? (
                  <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-surface/25 border-t-surface" />
                ) : isPlaying ? (
                  <Pause className="h-7 w-7 fill-current" />
                ) : (
                  <Play className="ml-1 h-7 w-7 fill-current" />
                )}
              </button>
              <button
                type="button"
                onClick={() => void playNext()}
                aria-label={t("radio.next")}
                className="inline-flex h-14 w-14 items-center justify-center rounded-full text-stone-600 transition active:scale-90"
              >
                <SkipForward className="h-6 w-6 fill-current" />
              </button>
            </div>

            {errorMessage ? (
              <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-red-500/15 bg-red-50 px-4 py-3 text-xs text-red-700">
                <span>{radioErrorText(errorMessage, t)}</span>
                <button type="button" className="inline-flex shrink-0 items-center gap-1 font-bold" onClick={() => void retry()}>
                  <RefreshCw className="h-3.5 w-3.5" />
                  {t("radio.retry")}
                </button>
              </div>
            ) : null}

            <div className="mt-7 flex items-center gap-3">
              <button type="button" className={controlClass} onClick={toggleMute} aria-label={t(isMuted ? "radio.unmute" : "radio.mute")}>
                {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <input
                aria-label={t("radio.volume")}
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(event) => setVolume(Number(event.target.value))}
                className="radio-volume-slider h-1 flex-1 cursor-pointer"
              />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="mr-1 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-stone-400">
                <Moon className="h-3.5 w-3.5" />
                {t("radio.sleep")}
              </span>
              {[null, ...SLEEP_OPTIONS].map((minutes) => {
                const active = minutes === null ? !sleepAt : false;
                return (
                  <button
                    key={minutes ?? "off"}
                    type="button"
                    onClick={() => setSleepTimer(minutes)}
                    className={cn(
                      "min-h-9 rounded-xl px-3 text-[13px] font-semibold transition",
                      active ? "bg-brand-500/[0.14] text-brand-700 ring-1 ring-brand-500/50" : "text-stone-500 ring-1 ring-white/[0.1]"
                    )}
                  >
                    {minutes === null ? t("radio.sleepOff") : minutes < 60 ? `${minutes}m` : `${minutes / 60}h`}
                  </button>
                );
              })}
            </div>

            <div className="mt-7 border-t border-white/[0.07] pt-5">
              <EarlierOnStation station={station} />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function PersistentRadioPlayer() {
  const {
    station,
    status,
    isPlaying,
    isExpanded,
    volume,
    isMuted,
    errorMessage,
    nowPlaying,
    togglePlayback,
    playPrevious,
    playNext,
    retry,
    setExpanded,
    setVolume,
    toggleMute,
    closePlayer,
    sleepAt,
    elapsedSeconds,
    setSleepTimer
  } = useRadio();
  const { t } = useLanguage();
  const statusLabel = useStatusLabel();
  const [showSleepMenu, setShowSleepMenu] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [, tick] = useState(0);
  const sleepMenuRef = useRef<HTMLDivElement | null>(null);
  const closeSheet = useCallback(() => setSheetOpen(false), []);

  // Lets the page reserve room for the docked player (see globals.css).
  useEffect(() => {
    const root = document.documentElement;
    if (station) root.dataset.player = "open";
    else delete root.dataset.player;
    if (!station) setSheetOpen(false);
    return () => {
      delete root.dataset.player;
    };
  }, [station]);

  // Refresh the sleep countdown label periodically while armed.
  useEffect(() => {
    if (!sleepAt) {
      return;
    }

    const interval = window.setInterval(() => tick((v) => v + 1), 30_000);
    return () => window.clearInterval(interval);
  }, [sleepAt]);

  useEffect(() => {
    if (!showSleepMenu) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (sleepMenuRef.current && !sleepMenuRef.current.contains(event.target as Node)) {
        setShowSleepMenu(false);
      }
    };

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [showSleepMenu]);

  if (!station) {
    return null;
  }

  const sleepRemainingMinutes = sleepAt ? Math.max(0, Math.ceil((sleepAt - Date.now()) / 60_000)) : null;
  const busy = status === "loading" || status === "reconnecting";

  // Phones open the full sheet; desktop expands the panel in place.
  const openDetails = () => {
    if (window.matchMedia("(min-width: 1024px)").matches) setExpanded(!isExpanded);
    else setSheetOpen(true);
  };

  return (
    <>
      <aside
        aria-label={t("radio.player.label")}
        className="fixed bottom-[calc(5.6rem+env(safe-area-inset-bottom))] left-3 right-3 z-50 mx-auto max-w-md lg:bottom-4 lg:left-auto lg:right-4 lg:mx-0 lg:w-[34rem] lg:max-w-none"
      >
        <div className="relative overflow-hidden rounded-[22px] border border-white/[0.1] bg-card/95 shadow-[0_22px_70px_rgba(0,0,0,0.72),0_0_30px_rgba(69,224,200,0.12)] backdrop-blur-2xl lg:rounded-[26px]">
          {/* live signal line along the top edge */}
          <span
            className={cn(
              "absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-brand-500 to-transparent transition-opacity",
              isPlaying ? "animate-shimmer bg-[length:200%_100%] opacity-90" : "opacity-20"
            )}
            aria-hidden="true"
          />

          <div className="flex items-center gap-2.5 p-2.5 sm:px-3 lg:px-4 lg:py-3">
            <button
              type="button"
              onClick={openDetails}
              className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl text-left"
              aria-label={t(isExpanded ? "radio.player.collapse" : "radio.player.openSheet")}
            >
              <StationArt station={station} size={44} live={isPlaying} rounded="rounded-[14px]" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-sm font-bold text-ink">{nowPlaying || station.name}</span>
                  <EqualizerBars active={isPlaying} />
                </span>
                <span className="block truncate font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] text-brand-700">
                  {nowPlaying ? `${station.name} · ` : ""}
                  {statusLabel}
                  {isPlaying || status === "paused" ? ` · ${formatElapsed(elapsedSeconds)}` : ""}
                  {sleepRemainingMinutes ? ` · ${t("radio.player.sleep", { n: sleepRemainingMinutes })}` : ""}
                </span>
              </span>
            </button>

            <button type="button" className={cn(controlClass, "hidden sm:inline-flex")} onClick={() => void playPrevious()} aria-label={t("radio.previous")}>
              <SkipBack className="h-4 w-4" />
            </button>

            <button
              type="button"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-surface shadow-glow-sm transition hover:scale-105"
              onClick={() => void togglePlayback()}
              aria-label={t(isPlaying ? "radio.player.pause" : "radio.player.play")}
            >
              {busy ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-surface/25 border-t-surface" />
              ) : isPlaying ? (
                <Pause className="h-[18px] w-[18px] fill-current" />
              ) : (
                <Play className="ml-0.5 h-[18px] w-[18px] fill-current" />
              )}
            </button>

            <button type="button" className={cn(controlClass, "hidden sm:inline-flex")} onClick={() => void playNext()} aria-label={t("radio.next")}>
              <SkipForward className="h-4 w-4" />
            </button>

            <button
              type="button"
              className={cn(controlClass, "hidden lg:inline-flex")}
              onClick={() => setExpanded(!isExpanded)}
              aria-label={t(isExpanded ? "radio.player.collapse" : "radio.player.expand")}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </button>

            <button type="button" className={controlClass} onClick={closePlayer} aria-label={t("radio.player.close")}>
              <X className="h-4 w-4" />
            </button>
          </div>

          <div
            className={cn(
              "hidden border-t border-white/[0.06] transition-all duration-300 lg:block",
              isExpanded ? "max-h-[24rem] opacity-100" : "max-h-0 overflow-hidden border-transparent opacity-0"
            )}
          >
            <div className="space-y-4 px-4 pb-4 pt-3">
              <div className="flex items-center gap-3">
                <button type="button" className={controlClass} onClick={toggleMute} aria-label={t(isMuted ? "radio.unmute" : "radio.mute")}>
                  {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
                <input
                  aria-label={t("radio.volume")}
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(event) => setVolume(Number(event.target.value))}
                  className="radio-volume-slider h-1 flex-1 cursor-pointer"
                />
                <span className="w-10 text-right text-xs font-semibold text-stone-500">
                  {Math.round((isMuted ? 0 : volume) * 100)}%
                </span>
                <div ref={sleepMenuRef} className="relative">
                  <button
                    type="button"
                    aria-label={t("radio.player.sleepTimer")}
                    onClick={() => setShowSleepMenu((value) => !value)}
                    className={cn(controlClass, sleepAt && "border-brand-500/45 bg-brand-500/15 text-brand-700")}
                  >
                    <Moon className="h-4 w-4" />
                  </button>
                  {showSleepMenu ? (
                    <div className="glass-card absolute bottom-11 right-0 z-10 w-40 rounded-2xl p-1.5 shadow-soft">
                      <p className="px-2.5 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-stone-500">
                        {t("radio.player.sleepTimer")}
                      </p>
                      {SLEEP_OPTIONS.map((minutes) => (
                        <button
                          key={minutes}
                          type="button"
                          className="w-full rounded-xl px-2.5 py-2 text-left text-sm text-stone-600 transition hover:bg-brand-500/15 hover:text-brand-700"
                          onClick={() => {
                            setSleepTimer(minutes);
                            setShowSleepMenu(false);
                          }}
                        >
                          {t("radio.player.minutes", { n: minutes })}
                        </button>
                      ))}
                      <button
                        type="button"
                        className="w-full rounded-xl px-2.5 py-2 text-left text-sm text-stone-500 transition hover:bg-white/[0.06]"
                        onClick={() => {
                          setSleepTimer(null);
                          setShowSleepMenu(false);
                        }}
                      >
                        {t("radio.sleepOff")}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
              {isExpanded ? <EarlierOnStation station={station} /> : null}
              <p className="text-xs leading-5 text-stone-500">{t("radio.player.help")}</p>
            </div>
          </div>

          {errorMessage && !sheetOpen ? (
            <div className="flex items-center justify-between gap-3 border-t border-red-500/15 bg-red-50 px-4 py-2.5 text-xs text-red-700">
              <span>{radioErrorText(errorMessage, t)}</span>
              <button type="button" className="inline-flex shrink-0 items-center gap-1 font-bold" onClick={() => void retry()}>
                <RefreshCw className="h-3.5 w-3.5" />
                {t("radio.retry")}
              </button>
            </div>
          ) : null}
        </div>
      </aside>

      <AnimatePresence>
        {sheetOpen ? <NowPlayingSheet key="sheet" station={station} onClose={closeSheet} /> : null}
      </AnimatePresence>
    </>
  );
}
