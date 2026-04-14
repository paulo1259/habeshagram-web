"use client";

import { GoalAlertItem } from "@/types";

export function GoalAlertStack({ alerts }: { alerts: GoalAlertItem[] }) {
  if (!alerts.length) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-50 flex flex-col items-center gap-2 px-4">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="w-full max-w-md rounded-[22px] border border-red-200 bg-white/95 px-4 py-3 shadow-[0_18px_40px_rgba(239,68,68,0.18)] backdrop-blur transition-all duration-300 ease-out animate-[slideDown_.35s_ease-out]"
        >
          <div className="flex flex-wrap items-center gap-2 text-red-600">
            <span className="text-[11px] font-bold uppercase tracking-[0.16em]">Goal</span>
            <p className="text-xs font-semibold uppercase tracking-[0.16em]">Goal Alert</p>
            {alert.minute ? (
              <span className="rounded-full bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700">
                {alert.minute}
              </span>
            ) : null}
            <span className="rounded-full bg-red-500 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white">
              Live
            </span>
          </div>
          <p className="mt-1 text-sm font-semibold leading-6 text-ink">{alert.message}</p>
          {alert.scorer ? <p className="mt-1 text-xs text-stone-500">Scorer: {alert.scorer}</p> : null}
        </div>
      ))}
    </div>
  );
}
