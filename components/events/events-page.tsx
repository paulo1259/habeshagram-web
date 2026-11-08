"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { useLanguage } from "@/hooks/use-language";
import { communityEvents, eventDate, eventTime, isUpcoming, type CommunityEvent } from "@/lib/events/catalogue";

const categories = { all: ["All events", "ሁሉም"], culture: ["Culture & coffee", "ባህልና ቡና"], music: ["Music & nightlife", "ሙዚቃ"], community: ["Community", "ማህበረሰብ"] } as const;
const cities = ["Washington, DC", "Seattle"];
const panel = "rounded-[26px] border border-white/[0.08] bg-card/90 p-5 sm:p-7";

export function EventCard({ event, detail = false }: { event: CommunityEvent; detail?: boolean }) {
  const { lang } = useLanguage();
  const am = lang === "am";
  return <article className={panel}>
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-brand-600">
      <span className="rounded-full bg-brand-500/10 px-3 py-1.5">{categories[event.category][am ? 1 : 0]}</span>
      <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />{event.city}</span>
    </div>
    <p className="mt-5 font-mono text-sm text-brand-600">{eventDate(event, lang)}</p>
    <h2 className="mt-2 font-display text-2xl font-semibold leading-snug"><Link href={`/events/${event.id}`} className="hover:text-brand-600">{event.title}</Link></h2>
    <p className="mt-3 text-sm leading-6 text-stone-500">{event.summary}</p>
    <div className="mt-5 space-y-2 text-sm">
      <p className="font-medium">{event.venue}</p>
      <p className="text-stone-400">{eventTime(event, lang)}</p>
      {detail && event.address ? <p className="text-stone-400">{event.address}</p> : null}
    </div>
    {detail ? <div className="mt-5 border-t border-white/10 pt-5 text-sm text-stone-400">
      <p>{am ? "አዘጋጅ" : "Organizer"}: <span className="text-ink">{event.organizer}</span></p>
      <p className="mt-2">{am ? "ምንጭ" : "Source"}: {event.sourceName} · {am ? "የተመረመረበት ቀን" : "Checked"} {event.checkedOn}</p>
      <p className="mt-3 leading-6">{am ? "ከመሄድዎ በፊት ሰዓት፣ ቦታና የመግቢያ መስፈርቶችን ከአዘጋጁ ጋር ያረጋግጡ።" : "Confirm time, venue, admission requirements and ticket availability with the organizer before you travel."}</p>
      {!event.start ? <p className="mt-3">{am ? "የቀን ማስታወሻ ብቻ፤ ሰዓቱ ገና አልተገለጸም።" : "The calendar download is a date reminder, not a confirmed all-day schedule."}</p> : null}
    </div> : null}
    <div className="mt-6 flex flex-wrap gap-3">
      {detail ? <>
        <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer" className="btn-glow inline-flex min-h-11 items-center gap-2 rounded-xl px-4 py-3 text-sm">{am ? "የዝግጅቱ ምንጭ" : "View source & tickets"}<ArrowUpRight className="h-4 w-4" aria-hidden="true" /></a>
        <a href={`/events/${event.id}/calendar`} download className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 px-4 py-3 text-sm"><CalendarDays className="h-4 w-4" aria-hidden="true" />{am ? "ወደ ቀን መቁጠሪያ ያክሉ" : "Add to calendar"}</a>
      </> : <Link href={`/events/${event.id}`} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-600">{am ? "ዝርዝር ይመልከቱ" : "See event details"}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>}
    </div>
    {!detail ? <p className="mt-3 text-xs text-stone-400">{event.sourceName} · {am ? "የተመረመረበት ቀን" : "Checked"} {event.checkedOn}</p> : null}
  </article>;
}

export function EventsPage({ initialNow }: { initialNow: string }) {
  const { lang } = useLanguage();
  const am = lang === "am";
  const params = useSearchParams();
  const [city, setCity] = useState("all");
  const [category, setCategory] = useState<keyof typeof categories>("all");
  const [query, setQuery] = useState("");
  const [now, setNow] = useState(new Date(initialNow));
  useEffect(() => {
    const requested = params.get("city");
    if (requested === "all" || (requested && cities.includes(requested))) { setCity(requested); return; }
    try { const saved = localStorage.getItem("zema.today.city"); if (saved && cities.includes(saved)) setCity(saved); } catch { /* Use all cities. */ }
  }, [params]);
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 60_000); return () => window.clearInterval(timer); }, []);
  const events = communityEvents.filter((event) => isUpcoming(event, now) && (city === "all" || event.city === city) && (category === "all" || event.category === category) && `${event.title} ${event.summary} ${event.venue} ${event.organizer}`.toLowerCase().includes(query.trim().toLowerCase())).sort((a,b) => a.date.localeCompare(b.date));
  return <AppShell><div className="space-y-5 px-3 py-4 sm:px-0 sm:py-0">
    <header className={`${panel} relative overflow-hidden`}>
      <p className="font-mono text-xs uppercase tracking-widest text-brand-600">{am ? "አብረን እንገናኝ" : "Better together"}</p>
      <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">{am ? "የመገናኘት ምክንያት።" : "A reason to gather."}</h1>
      <p className="mt-4 max-w-xl text-base leading-7 text-stone-500">{am ? "በዋሽንግተን ዲሲ እና ሲያትል ያሉ የማህበረሰብ ዝግጅቶች። ዝርዝሩን ይመልከቱ፣ ቀኑን ያስቀምጡ።" : "Coffee, culture and community in Washington, DC and Seattle. Find your next plan, check the details, and make it a date."}</p>
      <p className="mt-4 text-xs leading-5 text-stone-400">{am ? "ከተጠቀሱ ምንጮች የተመረጠ ትንሽ ዝርዝር። የዝግጅት ስሞችና መግለጫዎች በምንጩ ቋንቋ ቀርበዋል።" : "A small, source-linked selection—not a complete city calendar. Event descriptions are shown in their source language."}</p>
    </header>
    <section aria-label={am ? "ዝግጅቶችን አጣራ" : "Filter events"} className={panel}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">{am ? "ከተማ" : "City"}<select value={city} onChange={(e) => { setCity(e.target.value); try { if(e.target.value !== "all") localStorage.setItem("zema.today.city",e.target.value); } catch {} }} className="mt-2 block min-h-12 w-full rounded-xl border border-white/20 bg-surface px-3"><option value="all">{am ? "ሁለቱም ከተሞች" : "Both cities"}</option>{cities.map((name)=><option key={name}>{name}</option>)}</select></label>
        <label className="text-sm font-medium">{am ? "ፈልግ" : "Search events"}<input type="search" value={query} onChange={(e)=>setQuery(e.target.value)} placeholder={am ? "ርዕስ፣ ቦታ ወይም አዘጋጅ" : "Title, venue or organizer"} className="mt-2 block min-h-12 w-full rounded-xl border border-white/20 bg-surface px-3" /></label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">{(Object.keys(categories) as Array<keyof typeof categories>).map((key)=><button key={key} onClick={()=>setCategory(key)} aria-pressed={category === key} className={`min-h-11 rounded-full border px-4 text-sm ${category === key ? "border-brand-500 bg-brand-500 text-brand-950" : "border-white/15 text-stone-400 hover:text-ink"}`}>{categories[key][am ? 1 : 0]}</button>)}</div>
    </section>
    <p role="status" className="px-2 text-sm text-stone-400">{events.length} {am ? "የሚመጡ ዝግጅቶች" : `upcoming event${events.length === 1 ? "" : "s"}`}</p>
    {events.length ? <div className="grid gap-4 xl:grid-cols-2">{events.map((event)=><EventCard key={event.id} event={event} />)}</div> : <div className={`${panel} text-center`}><h2 className="text-xl font-semibold">{am ? "ዝግጅት አልተገኘም" : "No matching upcoming events"}</h2><p className="mt-3 text-sm text-stone-400">{am ? "ሌላ ከተማ ወይም ምድብ ይሞክሩ።" : "Try another city or category. New listings will appear as they are reviewed."}</p><button className="mt-5 min-h-11 rounded-xl border border-white/20 px-5" onClick={()=>{setCity("all");setCategory("all");setQuery("");}}>{am ? "ማጣሪያዎችን አጽዳ" : "Clear filters"}</button></div>}
  </div></AppShell>;
}

export function EventDetail({ event, past }: { event: CommunityEvent; past: boolean }) {
  const { lang } = useLanguage();
  return <AppShell><div className="space-y-5 px-3 py-4 sm:px-0"><Link className="inline-flex min-h-11 items-center text-sm text-brand-600" href="/events?city=all">← {lang === "am" ? "ሁሉም ዝግጅቶች" : "All events"}</Link>
    {past ? <p role="status" className="rounded-xl border border-white/15 p-4 text-stone-400">{lang === "am" ? "ይህ ዝግጅት አልፏል።" : "This event has ended. Details are kept for reference."}</p> : null}
    <h1 className="sr-only">{event.title}</h1><EventCard event={event} detail /></div></AppShell>;
}
