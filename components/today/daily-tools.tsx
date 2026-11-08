"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { formatEthiopianDate, toEthiopian } from "@/lib/ethiopian-calendar";

const cities = ["Washington, DC", "Seattle", "Los Angeles", "New York", "Toronto", "London", "Addis Ababa"];
const cityPaths: Record<string, string> = { "Washington, DC": "dc--washington", "Seattle": "wa--seattle", "Los Angeles": "ca--los-angeles", "New York": "ny--new-york", "Toronto": "canada--toronto", "London": "united-kingdom--london", "Addis Ababa": "ethiopia--addis-ababa" };
const panel = "rounded-[26px] border border-white/[0.08] bg-card/90 p-5 sm:p-6";
const field = "mt-3 min-h-12 w-full rounded-xl border border-white/20 bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500";

export function LocalDiscovery() {
  const { lang } = useLanguage();
  const am = lang === "am";
  const [city, setCity] = useState("");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("zema.today.city");
      if (saved && cities.includes(saved)) setCity(saved);
    } catch { /* Preferences remain usable when storage is unavailable. */ }
  }, []);
  return (
    <section className={panel} aria-labelledby="local-title">
      <MapPin className="h-5 w-5 text-brand-600" aria-hidden="true" />
      <h2 id="local-title" className="mt-3 font-display text-xl font-semibold">{am ? "በአቅራቢያዎ" : "A little closer to home"}</h2>
      <p className="mt-2 text-sm leading-6 text-stone-500">{am ? "በከተማዎ ያሉ የማህበረሰብ ዝግጅቶችን ያግኙ።" : "Find community gatherings, culture and a reason to get together."}</p>
      <label htmlFor="today-city" className="mt-5 block text-xs font-semibold text-stone-400">{am ? "ከተማዎን ይምረጡ" : "Your city"}</label>
      <select id="today-city" className={field} value={city} onChange={(e) => {
        setCity(e.target.value);
        try { localStorage.setItem("zema.today.city", e.target.value); } catch { /* Session-only fallback. */ }
      }}>
        <option value="">{am ? "ከተማ ይምረጡ" : "Choose a city"}</option>
        {cities.map((name) => <option key={name} value={name}>{name}</option>)}
      </select>
      <Link href={`/events${city ? `?city=${encodeURIComponent(city)}` : "?city=all"}`} className="mt-4 flex min-h-12 items-center justify-between rounded-xl bg-brand-500/10 px-3 text-sm font-semibold text-brand-600">{am ? "ዝግጅቶችን ይመልከቱ" : "Browse community events"}<ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link>
      {city ? <div className="mt-4 space-y-2">
        {[{ en: "Ethiopian events", am: "የኢትዮጵያ ዝግጅቶች", query: "Ethiopian" }, { en: "Eritrean events", am: "የኤርትራ ዝግጅቶች", query: "Eritrean" }].map((item) => (
          <a key={item.query} href={`https://www.eventbrite.com/d/${cityPaths[city]}/all-events/?q=${encodeURIComponent(item.query)}`} target="_blank" rel="noopener noreferrer" className="flex min-h-12 items-center justify-between gap-3 rounded-xl bg-white/[0.04] px-3 text-sm font-medium hover:bg-brand-500/10 focus-visible:outline focus-visible:outline-brand-500">
            {am ? item.am : item.en}<ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        ))}
        <p className="pt-2 text-xs leading-5 text-stone-400">{am ? "በEventbrite ላይ ይፈልጉ። ቦታና ቀን ከአዘጋጁ ጋር ያረጋግጡ።" : "Searches open on Eventbrite. Check dates and venues with the organizer; these are not curated Zema listings."}</p>
      </div> : <p className="mt-4 text-xs leading-5 text-stone-400">{am ? "ምርጫዎ በዚህ መሣሪያ ላይ ይቀመጣል።" : "Choose a city to explore events. Your preference stays on this device."}</p>}
    </section>
  );
}

export function DateConverter() {
  const { lang } = useLanguage();
  const am = lang === "am";
  const [value, setValue] = useState("");
  const parts = value.split("-").map(Number);
  const parsed = new Date(`${value}T12:00:00Z`);
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(value) && parts[0] >= 1900 && parts[0] <= 2100
    && Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  const converted = valid ? formatEthiopianDate(toEthiopian(parts[0], parts[1], parts[2]), lang) : "";
  return <section className={panel} aria-labelledby="converter-title">
    <CalendarDays className="h-5 w-5 text-brand-600" aria-hidden="true" />
    <h2 id="converter-title" className="mt-3 font-display text-xl font-semibold">{am ? "አንድ ቀን፣ ሁለት አቆጣጠሮች" : "One date. Two calendars."}</h2>
    <p className="mt-2 text-sm leading-6 text-stone-500">{am ? "የጎርጎሮሳዊ ቀንን ወደ ኢትዮጵያ አቆጣጠር ይቀይሩ።" : "Planning a birthday or a family celebration? Find its Ethiopian date."}</p>
    <label htmlFor="gregorian-date" className="mt-5 block text-xs font-semibold text-stone-400">{am ? "የጎርጎሮሳዊ ቀን" : "Gregorian date (1900–2100)"}</label>
    <input id="gregorian-date" type="date" min="1900-01-01" max="2100-12-31" value={value} onChange={(e) => setValue(e.target.value)} aria-invalid={Boolean(value && !valid)} aria-describedby="date-result" className={field} />
    <div id="date-result" aria-live="polite" className="mt-4 rounded-xl bg-brand-500/[0.08] p-4">
      <p className="text-xs text-stone-400">{am ? "የኢትዮጵያ ቀን" : "Ethiopian date"}</p>
      <p className="mt-2 text-lg font-semibold">{converted || (value ? (am ? "ከ1900 እስከ 2100 ያለ ቀን ይምረጡ" : "Enter a valid date from 1900 to 2100") : (am ? "ከላይ ቀን ይምረጡ" : "Choose a date above"))}</p>
    </div>
  </section>;
}
