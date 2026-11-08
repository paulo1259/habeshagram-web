"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, CalendarDays, MapPin } from "lucide-react";
import { CITY_STORAGE_KEY } from "@/components/events/events-page";
import { useLanguage } from "@/hooks/use-language";
import { isEventCity } from "@/lib/events/catalogue";
import { formatEthiopianDate, toEthiopian } from "@/lib/ethiopian-calendar";

/**
 * Cities offered for Eventbrite searches, with their Eventbrite location slugs.
 * Only some have curated Zema listings — see eventCities in lib/events/catalogue.
 */
const eventbritePaths: Record<string, string> = {
  "Washington, DC": "dc--washington",
  "Seattle": "wa--seattle",
  "Los Angeles": "ca--los-angeles",
  "New York": "ny--new-york",
  "Toronto": "canada--toronto",
  "London": "united-kingdom--london",
  "Addis Ababa": "ethiopia--addis-ababa"
};
const discoveryCities = Object.keys(eventbritePaths);
const searches = [
  { key: "today.ethiopianEvents", query: "Ethiopian" },
  { key: "today.eritreanEvents", query: "Eritrean" }
] as const;
const panel = "rounded-[26px] border border-white/[0.08] bg-card/90 p-5 sm:p-6";
const field = "mt-3 min-h-12 w-full rounded-xl border border-white/20 bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500";

export function LocalDiscovery() {
  const { t } = useLanguage();
  const [city, setCity] = useState("");
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CITY_STORAGE_KEY);
      if (saved && discoveryCities.includes(saved)) setCity(saved);
    } catch { /* Preferences remain usable when storage is unavailable. */ }
  }, []);
  const listed = isEventCity(city);
  return (
    <section className={panel} aria-labelledby="local-title">
      <MapPin className="h-5 w-5 text-brand-600" aria-hidden="true" />
      <h2 id="local-title" className="mt-3 font-display text-xl font-semibold">{t("today.localTitle")}</h2>
      <p className="mt-2 text-sm leading-6 text-stone-500">{t("today.localBody")}</p>
      <label htmlFor="today-city" className="mt-5 block text-xs font-semibold text-stone-400">{t("today.yourCity")}</label>
      <select id="today-city" className={field} value={city} onChange={(e) => {
        setCity(e.target.value);
        try { localStorage.setItem(CITY_STORAGE_KEY, e.target.value); } catch { /* Session-only fallback. */ }
      }}>
        <option value="">{t("today.chooseCity")}</option>
        {discoveryCities.map((name) => <option key={name} value={name}>{name}</option>)}
      </select>
      <Link href={`/events?city=${listed ? encodeURIComponent(city) : "all"}`} className="mt-4 flex min-h-12 items-center justify-between rounded-xl bg-brand-500/10 px-3 text-sm font-semibold text-brand-600">{listed ? t("today.browseCityEvents", { city }) : t("today.browseEvents")}<ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link>
      {city ? <div className="mt-4 space-y-2">
        {!listed ? <p className="pb-1 text-xs leading-5 text-stone-400">{t("today.noListings", { city })}</p> : null}
        {searches.map((item) => (
          <a key={item.query} href={`https://www.eventbrite.com/d/${eventbritePaths[city]}/all-events/?q=${encodeURIComponent(item.query)}`} target="_blank" rel="noopener noreferrer" className="flex min-h-12 items-center justify-between gap-3 rounded-xl bg-white/[0.04] px-3 text-sm font-medium hover:bg-brand-500/10 focus-visible:outline focus-visible:outline-brand-500">
            {t(item.key)}<ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        ))}
        <p className="pt-2 text-xs leading-5 text-stone-400">{t("today.eventbriteNote")}</p>
      </div> : <p className="mt-4 text-xs leading-5 text-stone-400">{t("today.chooseCityHint")}</p>}
    </section>
  );
}

export function DateConverter() {
  const { lang, t } = useLanguage();
  const [value, setValue] = useState("");
  const parts = value.split("-").map(Number);
  const parsed = new Date(`${value}T12:00:00Z`);
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(value) && parts[0] >= 1900 && parts[0] <= 2100
    && Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
  const converted = valid ? formatEthiopianDate(toEthiopian(parts[0], parts[1], parts[2]), lang) : "";
  return <section className={panel} aria-labelledby="converter-title">
    <CalendarDays className="h-5 w-5 text-brand-600" aria-hidden="true" />
    <h2 id="converter-title" className="mt-3 font-display text-xl font-semibold">{t("today.converterTitle")}</h2>
    <p className="mt-2 text-sm leading-6 text-stone-500">{t("today.converterBody")}</p>
    <label htmlFor="gregorian-date" className="mt-5 block text-xs font-semibold text-stone-400">{t("today.gregorianLabel")}</label>
    <input id="gregorian-date" type="date" min="1900-01-01" max="2100-12-31" value={value} onChange={(e) => setValue(e.target.value)} aria-invalid={Boolean(value && !valid)} aria-describedby="date-result" className={field} />
    <div id="date-result" aria-live="polite" className="mt-4 rounded-xl bg-brand-500/[0.08] p-4">
      <p className="text-xs text-stone-400">{t("today.ethiopianDate")}</p>
      <p className="mt-2 text-lg font-semibold">{converted || (value ? t("today.invalidDate") : t("today.chooseDate"))}</p>
    </div>
  </section>;
}
