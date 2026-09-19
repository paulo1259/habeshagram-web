"use client";

import Link from "next/link";
import { Globe2, Mic2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Reveal } from "@/components/motion/reveal";
import { RadioTeaser } from "@/components/radio/radio-teaser";
import { WorldNewsTeaser } from "@/components/world-news/world-news-teaser";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const { currentUser } = useAuth();

  return (
    <AppShell>
      <div className="space-y-4 sm:space-y-5">
        <section className="relative overflow-hidden border-b border-white/[0.06] bg-card/90 px-3 py-5 sm:rounded-[32px] sm:border sm:px-6 sm:py-7 sm:shadow-soft">
          <div className="pointer-events-none absolute inset-0 bg-gold-radial" />
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 animate-float-slow rounded-full bg-brand-500/10 blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/70 to-transparent" />

          <div className="relative">
            <p className="animate-fade-in text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">
              Habesha Community
            </p>
            <h1 className="mt-2 animate-fade-up font-display text-[1.9rem] font-bold leading-[1.05] tracking-tight sm:text-[2.6rem]">
              {currentUser ? (
                <>
                  Selam, <span className="text-gold">@{currentUser.username}</span>
                </>
              ) : (
                <>
                  Welcome to <span className="text-gold">HabeshaGram</span>
                </>
              )}
            </h1>
            <p
              className="mt-3 max-w-2xl animate-fade-up text-sm leading-6 text-stone-500 sm:text-[15px]"
              style={{ animationDelay: "120ms" }}
            >
              Live Ethiopian and Eritrean radio, and the East Africa stories worth knowing about today.
            </p>

            <div
              className="mt-5 flex animate-fade-up flex-wrap gap-2.5"
              style={{ animationDelay: "220ms" }}
            >
              <Link
                href="/radio"
                className="btn-glow inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm hover:-translate-y-0.5"
              >
                <Mic2 className="h-4 w-4" />
                Listen now
              </Link>
              <Link
                href="/world-news"
                className="inline-flex items-center gap-2 rounded-full border border-white/[0.09] bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-stone-400 transition hover:-translate-y-0.5 hover:border-brand-500/35 hover:text-ink"
              >
                <Globe2 className="h-4 w-4" />
                Read the news
              </Link>
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
