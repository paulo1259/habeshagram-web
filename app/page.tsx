"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { ArrowRight, Globe2, Play } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Reveal } from "@/components/motion/reveal";
import { RadioTeaser } from "@/components/radio/radio-teaser";
import { WorldNewsTeaser } from "@/components/world-news/world-news-teaser";
import { useAuth } from "@/hooks/use-auth";
import { logEvent } from "@/lib/analytics-events";
import { radioStations } from "@/services/discovery-data";

/**
 * Deterministic bar heights. A random walk would differ between the server
 * render and hydration, so the pattern is fixed and animated with CSS only.
 */
const WAVEFORM = [
  14, 26, 44, 62, 38, 70, 52, 80, 34, 58, 76, 46, 88, 30, 64, 50, 72, 40, 84, 28, 60, 48, 78, 36,
  66, 54, 82, 32, 56, 74, 42, 68, 24, 50, 38, 20
];

export default function HomePage() {
  const { currentUser } = useAuth();

  useEffect(() => {
    logEvent("home_view", currentUser?.id);
  }, [currentUser?.id]);

  const liveCount = useMemo(
    () => radioStations.filter((station) => station.status === "live").length,
    []
  );

  return (
    <AppShell>
      <div className="space-y-4 sm:space-y-5">
        <section className="relative overflow-hidden border-b border-white/[0.06] bg-card/90 px-4 py-8 sm:rounded-[30px] sm:border sm:px-8 sm:py-10 sm:shadow-soft">
          <div className="pointer-events-none absolute -left-24 -top-40 h-[420px] w-[420px] rounded-full bg-brand-500/[0.13] blur-[90px]" />
          <div className="pointer-events-none absolute -right-28 -top-24 h-[360px] w-[360px] animate-float-slow rounded-full bg-orange-500/[0.14] blur-[90px]" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/70 to-transparent" />

          <div className="relative">
            <p className="inline-flex animate-fade-in items-center gap-2.5 rounded-full border border-brand-500/30 bg-brand-500/[0.07] px-3.5 py-1.5">
              <span className="h-[7px] w-[7px] rounded-full bg-brand-500 shadow-glow-sm" />
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-brand-600">
                {liveCount} stations on air
              </span>
            </p>

            <h1 className="mt-5 animate-fade-up font-display text-[2.35rem] font-bold leading-[1.02] tracking-[-0.035em] sm:text-[3.4rem]">
              {currentUser ? (
                <>
                  Selam, <span className="text-gold">@{currentUser.username}</span>
                </>
              ) : (
                <>
                  Every station.
                  <br />
                  One frequency.
                </>
              )}
            </h1>

            <p
              className="mt-5 max-w-xl animate-fade-up text-[15px] leading-7 text-stone-500 sm:text-base"
              style={{ animationDelay: "120ms" }}
            >
              Live Ethiopian and Eritrean radio, streaming uninterrupted while you read the stories
              shaping East Africa today.
            </p>

            <div
              className="mt-7 flex animate-fade-up flex-wrap items-center gap-3"
              style={{ animationDelay: "200ms" }}
            >
              <Link
                href="/radio"
                className="btn-glow inline-flex items-center gap-2.5 rounded-[14px] px-6 py-3.5 text-[15px] hover:-translate-y-0.5"
              >
                <Play className="h-4 w-4 fill-current" />
                Start listening
              </Link>
              <Link
                href="/world-news"
                className="inline-flex items-center gap-2.5 rounded-[14px] border border-white/[0.12] px-6 py-3.5 text-[15px] font-medium text-ink transition hover:-translate-y-0.5 hover:border-brand-500/35"
              >
                <Globe2 className="h-4 w-4" />
                Today&apos;s brief
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div
              className="mt-9 flex animate-fade-up items-end gap-[3px] opacity-70"
              style={{ animationDelay: "280ms", height: 56 }}
              aria-hidden="true"
            >
              {WAVEFORM.map((height, index) => (
                <span
                  key={index}
                  className="flex-1 rounded-[2px]"
                  style={{
                    height: `${Math.round(height * 0.55)}px`,
                    background: index % 5 === 0 ? "#7c6cf6" : "#45e0c8"
                  }}
                />
              ))}
            </div>
          </div>
        </section>

        <Reveal>
          <WorldNewsTeaser />
        </Reveal>
        <Reveal delay={40}>
          <RadioTeaser />
        </Reveal>
      </div>
    </AppShell>
  );
}
