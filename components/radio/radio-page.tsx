"use client";

import Link from "next/link";
import { AudioLines, ChevronRight, Headphones, Pause, Play, Radio, Waves } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { useRadio } from "@/hooks/use-radio";
import { logEvent } from "@/lib/analytics-events";
import { cn } from "@/lib/utils";
import { radioStations } from "@/services/discovery-data";
import type { RadioStation } from "@/types";

function RadioStationCard({ station }: { station: RadioStation }) {
  const {
    station: activeStation,
    status,
    isPlaying,
    playStation,
    togglePlayback,
    setExpanded
  } = useRadio();
  const isActive = activeStation?.id === station.id;
  const supportsBackground = station.playbackMode === "stream" && Boolean(station.streamUrl.trim());
  const usesWidget = Boolean(station.embedUrl.trim()) && !supportsBackground;

  async function handlePlay() {
    if (isActive && supportsBackground) {
      await togglePlayback();
      return;
    }

    if (isActive && usesWidget) {
      setExpanded(true);
      return;
    }

    logEvent("radio_play");
    await playStation(station);
  }

  const buttonLabel = isActive
    ? supportsBackground
      ? isPlaying
        ? "Pause"
        : status === "loading"
          ? "Connecting"
          : "Resume"
      : "Open player"
    : supportsBackground
      ? "Play in background"
      : usesWidget
        ? "Open live player"
        : "Unavailable";

  return (
    <article
      className={cn(
        "surface-panel overflow-hidden p-4 transition duration-200 sm:p-5",
        isActive ? "border-brand-400/45 ring-2 ring-brand-500/15" : "surface-card-hover border-brand-100"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">
            {station.frequency}
          </p>
          <h2 className="section-title mt-1 text-xl">{station.name}</h2>
          <p className="mt-1 text-sm text-stone-500">
            {station.city} · {station.provider}
          </p>
        </div>
        <div className="inline-flex shrink-0 items-center gap-2 rounded-full border border-emerald-500/15 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          {isActive ? "Selected" : station.status === "live" ? "Live" : "Soon"}
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
          disabled={!supportsBackground && !usesWidget}
          onClick={() => void handlePlay()}
        >
          {isActive && supportsBackground && isPlaying ? (
            <Pause className="mr-2 h-4 w-4 fill-current" />
          ) : (
            <Play className="mr-2 h-4 w-4 fill-current" />
          )}
          {buttonLabel}
        </Button>

        <div className="inline-flex items-center gap-2 text-xs text-stone-500">
          {supportsBackground ? (
            <>
              <AudioLines className="h-4 w-4 text-brand-700" />
              Persists across pages and supports device media controls.
            </>
          ) : usesWidget ? (
            <>
              <Headphones className="h-4 w-4 text-brand-700" />
              Provider widget stays mounted in the global player.
            </>
          ) : (
            <>
              <Radio className="h-4 w-4 text-stone-400" />
              A verified web stream is not available yet.
            </>
          )}
        </div>
      </div>
    </article>
  );
}

export function RadioPage() {
  const featuredStation = radioStations.find((station) => station.featured) ?? radioStations[0];
  const remainingStations = radioStations.filter((station) => station.id !== featuredStation?.id);
  const backgroundStationCount = radioStations.filter(
    (station) => station.playbackMode === "stream" && station.streamUrl.trim()
  ).length;

  return (
    <AppShell>
      <div className="page-stack">
        <section className="page-hero bg-card/96">
          <div className="bg-gradient-to-br from-brand-500 via-orange-400 to-orange-600 px-4 py-5 text-brand-950 sm:px-6 sm:py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-950/70">
              HabeshaGram Radio
            </p>
            <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <h1 className="page-title">Live radio that follows you</h1>
                <p className="mt-3 text-sm leading-6 text-brand-950/80 sm:text-[15px]">
                  Start a station once, keep browsing, and control direct streams from the persistent player or your device media controls.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:min-w-[19rem]">
                <div className="rounded-[24px] bg-black/15 px-4 py-3 backdrop-blur">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-950/70">Stations</p>
                  <p className="mt-2 text-base font-bold">{radioStations.length} live picks</p>
                </div>
                <div className="rounded-[24px] bg-black/15 px-4 py-3 backdrop-blur">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-950/70">Background ready</p>
                  <p className="mt-2 text-base font-bold">{backgroundStationCount} direct streams</p>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 py-4 sm:px-6 sm:py-5">
            <div className="rounded-[28px] border border-brand-100 bg-gradient-to-r from-brand-50/80 via-card to-orange-50/70 px-4 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-card/90 p-2 text-brand-700 shadow-sm">
                    <Waves className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Persistent playback</p>
                    <p className="mt-2 text-sm leading-6 text-stone-700">
                      The global player lives above the bottom navigation. Direct streams support play, pause, volume, station switching, reconnection, and Media Session controls. Provider widgets remain mounted while you navigate.
                    </p>
                  </div>
                </div>
                <Link
                  href="/"
                  className="inline-flex shrink-0 items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-semibold text-brand-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-50"
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
              title={`${featuredStation.name} leads the live lineup`}
              description="Start the featured station once and it stays available in the persistent radio dock while you browse the app."
            />
            <RadioStationCard station={featuredStation} />
          </section>
        ) : null}

        <section className="section-stack">
          <SectionHeader
            eyebrow="All Stations"
            title="Choose your live soundtrack"
            description="Direct streams offer the deepest background controls; embedded stations stay available through their persistent provider player."
          />
          <div className="grid gap-4">
            {remainingStations.map((station) => (
              <RadioStationCard key={station.id} station={station} />
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
