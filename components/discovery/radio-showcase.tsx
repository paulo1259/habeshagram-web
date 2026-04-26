"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Headphones, Pause, Play, Radio, Volume2 } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { recordSectionUsage } from "@/lib/personalization";
import { radioStations } from "@/services/discovery-data";
import { RadioStation } from "@/types";
import { cn } from "@/lib/utils";

function RadioPlayerPanel({
  station,
  compact = false,
  autoplayToken = 0,
  onAutoplayResult
}: {
  station: RadioStation;
  compact?: boolean;
  autoplayToken?: number;
  onAutoplayResult?: (result: "started" | "blocked" | "unavailable") => void;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const usesWidget = station.playbackMode === "widget" && Boolean(station.embedUrl);
  const usesStream = !usesWidget && station.playbackMode === "stream" && Boolean(station.streamUrl);

  useEffect(() => {
    setHasError(false);
    setIsLoading(usesWidget);
  }, [station.id, usesWidget]);

  useEffect(() => {
    if (!autoplayToken) {
      return;
    }

    if (usesStream && audioRef.current) {
      void audioRef.current
        .play()
        .then(() => onAutoplayResult?.("started"))
        .catch(() => onAutoplayResult?.("blocked"));
      return;
    }

    onAutoplayResult?.("unavailable");
  }, [autoplayToken, onAutoplayResult, usesStream]);

  return (
    <section className="relative isolate overflow-hidden rounded-[28px] border border-brand-100 bg-white/96 shadow-soft">
      <div className={compact ? "p-4" : "p-5"}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">
              {station.featured ? "Live On Air" : "Now Playing"}
            </p>
            <h3 className="mt-1 text-lg font-black tracking-tight text-ink">{station.name}</h3>
            <p className="mt-1 text-sm text-stone-500">
              {station.frequency} / {station.city}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-[11px] font-semibold text-brand-800">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {station.status === "live" ? "Live" : "Soon"}
          </div>
        </div>

        <p className="mt-3 text-sm leading-6 text-stone-600">{station.description}</p>

        <div className="mt-4 rounded-[22px] border border-brand-100 bg-stone-100 p-2">
          <div
            className="relative overflow-hidden rounded-[18px] bg-white"
            style={{ height: compact ? 150 : 176 }}
          >
            {usesWidget ? (
              <>
                {isLoading ? (
                  <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center gap-2 bg-white/92 text-sm text-stone-600">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
                    Loading {station.name}...
                  </div>
                ) : null}
                {hasError ? (
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 px-5 text-center text-sm text-stone-600">
                    <Radio className="h-5 w-5 text-brand-700" />
                    The live widget could not load right now.
                  </div>
                ) : null}
                <iframe
                  key={`${station.id}-widget`}
                  title={`${station.name} live player`}
                  src={station.embedUrl}
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
              </>
            ) : usesStream ? (
              <div className="flex h-full flex-col justify-center bg-brand-50/30 p-4">
                <audio
                  key={`${station.id}-stream`}
                  ref={audioRef}
                  controls
                  preload="none"
                  className="w-full"
                  src={station.streamUrl}
                >
                  Your browser does not support the audio element.
                </audio>
                <p className="mt-3 text-sm text-stone-500">
                  Streaming inside HabeshaGram with a compact audio player.
                </p>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 px-5 text-center text-sm text-stone-600">
                <Radio className="h-5 w-5 text-brand-700" />
                Playback unavailable right now.
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-stone-500">
          <Volume2 className="h-4 w-4 text-brand-700" />
          Player is fully contained inside this card so the rest of the page stays clickable.
        </div>
      </div>
    </section>
  );
}

function SecondaryStationCard({
  station,
  selected,
  onSelect
}: {
  station: RadioStation;
  selected: boolean;
  onSelect: (station: RadioStation) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(station)}
      className={cn(
        "w-full rounded-[24px] border bg-white/96 p-4 text-left shadow-soft transition hover:-translate-y-0.5 hover:shadow-lg",
        selected ? "border-brand-300 ring-2 ring-brand-200/70" : "border-brand-100"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">
            {station.frequency}
          </p>
          <h4 className="mt-1 font-bold tracking-tight text-ink">{station.name}</h4>
          <p className="mt-1 text-xs text-stone-500">{station.provider}</p>
        </div>
        <div className="rounded-full bg-brand-50 p-2 text-brand-700">
          <Headphones className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-stone-600">{station.description}</p>
    </button>
  );
}

export function RadioShowcase({
  compact = false,
  quickPlayer = false
}: {
  compact?: boolean;
  quickPlayer?: boolean;
}) {
  const featuredStation = useMemo(
    () => radioStations.find((station) => station.featured) ?? radioStations[0],
    []
  );
  const secondaryStations = useMemo(
    () => radioStations.filter((station) => station.id !== featuredStation.id),
    [featuredStation.id]
  );
  const [selectedStation, setSelectedStation] = useState<RadioStation>(featuredStation);
  const [isExpanded, setIsExpanded] = useState(false);
  const [autoplayToken, setAutoplayToken] = useState(0);
  const [playerNotice, setPlayerNotice] = useState("");
  const playerRef = useRef<HTMLDivElement | null>(null);
  const shouldRevealPlayerRef = useRef(false);

  const handleStationSelect = (station: RadioStation) => {
    setSelectedStation(station);
    setIsExpanded(true);
    setAutoplayToken((value) => value + 1);
    shouldRevealPlayerRef.current = true;
    trackEvent("radio_play", {
      station_id: station.id,
      station_name: station.name,
      playback_mode: station.playbackMode
    });
    recordSectionUsage("radio", 3);
    setPlayerNotice(
      station.playbackMode === "stream"
        ? `Opening ${station.name}. If playback is blocked, tap play to start.`
        : `${station.name} is ready in the in-app player. If audio does not begin automatically, tap play to start.`
    );
  };

  useEffect(() => {
    if (!isExpanded || !shouldRevealPlayerRef.current || !playerRef.current) {
      return;
    }

    shouldRevealPlayerRef.current = false;
    playerRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [isExpanded, selectedStation.id]);

  if (quickPlayer) {
    return (
      <section className="relative overflow-hidden rounded-[28px] border border-brand-100 bg-white/96 p-4 shadow-soft sm:p-5">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-500 via-orange-400 to-brand-300" />
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">
              Live Radio
            </p>
            <div className="mt-1 flex items-center gap-2">
              <h3 className="truncate text-lg font-black tracking-tight text-ink">
                {selectedStation.name}
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-800">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Live
              </span>
            </div>
            <p className="mt-1 text-sm text-stone-500">
              {selectedStation.frequency} / {selectedStation.city}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded((current) => !current)}
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-orange-400 text-white shadow-soft transition hover:shadow-md active:scale-[0.98]"
            aria-label={isExpanded ? "Collapse radio player" : "Expand radio player"}
          >
            {isExpanded ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4 fill-current" />}
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 rounded-[22px] border border-brand-100 bg-gradient-to-r from-brand-50/80 via-white to-orange-50/70 px-4 py-3 text-sm text-stone-600">
          <div className="min-w-0">
            <p className="truncate font-medium text-stone-700">{selectedStation.description}</p>
            <p className="mt-1 text-xs text-stone-500">
              Tap to open the full in-app player without leaving the homepage.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded((current) => !current)}
            className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-full bg-white px-3.5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-50"
          >
            {isExpanded ? "Collapse" : "Open player"}
            <ChevronDown className={cn("h-3.5 w-3.5 transition", isExpanded && "rotate-180")} />
          </button>
        </div>

        {playerNotice ? (
          <div className="mt-3 rounded-[20px] border border-brand-100 bg-brand-50/60 px-4 py-3 text-sm text-stone-600">
            {playerNotice}
          </div>
        ) : null}

        {isExpanded ? (
          <div ref={playerRef} className="mt-4 space-y-4">
            <RadioPlayerPanel
              station={selectedStation}
              compact
              autoplayToken={autoplayToken}
              onAutoplayResult={(result) => {
                if (result === "started") {
                  setPlayerNotice(`${selectedStation.name} is playing in the in-app player.`);
                } else if (result === "blocked") {
                  setPlayerNotice(`Autoplay was blocked for ${selectedStation.name}. Tap play to start.`);
                } else {
                  setPlayerNotice(
                    `${selectedStation.name} is open in the in-app player. Tap play inside the widget to start.`
                  );
                }
              }}
            />
            <div className="grid gap-3">
              {radioStations.map((station) => (
                <SecondaryStationCard
                  key={station.id}
                  station={station}
                  selected={selectedStation.id === station.id}
                  onSelect={handleStationSelect}
                />
              ))}
            </div>
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div ref={playerRef}>
        <RadioPlayerPanel
          station={selectedStation}
          compact={compact}
          autoplayToken={autoplayToken}
          onAutoplayResult={(result) => {
            if (result === "started") {
              setPlayerNotice(`${selectedStation.name} is playing in the in-app player.`);
            } else if (result === "blocked") {
              setPlayerNotice(`Autoplay was blocked for ${selectedStation.name}. Tap play to start.`);
            } else {
              setPlayerNotice(
                `${selectedStation.name} is open in the in-app player. Tap play inside the widget to start.`
              );
            }
          }}
        />
      </div>
      {playerNotice ? (
        <div className="rounded-[20px] border border-brand-100 bg-brand-50/60 px-4 py-3 text-sm text-stone-600">
          {playerNotice}
        </div>
      ) : null}
      <div className={cn("grid gap-3", compact ? "grid-cols-1" : "sm:grid-cols-2")}>
        {secondaryStations.map((station) => (
          <SecondaryStationCard
            key={station.id}
            station={station}
            selected={selectedStation.id === station.id}
            onSelect={handleStationSelect}
          />
        ))}
      </div>
    </section>
  );
}
