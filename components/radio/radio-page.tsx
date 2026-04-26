"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronRight,
  Headphones,
  Pause,
  Play,
  Radio,
  Volume2,
  Waves
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { cn } from "@/lib/utils";
import { radioStations } from "@/services/discovery-data";
import { RadioStation } from "@/types";

function RadioStationInlinePlayer({
  station,
  autoplayToken = 0,
  onAutoplayResult
}: {
  station: RadioStation;
  autoplayToken?: number;
  onAutoplayResult?: (result: "started" | "blocked" | "widget" | "unavailable") => void;
}) {
  const [isLoading, setIsLoading] = useState(station.playbackMode === "widget");
  const [hasError, setHasError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const usesWidget = station.playbackMode === "widget" && Boolean(station.embedUrl);
  const usesStream = station.playbackMode === "stream" && Boolean(station.streamUrl) && !usesWidget;

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

    if (usesWidget) {
      onAutoplayResult?.("widget");
      return;
    }

    onAutoplayResult?.("unavailable");
  }, [autoplayToken, onAutoplayResult, usesStream, usesWidget]);

  return (
    <div className="mt-4 overflow-hidden rounded-[24px] border border-brand-100 bg-stone-100/80 p-2">
      <div className="relative overflow-hidden rounded-[20px] bg-white" style={{ height: 210 }}>
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
              key={`${station.id}-widget-inline`}
              title={`${station.name} live player`}
              src={station.embedUrl}
              className="h-full w-full border-0"
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
              key={`${station.id}-stream-inline`}
              ref={audioRef}
              controls
              preload="none"
              className="w-full"
              src={station.streamUrl}
            >
              Your browser does not support the audio element.
            </audio>
            <p className="mt-3 text-sm text-stone-500">
              Streaming inside HabeshaGram with the player pinned directly to this station.
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
  );
}

function RadioStationCard({
  station,
  active,
  onActivate
}: {
  station: RadioStation;
  active: boolean;
  onActivate: (station: RadioStation) => void;
}) {
  const [notice, setNotice] = useState("");
  const [autoplayToken, setAutoplayToken] = useState(0);

  useEffect(() => {
    if (!active) {
      setNotice("");
    }
  }, [active]);

  return (
    <article
      className={cn(
        "surface-panel overflow-hidden p-4 transition duration-200 sm:p-5",
        active ? "border-brand-300 ring-2 ring-brand-200/70" : "surface-card-hover border-brand-100"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">
            {station.frequency}
          </p>
          <h2 className="section-title mt-1 text-xl">{station.name}</h2>
          <p className="mt-1 text-sm text-stone-500">
            {station.city} / {station.provider}
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-[11px] font-semibold text-brand-800">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          {active ? "Active" : station.status === "live" ? "Live" : "Soon"}
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-stone-600">{station.description}</p>

      {station.tags?.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {station.tags.map((tag) => (
            <span
              key={`${station.id}-${tag}`}
              className="rounded-full border border-brand-100 bg-brand-50/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-800"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          className="rounded-full"
          onClick={() => {
            onActivate(station);
            setAutoplayToken((value) => value + 1);
            setNotice(
              station.playbackMode === "stream"
                ? `Opening ${station.name}. If autoplay is blocked, tap play in the player below.`
                : `${station.name} is opening in-place. Tap play inside the widget if audio does not begin automatically.`
            );
          }}
        >
          {active ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
          {active ? "Playing here" : "Play here"}
        </Button>

        <div className="inline-flex items-center gap-2 text-xs text-stone-500">
          <Headphones className="h-4 w-4 text-brand-700" />
          One station stays active at a time.
        </div>
      </div>

      {active ? (
        <>
          {notice ? (
            <div className="mt-4 rounded-[20px] border border-brand-100 bg-brand-50/60 px-4 py-3 text-sm text-stone-600">
              {notice}
            </div>
          ) : null}
          <RadioStationInlinePlayer
            station={station}
            autoplayToken={autoplayToken}
            onAutoplayResult={(result) => {
              if (result === "started") {
                setNotice(`${station.name} is playing in this card.`);
              } else if (result === "blocked") {
                setNotice(`Autoplay was blocked for ${station.name}. Tap play in the audio bar to start.`);
              } else if (result === "widget") {
                setNotice(`The ${station.name} widget is ready below. Tap play inside it if needed.`);
              } else {
                setNotice(`Playback is not available for ${station.name} right now.`);
              }
            }}
          />
        </>
      ) : null}
    </article>
  );
}

export function RadioPage() {
  const featuredStation = useMemo(
    () => radioStations.find((station) => station.featured) ?? radioStations[0],
    []
  );
  const remainingStations = useMemo(
    () => radioStations.filter((station) => station.id !== featuredStation?.id),
    [featuredStation]
  );
  const [activeStationId, setActiveStationId] = useState<string>(featuredStation?.id ?? "");

  return (
    <AppShell>
      <div className="page-stack">
        <section className="page-hero bg-white/96">
          <div className="bg-gradient-to-br from-brand-600 via-orange-400 to-brand-300 px-4 py-5 text-white sm:px-6 sm:py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
              Radio
            </p>
            <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <h1 className="page-title">
                  Radio
                </h1>
                <p className="mt-3 text-sm leading-6 text-white/90 sm:text-[15px]">
                  HabeshaGram radio now lives in its own space so every station is easy to browse,
                  open, and play without hunting for a separate player.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:min-w-[18rem]">
                <div className="rounded-[24px] bg-white/12 px-4 py-3 backdrop-blur">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
                    Stations
                  </p>
                  <p className="mt-2 text-base font-bold">{radioStations.length} live picks</p>
                </div>
                <div className="rounded-[24px] bg-white/12 px-4 py-3 backdrop-blur">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
                    Featured
                  </p>
                  <p className="mt-2 text-base font-bold">Ready inside Radio</p>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 py-4 sm:px-6 sm:py-5">
            <div className="rounded-[28px] border border-brand-100 bg-gradient-to-r from-brand-50/80 via-white to-orange-50/70 px-4 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-white/90 p-2 text-brand-700 shadow-sm">
                    <Waves className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                      How this works
                    </p>
                    <p className="mt-2 text-sm leading-6 text-stone-700">
                      Tap any station and its player opens directly inside that card. Widget and stream stations both stay in-place, and only one station is active at a time.
                    </p>
                  </div>
                </div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-50"
                >
                  Back to feed
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {featuredStation ? (
          <section className="section-stack">
            <SectionHeader
              eyebrow="Featured Station"
              title={`${featuredStation.name} is part of the main Radio lineup`}
              description="The featured live station stays inside the Radio section so it feels connected to the rest of the experience."
            />

            <RadioStationCard
              station={featuredStation}
              active={activeStationId === featuredStation.id}
              onActivate={(nextStation) => setActiveStationId(nextStation.id)}
            />
          </section>
        ) : null}

        <section className="section-stack">
          <SectionHeader
            eyebrow="All Stations"
            title="Choose a station and play it right there"
            description="Every card keeps its own player area so radio feels immediate on mobile and desktop."
          />

          <div className="grid gap-4">
            {remainingStations.map((station) => (
              <RadioStationCard
                key={station.id}
                station={station}
                active={activeStationId === station.id}
                onActivate={(nextStation) => setActiveStationId(nextStation.id)}
              />
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
