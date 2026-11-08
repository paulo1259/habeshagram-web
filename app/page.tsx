"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Bookmark, Globe2, Sun } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { EthiopianCalendarCard } from "@/components/calendar/ethiopian-calendar-card";
import { RadioTeaser } from "@/components/radio/radio-teaser";
import { WorldNewsTeaser } from "@/components/world-news/world-news-teaser";
import { DateConverter, LocalDiscovery } from "@/components/today/daily-tools";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { logEvent } from "@/lib/analytics-events";

export default function HomePage() {
  const { currentUser } = useAuth();
  const { lang } = useLanguage();
  const am = lang === "am";
  const [date, setDate] = useState("");
  useEffect(() => { logEvent("home_view", currentUser?.id); }, [currentUser?.id]);
  useEffect(() => {
    const tick = () => setDate(new Intl.DateTimeFormat(lang === "am" ? "am-ET" : "en", { weekday: "long", month: "long", day: "numeric" }).format(new Date()));
    tick();
    const timer = window.setInterval(tick, 60_000);
    return () => window.clearInterval(timer);
  }, [lang]);
  return <AppShell>
    <div className="space-y-4 sm:space-y-5">
      <section className="relative overflow-hidden border-b border-white/[0.08] bg-card/90 px-5 py-9 sm:rounded-[30px] sm:border sm:px-8 sm:py-12">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="relative">
          <p className="flex flex-wrap items-center gap-2 font-mono text-xs text-brand-600"><Sun className="h-4 w-4" aria-hidden="true" /> {am ? "ዛሬ" : "TODAY"}<span className="text-stone-400">{date ? ` / ${date}` : ""}</span></p>
          <h1 className="mt-6 max-w-xl font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">{am ? "የእርስዎ ቀን።" : "Your day."}<br /><span className="text-gold">{am ? "የእርስዎ ማህበረሰብ።" : "Your community."}</span></h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-stone-500">{am ? "ወቅታዊ ዜና፣ ባህል እና ከማህበረሰብዎ ጋር የሚያገናኙ ነገሮች — በአንድ ቦታ።" : "A fresh perspective on the stories, traditions and places that keep us connected. Make a little room for home."}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/world-news" className="btn-glow inline-flex min-h-12 items-center gap-2 rounded-xl px-5 py-3 text-sm"><Globe2 className="h-4 w-4" aria-hidden="true" />{am ? "የዛሬ ዜና" : "Read today's brief"}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            <a href="#around-you" className="inline-flex min-h-12 items-center rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold hover:bg-white/5">{am ? "በአቅራቢያዎ ያስሱ" : "Explore around you"}</a>
          </div>
        </div>
      </section>
      <div className="px-3 sm:px-0">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-2">
          <h2 className="font-display text-xl font-semibold">{am ? "ማወቅ የሚገባዎት" : "Worth knowing today"}</h2>
          <Link href="/you" className="inline-flex min-h-11 items-center gap-2 text-sm text-stone-400 hover:text-ink"><Bookmark className="h-4 w-4" aria-hidden="true" />{am ? "የተቀመጡ ዜናዎች" : "Your saved stories"}</Link>
        </div>
        <WorldNewsTeaser />
      </div>
      <div className="px-3 sm:px-0"><EthiopianCalendarCard /></div>
      <div id="around-you" className="grid scroll-mt-24 gap-4 px-3 sm:grid-cols-2 sm:px-0"><LocalDiscovery /><DateConverter /></div>
      <div className="px-3 pb-4 sm:px-0"><RadioTeaser /></div>
    </div>
  </AppShell>;
}
