"use client";

import Link from "next/link";
import { ArrowRight, Heart, Pause, Play } from "lucide-react";
import { useLibrary } from "@/hooks/use-library";
import { useLanguage } from "@/hooks/use-language";
import { useRadio } from "@/hooks/use-radio";
import { cn } from "@/lib/utils";
import { loginHref } from "@/lib/safe-next";
import { stationMeta } from "@/lib/i18n/stations";
import { radioStations } from "@/services/discovery-data";
import type { RadioStation } from "@/types";

/**
 * The home page's radio card. It leads with whatever is most likely to be
 * wanted: the station already playing, else the one you were last on, else
 * the featured pick — and then your favourites as one-tap chips.
 */
export function RadioTeaser() {
  const { station: active, isPlaying, playStation, togglePlayback } = useRadio();
  const { lastStation, favoriteStations, isSignedIn } = useLibrary();
  const featured = radioStations.find((station) => station.featured) ?? radioStations[0];
  const { t, lang } = useLanguage();

  const lead = active ?? lastStation ?? featured;
  const leadIsActive = active?.id === lead.id;
  const leadLive = leadIsActive && isPlaying;
  const eyebrow = t(leadIsActive ? "radio.nowPlaying" : lastStation ? "radio.resume" : "radio.featured");

  const play = (station: RadioStation) =>
    void (active?.id === station.id ? togglePlayback() : playStation(station));

  const chips = favoriteStations.filter((station) => station.id !== lead.id);

  return (
    <section className="rounded-[26px] border border-white/[0.08] bg-card/90 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-stone-400">{eyebrow}</span>
        <Link
          href="/radio"
          className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand-700 transition hover:text-ink"
        >
          {t("radio.allStations")}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <button
          type="button"
          onClick={() => play(lead)}
          aria-label={t(leadLive ? "radio.pauseName" : "radio.playName", { name: lead.name })}
          className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-brand-500 text-brand-950 shadow-glow-sm transition hover:scale-[1.04] active:scale-[0.97]"
        >
          {leadLive ? <Pause className="h-5 w-5 fill-current" /> : <Play className="ml-0.5 h-5 w-5 fill-current" />}
        </button>
        <div className="min-w-0">
          <Link
            href={`/radio/${lead.id}`}
            className="block truncate font-display text-xl font-semibold tracking-[-0.02em] text-ink transition hover:text-brand-700"
          >
            {lead.name}
          </Link>
          <p className="mt-0.5 font-mono text-[12px] text-stone-400">
            {stationMeta(lead, lang)}
          </p>
        </div>
      </div>

      {chips.length ? (
        <div className="mt-5 border-t border-white/[0.07] pt-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-stone-400">{t("nav.yourStations")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {chips.map((station) => {
              const live = active?.id === station.id && isPlaying;
              return (
                <button
                  key={station.id}
                  type="button"
                  onClick={() => play(station)}
                  className={cn(
                    "inline-flex min-h-10 items-center gap-2 rounded-xl px-3.5 text-[13px] font-semibold transition",
                    live
                      ? "bg-brand-500/[0.14] text-brand-700 ring-1 ring-brand-500/50"
                      : "text-stone-500 ring-1 ring-white/[0.1] hover:text-ink"
                  )}
                >
                  {live ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                  {station.name}
                </button>
              );
            })}
          </div>
        </div>
      ) : !isSignedIn ? (
        <p className="mt-5 flex items-center gap-2 border-t border-white/[0.07] pt-4 text-[13px] text-stone-500">
          <Heart className="h-3.5 w-3.5 shrink-0 text-orange-700" />
          <span>
            <Link href={loginHref("/")} className="font-semibold text-brand-700 hover:text-ink">
              {t("nav.signIn")}
            </Link>{" "}
            {t("teaser.radio.signInPrompt")}
          </span>
        </p>
      ) : null}
    </section>
  );
}
