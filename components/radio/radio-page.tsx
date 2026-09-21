"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Moon,
  Pause,
  Play,
  RefreshCw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { useStationHealth } from "@/hooks/use-station-health";
import { useRadio } from "@/hooks/use-radio";
import { cn } from "@/lib/utils";
import { radioStations } from "@/services/discovery-data";
import type { RadioStation } from "@/types";

/** Fixed pattern — random heights would differ between server and client. */
const WAVE = [
  30, 52, 74, 44, 88, 60, 96, 40, 70, 92, 54, 100, 36, 78, 58, 86, 46, 94, 32, 72, 56, 90, 42, 80,
  64, 98, 38, 68, 84, 50, 76, 28, 62, 48, 70, 34
];

type Category = "All" | "News & Talk" | "Entertainment" | "Faith";
const CATEGORIES: Category[] = ["All", "News & Talk", "Entertainment", "Faith"];

function categoryOf(station: RadioStation): Exclude<Category, "All"> {
  const tags = station.tags ?? [];
  if (tags.includes("Religious")) return "Faith";
  if (tags[0] === "Entertainment") return "Entertainment";
  return "News & Talk";
}

export function stationPath(station: RadioStation) {
  return `/radio/${station.id}`;
}

function Waveform({ live, compact = false }: { live: boolean; compact?: boolean }) {
  const bars = compact ? WAVE.slice(0, 24) : WAVE;

  return (
    <div
      className={cn("flex items-end gap-[3px]", compact ? "h-7" : "h-24 sm:h-28")}
      aria-hidden="true"
    >
      {bars.map((height, index) => (
        <span
          key={index}
          className={cn("flex-1 rounded-[2px]", live ? "wave-bar" : "opacity-35")}
          style={{
            height: `${height}%`,
            background: index % 6 === 0 ? "#7c6cf6" : "#45e0c8",
            animationDelay: live ? `${(index * 97) % 1150}ms` : undefined
          }}
        />
      ))}
    </div>
  );
}

const SLEEP_OPTIONS: Array<{ label: string; minutes: number | null }> = [
  { label: "Off", minutes: null },
  { label: "15m", minutes: 15 },
  { label: "30m", minutes: 30 },
  { label: "1h", minutes: 60 }
];

