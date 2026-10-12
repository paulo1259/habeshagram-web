"use client";

import { useEffect, useState } from "react";
import { fetchAirplay, type AirplayEntry } from "@/services/airplay-service";

type AirplayState = {
  entries: AirplayEntry[] | null;
  /** True once the first load has finished, successfully or not. */
  loaded: boolean;
  /** Supabase is not configured (local development without .env.local). */
  unavailable: boolean;
};

const REFRESH_MS = 60_000;

/**
 * The aired-today log for one station, refreshed every minute while the tab
 * is visible. The recorder writes every two minutes, so refreshing faster
 * would only repeat the same rows.
 */
export function useAirplay(stationId: string): AirplayState {
  const [state, setState] = useState<AirplayState>({ entries: null, loaded: false, unavailable: false });

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    const load = async () => {
      try {
        const entries = await fetchAirplay(stationId);
        if (cancelled) return;
        setState({ entries: entries ?? [], loaded: true, unavailable: entries === null });
      } catch {
        if (!cancelled) setState((current) => ({ ...current, loaded: true }));
      }
    };

    const schedule = () => {
      window.clearInterval(timer);
      if (document.visibilityState === "visible") {
        timer = window.setInterval(load, REFRESH_MS);
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") void load();
      schedule();
    };

    setState({ entries: null, loaded: false, unavailable: false });
    void load();
    schedule();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [stationId]);

  return state;
}
