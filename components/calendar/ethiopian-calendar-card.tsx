"use client";

import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";
import {
  ETHIOPIAN_MONTHS,
  ETHIOPIAN_WEEKDAYS,
  ethiopianTime,
  todayInEthiopia,
  upcomingHolidays
} from "@/lib/ethiopian-calendar";
import { useLanguage } from "@/hooks/use-language";
import type { MessageKey } from "@/lib/i18n/messages";
import { cn } from "@/lib/utils";

type Snapshot = {
  today: ReturnType<typeof todayInEthiopia>;
  time: ReturnType<typeof ethiopianTime>;
  holidays: ReturnType<typeof upcomingHolidays>;
};

type T = (key: MessageKey, vars?: Record<string, string | number>) => string;

function whenLabel(daysAway: number, t: T) {
  if (daysAway === 0) return t("cal.whenToday");
  if (daysAway === 1) return t("cal.whenTomorrow");
  if (daysAway < 14) return t("cal.inDays", { n: daysAway });
  if (daysAway < 60) return t("cal.inWeeks", { n: Math.round(daysAway / 7) });
  return t("cal.inMonths", { n: Math.round(daysAway / 30) });
}

function formatGregorian(isoDate: string) {
  const [y, m, d] = isoDate.split("-").map(Number);
  // Gregorian dates stay in English month names: that is how they are
  // written in Ethiopia too when the Gregorian calendar is meant.
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, d))
  );
}

/**
 * Today in the Ethiopian calendar, the time as it is told in Addis, and the
 * next few holidays. Rendered only in the browser: the clock would never
 * match between the server render and the visitor's screen.
 */
export function EthiopianCalendarCard() {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const { t, lang } = useLanguage();

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setSnap({ today: todayInEthiopia(now), time: ethiopianTime(now), holidays: upcomingHolidays(now, 3) });
    };
    tick();
    const timer = window.setInterval(tick, 20_000);
    return () => window.clearInterval(timer);
  }, []);

  if (!snap) {
    return <div className="h-[184px] animate-pulse rounded-[26px] border border-white/[0.06] bg-white/[0.02]" />;
  }

  const month = ETHIOPIAN_MONTHS[snap.today.month - 1];
  const weekday = ETHIOPIAN_WEEKDAYS[snap.today.weekday];
  const minutes = String(snap.time.minutes).padStart(2, "0");

  return (
    <section className="grid gap-5 rounded-[26px] border border-white/[0.08] bg-card/90 p-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] sm:p-6">
      <div className="min-w-0">
        <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-stone-400">
          <CalendarDays className="h-3.5 w-3.5" />
          {t("cal.today")}
        </span>
        <p className="mt-3 font-ethiopic text-[1.9rem] font-semibold leading-none text-ink" lang="am">
          {month.am} {snap.today.day}
        </p>
        <p className="mt-2 text-[14px] text-stone-500">
          {lang === "am" ? (
            <span className="font-ethiopic">
              {weekday.am} · {month.am} {snap.today.day}፣ {snap.today.year} ዓ.ም.
            </span>
          ) : (
            <>
              {weekday.en} · {month.en} {snap.today.day}, {snap.today.year}
            </>
          )}
        </p>
        <p className="mt-3 inline-flex items-baseline gap-2 rounded-xl bg-white/[0.04] px-3 py-2">
          <span className="font-mono text-[1.05rem] font-medium text-ink">
            {snap.time.hour}:{minutes}
          </span>
          <span className="text-[13px] text-stone-500">
            <span className="font-ethiopic" lang="am">
              {snap.time.period.am}
            </span>{" "}
            · {t("cal.ethiopianTime")}
          </span>
        </p>
      </div>

      <div className="min-w-0 sm:border-l sm:border-white/[0.07] sm:pl-5">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-stone-400">{t("cal.comingUp")}</span>
        <ul className="mt-3 space-y-2">
          {snap.holidays.map((holiday, index) => (
            <li
              key={holiday.id}
              className={cn(
                "flex items-center gap-3 rounded-[14px] px-3 py-2.5",
                index === 0 ? "bg-brand-500/[0.08] ring-1 ring-brand-500/30" : "bg-white/[0.025]"
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-ink">
                  {lang === "am" ? (
                    <span className="font-ethiopic">{holiday.am}</span>
                  ) : (
                    <>
                      {holiday.en}{" "}
                      <span className="font-ethiopic font-normal text-stone-400" lang="am">
                        {holiday.am}
                      </span>
                    </>
                  )}
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-stone-400">
                  {formatGregorian(holiday.date)}
                  {holiday.country === "Eritrea" ? ` · ${t("cal.eritrea")}` : ""}
                  {holiday.approximate ? ` · ${t("cal.moon")}` : ""}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 font-mono text-[11px] uppercase tracking-[0.08em]",
                  index === 0 ? "text-brand-700" : "text-stone-400"
                )}
              >
                {whenLabel(holiday.daysAway, t)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
