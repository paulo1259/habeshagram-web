"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowRight, Globe2, Play } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Reveal } from "@/components/motion/reveal";
import { EthiopianCalendarCard } from "@/components/calendar/ethiopian-calendar-card";
import { OnAirBoard } from "@/components/radio/on-air-board";
import { FrequencyDial } from "@/components/radio/frequency-dial";
import { SignalOrb } from "@/components/brand/signal-orb";
import { RadioTeaser } from "@/components/radio/radio-teaser";
import { WorldNewsTeaser } from "@/components/world-news/world-news-teaser";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { useStationHealth } from "@/hooks/use-station-health";
import { logEvent } from "@/lib/analytics-events";
import { radioStations } from "@/services/discovery-data";


export default function HomePage() {
  const { currentUser } = useAuth();

  useEffect(() => {
    logEvent("home_view", currentUser?.id);
  }, [currentUser?.id]);

  const { onAirCount } = useStationHealth();
  const { t } = useLanguage();
  const liveLabel =
    onAirCount === null
      ? t("home.stations", { total: radioStations.length })
      : t("home.stationsOnAir", { n: onAirCount, total: radioStations.length });

  return (
    <AppShell>
      <div className="space-y-4 sm:space-y-5">
        <section className="relative overflow-hidden border-b border-white/[0.06] bg-card/90 px-4 py-8 sm:rounded-[30px] sm:border sm:px-8 sm:py-10 sm:shadow-soft">
          <div className="pointer-events-none absolute -left-24 -top-40 h-[420px] w-[420px] rounded-full bg-brand-500/[0.13] blur-[90px]" />
          <div className="pointer-events-none absolute -right-28 -top-24 h-[360px] w-[360px] animate-float-slow rounded-full bg-orange-500/[0.14] blur-[90px]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/70 to-transparent" />
          <SignalOrb className="pointer-events-none absolute -right-16 -top-16 hidden md:block" />

          <div className="relative">
            <p className="inline-flex animate-fade-in items-center gap-2.5 rounded-full border border-brand-500/30 bg-brand-500/[0.07] px-3.5 py-1.5">
              <span className="h-[7px] w-[7px] rounded-full bg-brand-500 shadow-glow-sm" />
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-brand-600">
                {liveLabel}
              </span>
            </p>

            <h1 className="mt-5 animate-fade-up font-display text-[2.35rem] font-bold leading-[1.02] tracking-[-0.035em] sm:text-[3.4rem]">
              {currentUser ? (
                <>
                  {t("home.greeting")} <span className="text-gold">@{currentUser.username}</span>
                </>
              ) : (
                <>
                  {t("home.heroLine1")}
                  <br />
                  {t("home.heroLine2")}
                </>
              )}
            </h1>

            <p
              className="mt-5 max-w-xl animate-fade-up text-[15px] leading-7 text-stone-500 sm:text-base"
              style={{ animationDelay: "120ms" }}
            >
              {t("home.heroBody")}
            </p>

            <div
              className="mt-7 grid animate-fade-up grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center"
              style={{ animationDelay: "200ms" }}
            >
              <Link
                href="/radio"
                className="btn-glow inline-flex items-center justify-center gap-2 rounded-[14px] px-4 py-3.5 text-[14.5px] hover:-translate-y-0.5 sm:gap-2.5 sm:px-6 sm:text-[15px]"
              >
                <Play className="h-4 w-4 fill-current" />
                {t("home.startListening")}
              </Link>
              <Link
                href="/world-news"
                className="inline-flex items-center justify-center gap-2 rounded-[14px] border border-white/[0.12] px-4 py-3.5 text-[14.5px] font-medium text-ink transition hover:-translate-y-0.5 hover:border-brand-500/35 sm:gap-2.5 sm:px-6 sm:text-[15px]"
              >
                <Globe2 className="h-4 w-4" />
                {t("home.todaysBrief")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-9 animate-fade-up" style={{ animationDelay: "280ms" }}>
              <FrequencyDial />
            </div>
          </div>
        </section>

        <Reveal>
          <OnAirBoard />
        </Reveal>
        <Reveal delay={20}>
          <EthiopianCalendarCard />
        </Reveal>
        <div className="grid gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <Reveal delay={40}>
            <WorldNewsTeaser />
          </Reveal>
          <Reveal delay={80}>
            <RadioTeaser />
          </Reveal>
        </div>
      </div>
    </AppShell>
  );
}
