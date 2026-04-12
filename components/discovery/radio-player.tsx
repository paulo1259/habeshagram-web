"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Radio } from "lucide-react";
import { RadioStation } from "@/types";
import { cn } from "@/lib/utils";

export function RadioPlayer({
  station,
  className
}: {
  station: RadioStation | null;
  className?: string;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const canRenderWidget = Boolean(station?.embedUrl.trim());
  const canPlayStream = !canRenderWidget && Boolean(station?.streamUrl.trim());

  useEffect(() => {
    if (!station) {
      setIsLoading(false);
      setHasError(false);
      return;
    }

    setHasError(false);
    setIsLoading(canRenderWidget || canPlayStream);
  }, [station, canPlayStream, canRenderWidget]);

  const badgeText = useMemo(() => {
    if (!station) {
      return "Choose a station";
    }

    if (canRenderWidget || canPlayStream) {
      return "Now playing";
    }

    return "Playback unavailable";
  }, [station, canPlayStream, canRenderWidget]);

  if (!station) {
    return (
      <div
        className={cn(
          "rounded-[26px] border border-dashed border-brand-200 bg-brand-50/60 p-5",
          className
        )}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
          Live Addis Radio
        </p>
        <h3 className="mt-2 text-lg font-bold tracking-tight text-ink">Choose a station</h3>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Select a station card to load it into the player panel.
        </p>
      </div>
    );
  }

  return (
    <aside
      className={cn(
        "overflow-hidden rounded-[28px] border border-brand-100 bg-white/98 shadow-soft lg:sticky lg:top-24",
        className
      )}
    >
      <div className="border-b border-brand-100 bg-gradient-to-br from-brand-50 via-white to-brand-50/60 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
              {badgeText}
            </p>
            <h3 className="mt-1 text-xl font-black tracking-tight text-ink">{station.name}</h3>
            <p className="mt-1 text-sm text-stone-500">
              {station.frequency} / {station.city}
            </p>
          </div>
          <div className="rounded-full bg-brand-100 p-2 text-brand-700">
            <Radio className="h-4 w-4" />
          </div>
        </div>
        <p className="mt-3 text-sm leading-6 text-stone-600">{station.description}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-800 shadow-sm">
            {station.provider}
          </span>
          {(station.tags ?? []).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-brand-50 px-3 py-1 text-[11px] font-medium text-brand-800"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {canRenderWidget && !hasError ? (
          <div className="space-y-3">
            <div className="relative overflow-hidden rounded-[22px] border border-brand-100 bg-stone-100">
              {isLoading ? (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-white/90 text-sm text-stone-600">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
                  Loading live player...
                </div>
              ) : null}
              <iframe
                title={`${station.name} live player`}
                src={station.embedUrl}
                className="h-[240px] w-full sm:h-[280px]"
                allow="autoplay; encrypted-media"
                loading="lazy"
                onLoad={() => {
                  setIsLoading(false);
                  setHasError(false);
                }}
                onError={() => {
                  setIsLoading(false);
                  setHasError(true);
                }}
              />
            </div>
            <p className="text-xs leading-5 text-stone-500">
              Player stays inside HabeshaGram and loads the station&apos;s live widget.
            </p>
          </div>
        ) : canPlayStream && !hasError ? (
          <div className="space-y-3">
            <div className="rounded-[22px] border border-brand-100 bg-brand-50/30 p-4">
              <audio
                controls
                preload="none"
                className="w-full"
                src={station.streamUrl}
                onLoadedData={() => {
                  setIsLoading(false);
                  setHasError(false);
                }}
                onError={() => {
                  setIsLoading(false);
                  setHasError(true);
                }}
              />
              {isLoading ? (
                <p className="mt-3 text-sm text-stone-500">Preparing live stream...</p>
              ) : null}
            </div>
            <p className="text-xs leading-5 text-stone-500">
              Direct stream mode uses the browser audio player and stays inside HabeshaGram.
            </p>
          </div>
        ) : (
          <div className="space-y-4 rounded-[22px] border border-brand-100 bg-brand-50/40 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-white p-2 text-brand-700 shadow-sm">
                <AlertCircle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">Playback unavailable</p>
                <p className="mt-1 text-sm leading-6 text-stone-600">
                  Embed code or stream URL needed for direct playback
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
