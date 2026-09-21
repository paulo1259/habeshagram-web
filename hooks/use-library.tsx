"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useRadio } from "@/hooks/use-radio";
import { logEvent } from "@/lib/analytics-events";
import { loginHref } from "@/lib/safe-next";
import { radioStations } from "@/services/discovery-data";
import {
  addFavoriteStation,
  addSavedStory,
  fetchFavoriteStationIds,
  fetchLastStationId,
  fetchSavedStories,
  removeFavoriteStation,
  removeSavedStory,
  saveLastStationId,
  toSavedStory,
  type SavedStory
} from "@/services/library-service";
import type { RadioStation, WorldNewsItem } from "@/types";

type LibraryContextValue = {
  isSignedIn: boolean;
  /** Favourite station ids, oldest first. */
  favoriteIds: string[];
  favoriteStations: RadioStation[];
  isFavorite: (stationId: string) => boolean;
  toggleFavorite: (station: RadioStation) => void;
  savedStories: SavedStory[];
  isSaved: (storyId: string) => boolean;
  toggleSaved: (item: WorldNewsItem | SavedStory) => void;
  /** The station to offer as "pick up where you left off", if any. */
  lastStation: RadioStation | null;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

/**
 * Remembered on this device for everyone, so resume works signed out too.
 * With an account it is also stored server-side, which is what lets a phone
 * pick up the station you were playing on your laptop.
 */
const LAST_STATION_KEY = "zema-last-station";

function readLocalLastStation(): string | null {
  try {
    return window.localStorage.getItem(LAST_STATION_KEY);
  } catch {
    return null;
  }
}

function writeLocalLastStation(stationId: string) {
  try {
    window.localStorage.setItem(LAST_STATION_KEY, stationId);
  } catch {
    // Private mode or storage disabled: resume simply won't survive a reload.
  }
}

const stationById = (id: string | null) => (id ? radioStations.find((station) => station.id === id) ?? null : null);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const { station: playing, status } = useRadio();
  const router = useRouter();
  const pathname = usePathname();
  const userId = currentUser?.id ?? null;

  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [savedStories, setSavedStories] = useState<SavedStory[]>([]);
  const [lastStationId, setLastStationId] = useState<string | null>(null);

  // Guards against a slow response for a previous account landing after a
  // sign-out or account switch.
  const activeUserRef = useRef<string | null>(null);
  activeUserRef.current = userId;

  useEffect(() => {
    setLastStationId((current) => current ?? readLocalLastStation());
  }, []);

  // Load (or clear) the library whenever the signed-in account changes.
  useEffect(() => {
    if (!userId) {
      setFavoriteIds([]);
      setSavedStories([]);
      return;
    }

    let cancelled = false;
    const stillCurrent = () => !cancelled && activeUserRef.current === userId;

    fetchFavoriteStationIds()
      .then((ids) => stillCurrent() && setFavoriteIds(ids))
      .catch((error) => console.warn("Could not load favourite stations", error));

    fetchSavedStories()
      .then((stories) => stillCurrent() && setSavedStories(stories))
      .catch((error) => console.warn("Could not load saved stories", error));

    fetchLastStationId()
      .then((id) => {
        if (stillCurrent() && id && stationById(id)) {
          setLastStationId(id);
          writeLocalLastStation(id);
        }
      })
      .catch((error) => console.warn("Could not load last station", error));

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Remember the station once it is actually playing — not on a mis-tap
  // that never connected.
  const lastSyncedRef = useRef<string | null>(null);
  useEffect(() => {
    if (status !== "playing" || !playing) return;

    setLastStationId(playing.id);
    writeLocalLastStation(playing.id);

    const syncKey = `${userId}:${playing.id}`;
    if (userId && lastSyncedRef.current !== syncKey) {
      lastSyncedRef.current = syncKey;
      saveLastStationId(userId, playing.id).catch((error) => {
        lastSyncedRef.current = null;
        console.warn("Could not save last station", error);
      });
    }
  }, [playing, status, userId]);

  const sendToLogin = useCallback(() => {
    router.push(loginHref(pathname || "/"));
  }, [pathname, router]);

  const toggleFavorite = useCallback(
    (station: RadioStation) => {
      if (!userId) {
        sendToLogin();
        return;
      }

      const wasFavorite = favoriteIds.includes(station.id);
      setFavoriteIds((ids) => (wasFavorite ? ids.filter((id) => id !== station.id) : [...ids, station.id]));
      logEvent("station_favorited", userId, { station_id: station.id, favorited: !wasFavorite });

      const request = wasFavorite
        ? removeFavoriteStation(userId, station.id)
        : addFavoriteStation(userId, station.id);

      request.catch((error) => {
        console.warn("Could not update favourite", error);
        if (activeUserRef.current !== userId) return;
        // Put it back the way it was.
        setFavoriteIds((ids) =>
          wasFavorite ? (ids.includes(station.id) ? ids : [...ids, station.id]) : ids.filter((id) => id !== station.id)
        );
      });
    },
    [favoriteIds, sendToLogin, userId]
  );

  const toggleSaved = useCallback(
    (item: WorldNewsItem | SavedStory) => {
      if (!userId) {
        sendToLogin();
        return;
      }

      const story = "savedAt" in item ? item : toSavedStory(item);
      const wasSaved = savedStories.some((saved) => saved.id === story.id);

      setSavedStories((stories) =>
        wasSaved ? stories.filter((saved) => saved.id !== story.id) : [story, ...stories]
      );
      logEvent("story_saved", userId, { saved: !wasSaved, section: story.section, source: story.source });

      const request = wasSaved ? removeSavedStory(userId, story.id) : addSavedStory(userId, story);

      request.catch((error) => {
        console.warn("Could not update saved story", error);
        if (activeUserRef.current !== userId) return;
        setSavedStories((stories) =>
          wasSaved
            ? stories.some((saved) => saved.id === story.id)
              ? stories
              : [story, ...stories]
            : stories.filter((saved) => saved.id !== story.id)
        );
      });
    },
    [savedStories, sendToLogin, userId]
  );

  const value = useMemo<LibraryContextValue>(() => {
    const favoriteSet = new Set(favoriteIds);
    const savedSet = new Set(savedStories.map((story) => story.id));

    return {
      isSignedIn: Boolean(userId),
      favoriteIds,
      favoriteStations: favoriteIds
        .map((id) => stationById(id))
        .filter((station): station is RadioStation => Boolean(station)),
      isFavorite: (stationId) => favoriteSet.has(stationId),
      toggleFavorite,
      savedStories,
      isSaved: (storyId) => savedSet.has(storyId),
      toggleSaved,
      lastStation: stationById(lastStationId)
    };
  }, [favoriteIds, lastStationId, savedStories, toggleFavorite, toggleSaved, userId]);

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error("useLibrary must be used inside LibraryProvider");
  }
  return context;
}
