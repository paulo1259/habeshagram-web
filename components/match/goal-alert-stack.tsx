"use client";

import { GoalAlertItem } from "@/types";

const alertStyles = {
  goal: {
    border: "border-red-200",
    shadow: "shadow-[0_18px_40px_rgba(239,68,68,0.18)]",
    label: "Goal",
    labelClass: "text-red-600",
    minuteClass: "bg-red-50 text-red-700",
    badgeClass: "bg-red-500 text-white"
  },
  "red-card": {
    border: "border-rose-200",
    shadow: "shadow-[0_18px_40px_rgba(225,29,72,0.18)]",
    label: "Red Card",
    labelClass: "text-rose-700",
    minuteClass: "bg-rose-50 text-rose-700",
    badgeClass: "bg-rose-600 text-white"
  },
  ft: {
    border: "border-stone-200",
    shadow: "shadow-[0_18px_40px_rgba(28,25,23,0.14)]",
    label: "Full Time",
    labelClass: "text-stone-700",
    minuteClass: "bg-stone-100 text-stone-700",
    badgeClass: "bg-stone-900 text-white"
  }
} as const;

export function GoalAlertStack({ alerts }: { alerts: GoalAlertItem[] }) {
  if (!alerts.length) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-50 flex flex-col items-center gap-2 px-4">
      {alerts.map((alert) => {
        const style = alertStyles[alert.type];

        return (
          <div
            key={alert.id}
            className={`w-full max-w-md rounded-[22px] border bg-white/95 px-4 py-3 backdrop-blur transition-all duration-300 ease-out animate-[slideDown_.35s_ease-out] ${style.border} ${style.shadow}`}
          >
            <div className={`flex flex-wrap items-center gap-2 ${style.labelClass}`}>
              <span className="text-[11px] font-bold uppercase tracking-[0.16em]">{style.label}</span>
              <p className="text-xs font-semibold uppercase tracking-[0.16em]">Instant Alert</p>
              {alert.minute ? (
                <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${style.minuteClass}`}>
                  {alert.minute}
                </span>
              ) : null}
              <span className={`rounded-full px-2 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${style.badgeClass}`}>
                {alert.type === "ft" ? "Final" : "Live"}
              </span>
            </div>
            <p className="mt-1 text-sm font-semibold leading-6 text-ink">{alert.message}</p>
            {alert.scorer ? <p className="mt-1 text-xs text-stone-500">Scorer: {alert.scorer}</p> : null}
            {alert.player && alert.type === "red-card" ? (
              <p className="mt-1 text-xs text-stone-500">Player: {alert.player}</p>
            ) : null}
            {alert.contextLabel ? (
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                {alert.contextLabel}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
