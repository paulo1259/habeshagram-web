"use client";

import { useEffect, useState } from "react";
import { subscribeToNowPlaying, type NowPlayingHandle } from "@/services/now-playing-service";
import { radioStations } from "@/services/discovery-data";

/**
 * Live track titles for every station at once, for the "On air now" board.
 *
 * Six server-sent-event connections is fine while someone is looking at the
 * board, but pointless otherwise — so they only stay open while the board is
 * on screen and the tab is visible, and close the moment either stops.
 */
export function useOnAirBoard(visible: boolean): Record<string, string> {
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [pageVisible, setPageVisible] = useState(true);

  useEffect(() => {
    const update = () => setPageVisible(document.visibilityState === "visible");
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  useEffect(() => {
    if (!visible || !pageVisible) return;

    const handles: NowPlayingHandle[] = radioStations
      .filter((station) => station.streamUrl)
      .map((station) =>
        subscribeToNowPlaying(station.streamUrl, (title) =>
          setTitles((current) => (current[station.id] === title ? current : { ...current, [station.id]: title }))
        )
      );

    return () => handles.forEach((handle) => handle.close());
  }, [visible, pageVisible]);

  return titles;
}
