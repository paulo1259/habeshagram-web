"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { NowPlayingHero, StationCard } from "@/components/radio/radio-page";
import { ShareActions } from "@/components/ui/share-actions";
import { useLanguage } from "@/hooks/use-language";
import { radioStations } from "@/services/discovery-data";
import type { RadioStation } from "@/types";

/**
 * A page per station, so a link shared on WhatsApp opens on that station
 * rather than the general radio page.
 *
 * It does not autoplay. Browsers block audio that starts without a gesture, so
 * an attempted autoplay would just fail and show an error on a cold load.
 * The page leads with one large play button instead: one tap, and honest.
 */
export function StationPage({ station }: { station: RadioStation }) {
  const others = radioStations.filter((item) => item.id !== station.id);
  const { t } = useLanguage();

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3 px-4 pt-4 sm:px-0 sm:pt-0">
          <Link
            href="/radio"
            className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-stone-500 transition hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("radio.allStations")}
          </Link>
          <ShareActions
            path={`/radio/${station.id}`}
            title={t("radio.shareTitle", { name: station.name })}
            text={t("radio.shareText", { name: station.name })}
          />
        </div>

        <NowPlayingHero focusStation={station} />

        {station.tags?.length ? (
          <div className="flex flex-wrap gap-2 px-4 sm:px-0">
            {station.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-[0.1em] text-stone-500 ring-1 ring-white/[0.09]"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <section className="px-4 sm:px-0">
          <h2 className="font-display text-lg font-semibold tracking-[-0.02em] text-ink">{t("radio.moreStations")}</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {others.map((item) => (
              <StationCard key={item.id} station={item} />
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
