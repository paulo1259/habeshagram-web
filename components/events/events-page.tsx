"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, ArrowUpRight, CalendarDays, MapPin, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { useLanguage } from "@/hooks/use-language";
import { eventCities, eventDate, eventTime, isEventCity, isUpcoming, type CommunityEvent } from "@/lib/events/catalogue";

const categories = ["all", "culture", "music", "community"] as const;
type Category = (typeof categories)[number];
const categoryKey = { all: "events.all", culture: "events.culture", music: "events.music", community: "events.community" } as const;
/** Shared with the home page's city picker, so both remember the same choice. */
export const CITY_STORAGE_KEY = "zema.today.city";
const panel = "rounded-[26px] border border-white/[0.08] bg-card/90 p-5 sm:p-7";

export function EventCard({ event, detail = false }: { event: CommunityEvent; detail?: boolean }) {
  const { lang, t } = useLanguage();
  const checked = <>{t("events.checked")} {event.checkedOn}</>;
  return <article className={panel}>
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-brand-600">
      <span className="rounded-full bg-brand-500/10 px-3 py-1.5">{t(categoryKey[event.category])}</span>
      <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />{event.city}</span>
    </div>
    <p className="mt-5 font-mono text-sm text-brand-600">{eventDate(event, lang)}</p>
    <h2 className="mt-2 font-display text-2xl font-semibold leading-snug"><Link href={`/events/${event.id}`} className="hover:text-brand-600">{event.title}</Link></h2>
    <p className="mt-3 text-sm leading-6 text-stone-500">{event.summary}</p>
    <div className="mt-5 space-y-2 text-sm">
      <p className="font-medium">{event.venue}</p>
      <p className="text-stone-400">{eventTime(event, lang) ?? t("events.timeTba")}</p>
      {detail && event.address ? <p className="text-stone-400">{event.address}</p> : null}
    </div>
    {detail ? <div className="mt-5 border-t border-white/10 pt-5 text-sm text-stone-400">
      <p>{t("events.organizer")}: <span className="text-ink">{event.organizer}</span></p>
      <p className="mt-2">{t("events.source")}: {event.sourceName} · {checked}</p>
      <p className="mt-3 leading-6">{t("events.confirmNote")}</p>
      {!event.start ? <p className="mt-3">{t("events.dateOnlyNote")}</p> : null}
    </div> : null}
    <div className="mt-6 flex flex-wrap gap-3">
      {detail ? <>
        <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer" className="btn-glow inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-3 text-sm">{t("events.viewSource")}<ArrowUpRight className="h-4 w-4" aria-hidden="true" /></a>
        <a href={`/events/${event.id}/calendar`} download className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 px-4 py-3 text-sm"><CalendarDays className="h-4 w-4" aria-hidden="true" />{t("events.addToCalendar")}</a>
      </> : <Link href={`/events/${event.id}`} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-600">{t("events.seeDetails")}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>}
    </div>
    {!detail ? <p className="mt-3 text-xs text-stone-400">{event.sourceName} · {checked}</p> : null}
  </article>;
}

export function EventsPage({ events: listings, unavailable, initialNow }: { events: CommunityEvent[]; unavailable: boolean; initialNow: string }) {
  const { t } = useLanguage();
  const params = useSearchParams();
  const [city, setCity] = useState("all");
  const [category, setCategory] = useState<Category>("all");
  const [query, setQuery] = useState("");
  const [now, setNow] = useState(new Date(initialNow));
  useEffect(() => {
    const requested = params.get("city");
    if (requested === "all" || isEventCity(requested)) { setCity(requested); return; }
    // No (or an unlisted) city in the link: fall back to the last choice made here, including "all".
    try { const saved = localStorage.getItem(CITY_STORAGE_KEY); if (saved === "all" || isEventCity(saved)) setCity(saved); } catch { /* Use all cities. */ }
  }, [params]);
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 60_000); return () => window.clearInterval(timer); }, []);
  const chooseCity = (value: string) => {
    setCity(value);
    try { localStorage.setItem(CITY_STORAGE_KEY, value); } catch { /* Session-only fallback. */ }
  };
  const needle = query.trim().toLowerCase();
  const events = listings
    .filter((event) => isUpcoming(event, now)
      && (city === "all" || event.city === city)
      && (category === "all" || event.category === category)
      && `${event.title} ${event.summary} ${event.venue} ${event.organizer}`.toLowerCase().includes(needle))
    .sort((a, b) => a.date.localeCompare(b.date));
  return <AppShell><div className="space-y-5 px-3 py-4 sm:px-0 sm:py-0">
    <header className={`${panel} relative overflow-hidden`}>
      <p className="font-mono text-xs uppercase tracking-widest text-brand-600">{t("events.eyebrow")}</p>
      <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">{t("events.title")}</h1>
      <p className="mt-4 max-w-xl text-base leading-7 text-stone-500">{t("events.body")}</p>
      <p className="mt-4 text-xs leading-5 text-stone-400">{t("events.note")}</p>
      <Link href="/events/suggest" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 px-4 text-sm font-semibold hover:bg-white/5"><Plus className="h-4 w-4" aria-hidden="true" />{t("events.suggestCta")}</Link>
    </header>
    {unavailable ? <p role="alert" className="rounded-xl border border-white/15 p-4 text-sm text-stone-400">{t("events.unavailable")}</p> : null}
    <section aria-label={t("events.filter")} className={panel}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">{t("events.city")}<select value={city} onChange={(e) => chooseCity(e.target.value)} className="mt-2 block min-h-12 w-full rounded-xl border border-white/20 bg-surface px-3"><option value="all">{t("events.bothCities")}</option>{eventCities.map((name) => <option key={name}>{name}</option>)}</select></label>
        <label className="text-sm font-medium">{t("events.search")}<input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("events.searchPlaceholder")} className="mt-2 block min-h-12 w-full rounded-xl border border-white/20 bg-surface px-3" /></label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">{categories.map((key) => <button key={key} onClick={() => setCategory(key)} aria-pressed={category === key} className={`min-h-11 rounded-full border px-4 text-sm ${category === key ? "border-brand-500 bg-brand-500 text-brand-950" : "border-white/15 text-stone-400 hover:text-ink"}`}>{t(categoryKey[key])}</button>)}</div>
    </section>
    <p role="status" className="px-2 text-sm text-stone-400">{t(events.length === 1 ? "events.upcomingOne" : "events.upcomingMany", { n: events.length })}</p>
    {events.length ? <div className="grid gap-4 xl:grid-cols-2">{events.map((event) => <EventCard key={event.id} event={event} />)}</div> : <div className={`${panel} text-center`}><h2 className="text-xl font-semibold">{t("events.noMatchTitle")}</h2><p className="mt-3 text-sm text-stone-400">{t("events.noMatchBody")}</p><Link href="/events/suggest" className="mt-3 inline-block text-sm font-semibold text-brand-600">{t("events.suggestCta")}</Link><br /><button className="mt-5 min-h-11 rounded-xl border border-white/20 px-5" onClick={() => { chooseCity("all"); setCategory("all"); setQuery(""); }}>{t("events.clearFilters")}</button></div>}
  </div></AppShell>;
}

export function EventDetail({ event, past }: { event: CommunityEvent; past: boolean }) {
  const { t } = useLanguage();
  return <AppShell><div className="space-y-5 px-3 py-4 sm:px-0"><Link className="inline-flex min-h-11 items-center text-sm text-brand-600" href="/events?city=all">← {t("events.allEvents")}</Link>
    {past ? <p role="status" className="rounded-xl border border-white/15 p-4 text-stone-400">{t("events.ended")}</p> : null}
    <h1 className="sr-only">{event.title}</h1><EventCard event={event} detail /></div></AppShell>;
}
