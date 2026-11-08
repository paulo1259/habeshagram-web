"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { cityTimeZone, eventCategories, eventCities, isEventCity, localDate, zonedTimeToIso, type EventCategory } from "@/lib/events/catalogue";
import { loginHref } from "@/lib/safe-next";
import { SuggestionLimitError, suggestEvent } from "@/services/events-service";

const panel = "rounded-[26px] border border-white/[0.08] bg-card/90 p-5 sm:p-7";
const field = "mt-2 block min-h-12 w-full rounded-xl border border-white/20 bg-surface px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500";
const label = "block text-sm font-medium";
const categoryKey = { culture: "events.culture", music: "events.music", community: "events.community" } as const;

const empty = { title: "", city: "", category: "community", date: "", startTime: "", endTime: "", venue: "", address: "", organizer: "", summary: "", sourceUrl: "" };
type Form = typeof empty;

export function SuggestEventPage() {
  const { currentUser, isReady, authMode } = useAuth();
  const { t } = useLanguage();
  const [form, setForm] = useState<Form>(empty);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const set = (key: keyof Form) => (e: { target: { value: string } }) => setForm((current) => ({ ...current, [key]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!isEventCity(form.city)) return setError(t("suggest.errorCity"));
    const zone = cityTimeZone[form.city];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date) || form.date < localDate(new Date(), zone)) return setError(t("suggest.errorDate"));
    if (form.endTime && !form.startTime) return setError(t("suggest.errorEndWithoutStart"));
    let url: URL;
    try { url = new URL(form.sourceUrl.trim()); } catch { return setError(t("suggest.errorUrl")); }
    if (url.protocol !== "https:") return setError(t("suggest.errorUrl"));

    const start = form.startTime ? zonedTimeToIso(form.date, form.startTime, zone) : undefined;
    let end = form.endTime ? zonedTimeToIso(form.date, form.endTime, zone) : undefined;
    // An end time earlier than the start means it runs past midnight.
    if (start && end && Date.parse(end) <= Date.parse(start)) end = new Date(Date.parse(end) + 24 * 60 * 60 * 1000).toISOString();

    setSending(true);
    try {
      await suggestEvent({
        title: form.title.trim(), city: form.city, category: form.category as EventCategory, date: form.date, start, end,
        venue: form.venue.trim(), address: form.address.trim() || undefined, organizer: form.organizer.trim(),
        summary: form.summary.trim(), sourceUrl: url.toString()
      });
      setSent(true);
      setForm(empty);
    } catch (failure) {
      console.error("[suggest-event]", failure);
      setError(t(failure instanceof SuggestionLimitError ? "suggest.errorLimit" : "suggest.errorFailed"));
    } finally {
      setSending(false);
    }
  }

  let body;
  if (!isReady) {
    body = <p className="text-sm text-stone-400">{t("suggest.loading")}</p>;
  } else if (authMode === "unconfigured") {
    body = <p className="text-sm text-stone-400">{t("suggest.unconfigured")}</p>;
  } else if (!currentUser) {
    body = <div>
      <p className="text-sm leading-6 text-stone-500">{t("suggest.signInBody")}</p>
      <Link href={loginHref("/events/suggest")} className="btn-glow mt-5 inline-flex min-h-12 items-center rounded-xl px-5 text-sm">{t("suggest.signIn")}</Link>
    </div>;
  } else if (sent) {
    body = <div role="status">
      <CheckCircle2 className="h-6 w-6 text-brand-600" aria-hidden="true" />
      <h2 className="mt-3 font-display text-xl font-semibold">{t("suggest.sentTitle")}</h2>
      <p className="mt-2 text-sm leading-6 text-stone-500">{t("suggest.sentBody")}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={() => setSent(false)} className="min-h-11 rounded-xl border border-white/20 px-4 text-sm font-semibold">{t("suggest.another")}</button>
        <Link href="/events" className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-brand-600">{t("events.allEvents")}</Link>
      </div>
    </div>;
  } else {
    body = <form onSubmit={submit} className="space-y-5">
      <label className={label}>{t("suggest.title")}<input required maxLength={160} value={form.title} onChange={set("title")} className={field} /></label>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className={label}>{t("events.city")}<select required value={form.city} onChange={set("city")} className={field}><option value="">{t("today.chooseCity")}</option>{eventCities.map((name) => <option key={name}>{name}</option>)}</select></label>
        <label className={label}>{t("suggest.category")}<select value={form.category} onChange={set("category")} className={field}>{eventCategories.map((key) => <option key={key} value={key}>{t(categoryKey[key])}</option>)}</select></label>
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        <label className={label}>{t("suggest.date")}<input required type="date" value={form.date} onChange={set("date")} className={field} /></label>
        <label className={label}>{t("suggest.start")}<input type="time" value={form.startTime} onChange={set("startTime")} className={field} /></label>
        <label className={label}>{t("suggest.end")}<input type="time" value={form.endTime} onChange={set("endTime")} className={field} /></label>
      </div>
      <p className="-mt-2 text-xs leading-5 text-stone-400">{t("suggest.timeHint")}</p>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className={label}>{t("suggest.venue")}<input required maxLength={200} value={form.venue} onChange={set("venue")} className={field} /></label>
        <label className={label}>{t("suggest.address")}<input maxLength={300} value={form.address} onChange={set("address")} className={field} /></label>
      </div>
      <label className={label}>{t("events.organizer")}<input required maxLength={200} value={form.organizer} onChange={set("organizer")} className={field} /></label>
      <label className={label}>{t("suggest.summary")}<textarea required maxLength={1000} rows={4} value={form.summary} onChange={set("summary")} className={`${field} py-3`} /></label>
      <label className={label}>{t("suggest.source")}<input required type="url" inputMode="url" maxLength={500} placeholder="https://" value={form.sourceUrl} onChange={set("sourceUrl")} className={field} /></label>
      <p className="text-xs leading-5 text-stone-400">{t("suggest.sourceHint")}</p>
      {error ? <p role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p> : null}
      <button type="submit" disabled={sending} className="btn-glow inline-flex min-h-12 items-center rounded-xl px-6 text-sm disabled:opacity-60">{sending ? t("suggest.sending") : t("suggest.send")}</button>
    </form>;
  }

  return <AppShell><div className="space-y-5 px-3 py-4 sm:px-0 sm:py-0">
    <Link className="inline-flex min-h-11 items-center text-sm text-brand-600" href="/events">← {t("events.allEvents")}</Link>
    <header className={panel}>
      <p className="font-mono text-xs uppercase tracking-widest text-brand-600">{t("events.eyebrow")}</p>
      <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">{t("suggest.heading")}</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-stone-500">{t("suggest.intro")}</p>
    </header>
    <section className={panel}>{body}</section>
  </div></AppShell>;
}
