"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Moon,
  Pause,
  Play,
  Radio,
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

const SLEEP_OPTIONS = [15, 30, 60, 90] as const;

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

const controlClass =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.05] text-stone-600 transition hover:border-brand-500/35 hover:text-brand-700";

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
  const [showSleepMenu, setShowSleepMenu] = useState(false);
  const [, tick] = useState(0);
  const sleepMenuRef = useRef<HTMLDivElement | null>(null);

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

  const statusLabel = t(
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

  return (
    <aside
      aria-label={t("radio.player.label")}
      className="fixed bottom-[6.4rem] left-3 right-3 z-50 mx-auto max-w-xl lg:bottom-4 lg:left-auto lg:right-4 lg:mx-0 lg:w-[34rem]"
    >
      <div className="overflow-hidden rounded-[26px] border border-brand-500/25 bg-card/98 shadow-[0_22px_70px_rgba(0,0,0,0.72),0_0_30px_rgba(69,224,200,0.14)] backdrop-blur-2xl">
        <div className="flex items-center gap-2.5 px-3 py-3 sm:px-4">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-orange-500 text-brand-950 shadow-glow-sm">
            <Radio className="h-4.5 w-4.5" />
            {status === "playing" ? (
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 animate-pulse rounded-full border-2 border-card bg-emerald-500" />
            ) : null}
          </div>

          <div className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <p className="truncate text-sm font-bold text-ink">
                {nowPlaying || station.name}
              </p>
              <EqualizerBars active={isPlaying} />
            </span>
            <p className="truncate font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-brand-700">
              {nowPlaying ? `${station.name} · ` : ""}
              {statusLabel}
              {isPlaying || status === "paused" ? ` · ${formatElapsed(elapsedSeconds)}` : ""}
              {sleepRemainingMinutes ? ` · ${t("radio.player.sleep", { n: sleepRemainingMinutes })}` : ""}
            </p>
          </div>

          <button type="button" className={controlClass} onClick={() => void playPrevious()} aria-label={t("radio.previous")}>
            <SkipBack className="h-4 w-4" />
          </button>

          <button
            type="button"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-orange-500 text-brand-950 shadow-glow-sm transition hover:scale-105"
            onClick={() => void togglePlayback()}
            aria-label={t(isPlaying ? "radio.player.pause" : "radio.player.play")}
          >
            {isPlaying ? <Pause className="h-4.5 w-4.5 fill-current" /> : <Play className="ml-0.5 h-4.5 w-4.5 fill-current" />}
          </button>

          <button type="button" className={controlClass} onClick={() => void playNext()} aria-label={t("radio.next")}>
            <SkipForward className="h-4 w-4" />
          </button>

          <button
            type="button"
            className={controlClass}
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
            "border-t border-white/[0.06] transition-all duration-300",
            isExpanded ? "max-h-[22rem] opacity-100" : "max-h-0 overflow-hidden border-transparent opacity-0"
          )}
        >
            <div className="space-y-3 px-4 pb-4 pt-3">
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
                  className="h-1.5 flex-1 cursor-pointer accent-brand-500"
                />
                <span className="w-10 text-right text-xs font-semibold text-stone-500">
                  {Math.round((isMuted ? 0 : volume) * 100)}%
                </span>
                <div ref={sleepMenuRef} className="relative">
                  <button
                    type="button"
                    aria-label={t("radio.player.sleepTimer")}
                    onClick={() => setShowSleepMenu((value) => !value)}
                    className={cn(
                      controlClass,
                      sleepAt && "border-brand-500/45 bg-brand-500/15 text-brand-700"
                    )}
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
              <p className="text-xs leading-5 text-stone-500">
                {t("radio.player.help")}
              </p>
            </div>
        </div>

        {errorMessage ? (
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
  );
}
