"use client";

import { useEffect, useState } from "react";
import type { StationHealth, StationHealthReport } from "@/services/station-health-service";

/**
 * Shared, polled view of /api/radio/health. Every component that asks gets
 * the same report; only one request is in flight at a time.
 *
 * Until the first answer arrives a station's health is `undefined`, and the UI
 * shows it neutrally rather than guessing either way.
 */
const REFRESH_MS = 2 * 60_000;

let report: StationHealthReport | null = null;
let inFlight: Promise<void> | null = null;
let lastFetch = 0;
const listeners = new Set<() => void>();

function refresh() {
  if (inFlight || Date.now() - lastFetch < REFRESH_MS / 2) return;
  lastFetch = Date.now();
  inFlight = fetch("/api/radio/health")
    .then((response) => (response.ok ? (response.json() as Promise<StationHealthReport>) : null))
    .then((next) => {
      if (next?.stations) {
        report = next;
        listeners.forEach((listener) => listener());
      }
    })
    .catch(() => undefined)
    .finally(() => {
      inFlight = null;
    });
}

export function useStationHealth(): {
  healthOf: (stationId: string) => StationHealth | undefined;
  onAirCount: number | null;
} {
  const [, setVersion] = useState(0);

  useEffect(() => {
    const listener = () => setVersion((value) => value + 1);
    listeners.add(listener);
    refresh();
    const timer = window.setInterval(refresh, REFRESH_MS);
    return () => {
      listeners.delete(listener);
      window.clearInterval(timer);
    };
  }, []);

  return {
    healthOf: (stationId) => report?.stations[stationId],
    onAirCount: report ? Object.values(report.stations).filter((value) => value === "online").length : null
  };
}