export function NowPlayingHero({ focusStation }: { focusStation?: RadioStation } = {}) {
  const {
    station,
    status,
    isPlaying,
    nowPlaying,
    volume,
    isMuted,
    sleepAt,
    errorMessage,
    playStation,
    togglePlayback,
    playPrevious,
    playNext,
    setVolume,
    toggleMute,
    setSleepTimer,
    retry
  } = useRadio();
  const { healthOf } = useStationHealth();

  const featured = radioStations.find((item) => item.featured) ?? radioStations[0];
  // On a station page the hero is about that station even if another one is
  // playing; on /radio it follows whatever is playing, else the featured pick.
  const shown = focusStation ?? station ?? featured;
  const isCurrent = Boolean(station) && station?.id === shown.id;
  const playingElsewhere = Boolean(focusStation && station && station.id !== focusStation.id);

  const sleepMinutesLeft = sleepAt ? Math.max(1, Math.ceil((sleepAt - Date.now()) / 60_000)) : null;
  const activeSleep = sleepMinutesLeft
    ? SLEEP_OPTIONS.reduce((best, option) =>
        option.minutes && Math.abs(option.minutes - sleepMinutesLeft) <
          Math.abs((best.minutes ?? 999) - sleepMinutesLeft)
          ? option
          : best
      )
    : SLEEP_OPTIONS[0];

  const shownHealth = healthOf(shown.id);
  const badge = !isCurrent
    ? shownHealth === "online"
      ? { label: "On air", tone: "bg-emerald-500/[0.12] text-emerald-700", dot: "bg-emerald-500" }
      : shownHealth === "offline"
        ? { label: "Off air", tone: "bg-white/[0.06] text-stone-500", dot: "bg-stone-400" }
        : { label: "Ready", tone: "bg-white/[0.06] text-stone-500", dot: "bg-stone-400" }
    : status === "playing"
      ? { label: "Live", tone: "bg-red-500/[0.14] text-red-700", dot: "bg-red-600 animate-pulse" }
      : status === "loading" || status === "reconnecting"
        ? {
            label: status === "reconnecting" ? "Reconnecting" : "Connecting",
            tone: "bg-brand-500/[0.12] text-brand-700",
            dot: "bg-brand-500 animate-pulse"
          }
        : status === "error"
          ? { label: "Off air", tone: "bg-white/[0.06] text-stone-500", dot: "bg-stone-400" }
          : { label: "Paused", tone: "bg-white/[0.06] text-stone-500", dot: "bg-stone-400" };

  // Live state belongs to the station shown, not to whatever the player holds.
  const showingLive = isCurrent && isPlaying;
  const playLabel = showingLive ? "Pause" : isCurrent ? "Resume" : `Play ${shown.name}`;

  return (
    <section className="relative overflow-hidden border-b border-white/[0.06] bg-card/90 px-4 py-6 sm:rounded-[30px] sm:border sm:border-brand-500/25 sm:px-7 sm:py-7 sm:shadow-soft">
      <div className="pointer-events-none absolute -left-24 -top-32 h-[380px] w-[380px] rounded-full bg-brand-500/[0.13] blur-[90px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-[320px] w-[320px] rounded-full bg-orange-500/[0.12] blur-[90px]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/70 to-transparent" />

      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-stone-400">
            {isCurrent
              ? "Now playing"
              : playingElsewhere
                ? `Playing ${station?.name} — tap to switch`
                : focusStation
                  ? "Live station"
                  : "Featured station"}
          </span>
          <span className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1", badge.tone)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", badge.dot)} />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.12em]">{badge.label}</span>
          </span>
        </div>

        <Link href={stationPath(shown)} className="group mt-4 block">
          <h1 className="font-display text-[2.1rem] font-bold leading-[1.05] tracking-[-0.03em] text-ink transition group-hover:text-brand-700 sm:text-[2.6rem]">
            {shown.name}
          </h1>
        </Link>

        <p className="mt-2 font-mono text-[12.5px] text-stone-500">
          {shown.frequency} · {shown.city}
        </p>

        <p className="mt-3 min-h-[1.5rem] text-[15px] leading-6 text-stone-600">
          {isCurrent && nowPlaying ? (
            <>
              <span className="text-stone-400">On air · </span>
              <span className="font-medium text-ink">{nowPlaying}</span>
            </>
          ) : (
            shown.description
          )}
        </p>

        <div className="mt-6">
          <Waveform live={showingLive} />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void playPrevious()}
            aria-label="Previous station"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.1] text-stone-500 transition hover:border-brand-500/40 hover:text-ink"
          >
            <SkipBack className="h-4 w-4 fill-current" />
          </button>

          <button
            type="button"
            onClick={() => void (isCurrent ? togglePlayback() : playStation(shown))}
            aria-label={playLabel}
            className="inline-flex h-14 w-14 items-center justify-center rounded-[18px] bg-brand-500 text-brand-950 shadow-glow-sm transition hover:scale-[1.04] active:scale-[0.97]"
          >
            {showingLive ? <Pause className="h-5 w-5 fill-current" /> : <Play className="ml-0.5 h-5 w-5 fill-current" />}
          </button>

          <button
            type="button"
            onClick={() => void playNext()}
            aria-label="Next station"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.1] text-stone-500 transition hover:border-brand-500/40 hover:text-ink"
          >
            <SkipForward className="h-4 w-4 fill-current" />
          </button>

          <div className="ml-auto flex items-center gap-2.5">
            <button
              type="button"
              onClick={toggleMute}
              aria-label={isMuted ? "Unmute" : "Mute"}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-stone-500 transition hover:text-ink"
            >
              {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <label htmlFor="hero-volume" className="sr-only">
              Volume
            </label>
            <input
              id="hero-volume"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={(event) => setVolume(Number(event.target.value))}
              className="h-1.5 w-24 cursor-pointer accent-brand-500 sm:w-32"
            />
          </div>
        </div>

        {errorMessage && isCurrent ? (
          <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
            <p className="text-sm text-stone-500">
              {shownHealth === "offline"
                ? `${shown.name} looks off air right now. It usually comes back on its own — try again later or pick another station.`
                : errorMessage}
            </p>
            <button
              type="button"
              onClick={() => void retry()}
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-brand-700"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-white/[0.07] pt-5">
          <span className="mr-1 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-stone-400">
            <Moon className="h-3.5 w-3.5" />
            Sleep
          </span>
          {SLEEP_OPTIONS.map((option) => {
            const active = option.label === activeSleep.label;
            return (
              <button
                key={option.label}
                type="button"
                onClick={() => setSleepTimer(option.minutes)}
                aria-pressed={active}
                className={cn(
                  "min-h-9 rounded-xl px-3.5 text-[13px] font-semibold transition",
                  active
                    ? "bg-brand-500/[0.14] text-brand-700 ring-1 ring-brand-500/50"
                    : "text-stone-500 ring-1 ring-white/[0.1] hover:text-ink"
                )}
              >
                {option.label}
              </button>
            );
          })}
          {sleepMinutesLeft ? (
            <span className="ml-auto font-mono text-[11px] text-stone-400">stops in {sleepMinutesLeft}m</span>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function StationCard({ station }: { station: RadioStation }) {
  const { station: active, status, isPlaying, nowPlaying, playStation, togglePlayback } = useRadio();
  const isActive = active?.id === station.id;
  const isLive = isActive && isPlaying;
  const isBusy = isActive && (status === "loading" || status === "reconnecting");
  const { healthOf } = useStationHealth();
  const health = healthOf(station.id);
  const isOffAir = !isActive && health === "offline";

  return (
    <article
      className={cn(
        "group relative rounded-[22px] border p-5 transition duration-200",
        isActive
          ? "border-brand-500/40 bg-brand-500/[0.06]"
          : "border-white/[0.08] bg-white/[0.025] hover:-translate-y-0.5 hover:border-white/[0.14]",
        isOffAir && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={stationPath(station)}
            className="font-display text-[1.15rem] font-semibold tracking-[-0.02em] text-ink transition after:absolute after:inset-0 after:rounded-[22px] hover:text-brand-700"
          >
            {station.name}
          </Link>
          <p className="mt-1 font-mono text-[12px] text-stone-400">
            {station.frequency} · {station.city}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void (isActive ? togglePlayback() : playStation(station))}
          aria-label={isLive ? `Pause ${station.name}` : `Play ${station.name}`}
          className={cn(
            "relative z-10 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition active:scale-[0.95]",
            isActive
              ? "bg-brand-500 text-brand-950 shadow-glow-sm"
              : "bg-white/[0.06] text-stone-500 group-hover:bg-brand-500 group-hover:text-brand-950"
          )}
        >
          {isLive ? <Pause className="h-4 w-4 fill-current" /> : <Play className="ml-0.5 h-4 w-4 fill-current" />}
        </button>
      </div>

      <div className="mt-4">
        <Waveform live={isLive} compact />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-[13px] text-stone-500">
          {isActive && nowPlaying ? (
            <span className="text-ink">{nowPlaying}</span>
          ) : (
            station.description
          )}
        </p>
        <span
          className={cn(
            "shrink-0 font-mono text-[10px] uppercase tracking-[0.12em]",
            "inline-flex items-center gap-1.5",
            isLive ? "text-brand-700" : isBusy ? "text-brand-600" : health === "online" ? "text-emerald-700" : "text-stone-400"
          )}
        >
          {!isLive && !isBusy && health ? (
            <span className={cn("h-1.5 w-1.5 rounded-full", health === "online" ? "bg-emerald-500" : "bg-stone-500")} />
          ) : null}
          {isLive ? "Playing" : isBusy ? "Tuning" : health === "online" ? "On air" : health === "offline" ? "Off air" : categoryOf(station)}
        </span>
      </div>
    </article>
  );
}

export function RadioPage() {
  const [category, setCategory] = useState<Category>("All");

  const counts = useMemo(() => {
    const result: Record<Category, number> = { All: radioStations.length, "News & Talk": 0, Entertainment: 0, Faith: 0 };
    radioStations.forEach((station) => {
      result[categoryOf(station)] += 1;
    });
    return result;
  }, []);

  const visible = useMemo(
    () => (category === "All" ? radioStations : radioStations.filter((station) => categoryOf(station) === category)),
    [category]
  );

  return (
    <AppShell>
      <div className="space-y-5">
        <NowPlayingHero />

        <section className="px-4 sm:px-0">
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORIES.filter((item) => item === "All" || counts[item] > 0).map((item) => {
              const active = item === category;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  aria-pressed={active}
                  className={cn(
                    "min-h-9 rounded-full px-4 text-[13px] font-semibold transition",
                    active
                      ? "bg-brand-500 text-brand-950"
                      : "text-stone-500 ring-1 ring-white/[0.11] hover:text-ink"
                  )}
                >
                  {item}
                  <span className={cn("ml-1.5 font-mono text-[11px]", active ? "text-brand-950/60" : "text-stone-400")}>
                    {counts[item]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {visible.map((station) => (
              <StationCard key={station.id} station={station} />
            ))}
          </div>

          <p className="mt-5 text-[13px] leading-6 text-stone-400">
            Playback keeps going as you move around the site, and works with your lock screen and
            keyboard media keys. Dropped connections reconnect on their own.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
