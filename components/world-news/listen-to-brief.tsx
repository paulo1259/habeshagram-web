"use client";

import { Headphones, Loader2, Pause, Play } from "lucide-react";
import { useBriefPlayer } from "@/hooks/use-brief-player";
import { useLanguage } from "@/hooks/use-language";
import { cn } from "@/lib/utils";

function formatClock(seconds: number) {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

/**
 * Play/pause for the spoken brief, with a progress bar once it is going.
 * The first play takes a few seconds while the audio is generated; after
 * that it is served from the CDN and starts at once.
 */
export function ListenToBrief({
  audioUrl,
  label,
  className
}: {
  audioUrl: string;
  label?: string;
  className?: string;
}) {
  const { state, src, progress, duration, play, pause } = useBriefPlayer();
  const { t } = useLanguage();
  const mine = src === audioUrl;
  const playing = mine && state === "playing";
  const loading = mine && state === "loading";
  const failed = mine && state === "error";

  return (
    <div className={cn("flex min-w-0 items-center gap-3", className)}>
      <button
        type="button"
        onClick={() => (playing ? pause() : play(audioUrl))}
        aria-label={t(playing ? "news.pauseBrief" : "news.listenBrief")}
        className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl bg-orange-500 px-3.5 text-[13px] font-semibold text-white transition hover:brightness-110 active:scale-[0.97]"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : playing ? (
          <Pause className="h-3.5 w-3.5 fill-current" />
        ) : mine && progress > 0 ? (
          <Play className="h-3.5 w-3.5 fill-current" />
        ) : (
          <Headphones className="h-3.5 w-3.5" />
        )}
        {loading
          ? t("news.preparing")
          : playing
            ? t("news.pause")
            : mine && progress > 0
              ? t("news.resume")
              : label ?? t("news.listen")}
      </button>

      {mine && duration > 0 ? (
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
            <div
              className="h-full rounded-full bg-orange-500 transition-[width] duration-300"
              style={{ width: `${Math.min(100, (progress / duration) * 100)}%` }}
            />
          </div>
          <span className="shrink-0 font-mono text-[11px] text-stone-400">
            {formatClock(progress)} / {formatClock(duration)}
          </span>
        </div>
      ) : failed ? (
        <span className="text-[12.5px] text-stone-500">{t("news.audioUnavailable")}</span>
      ) : null}
    </div>
  );
}
