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
import { radioStations } from "@/services/discovery-data";
import type { RadioStation } from "@/types";

export type RadioPlaybackStatus =
  | "idle"
  | "loading"
  | "playing"
  | "paused"
  | "widget"
  | "error";

type RadioContextValue = {
  station: RadioStation | null;
  status: RadioPlaybackStatus;
  isPlaying: boolean;
  isExpanded: boolean;
  volume: number;
  isMuted: boolean;
  errorMessage: string;
  /** Epoch ms when the sleep timer stops playback, or null when off. */
  sleepAt: number | null;
  /** Seconds of continuous listening in the current session. */
  elapsedSeconds: number;
  setSleepTimer: (minutes: number | null) => void;
  playStation: (station: RadioStation) => Promise<void>;
  togglePlayback: () => Promise<void>;
  playPrevious: () => Promise<void>;
  playNext: () => Promise<void>;
  retry: () => Promise<void>;
  setExpanded: (expanded: boolean) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  closePlayer: () => void;
};

const RadioContext = createContext<RadioContextValue | null>(null);
const RADIO_VOLUME_KEY = "habeshagram-radio-volume";

function getPlaybackMode(station: RadioStation | null) {
  if (station?.playbackMode === "stream" && station.streamUrl.trim()) {
    return "stream" as const;
  }

  if (station?.embedUrl.trim()) {
    return "widget" as const;
  }

  return "unavailable" as const;
}

export function RadioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stationRef = useRef<RadioStation | null>(null);
  const [station, setStation] = useState<RadioStation | null>(null);
  const [status, setStatus] = useState<RadioPlaybackStatus>("idle");
  const [isExpanded, setExpanded] = useState(false);
  const [volume, setVolumeState] = useState(0.82);
  const [isMuted, setIsMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [sleepAt, setSleepAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const sleepTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    stationRef.current = station;
  }, [station]);

  // Count listening time while the stream is playing.
  useEffect(() => {
    if (status !== "playing") {
      return;
    }

    const interval = window.setInterval(() => {
      setElapsedSeconds((value) => value + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [status]);

  useEffect(() => {
    const savedVolume = Number(window.localStorage.getItem(RADIO_VOLUME_KEY));
    if (Number.isFinite(savedVolume) && savedVolume >= 0 && savedVolume <= 1) {
      setVolumeState(savedVolume);
    }
  }, []);

  useEffect(() => {
    if (!audioRef.current) {
      return;
    }

    audioRef.current.volume = volume;
    audioRef.current.muted = isMuted;
    window.localStorage.setItem(RADIO_VOLUME_KEY, String(volume));
  }, [isMuted, volume]);

  const playStation = useCallback(
    async (nextStation: RadioStation) => {
      const audio = audioRef.current;
      const mode = getPlaybackMode(nextStation);
      setErrorMessage("");
      setElapsedSeconds(0);
      setStation(nextStation);
      stationRef.current = nextStation;

      if (mode === "widget") {
        audio?.pause();
        setStatus("widget");
        setExpanded(true);
        return;
      }

      if (mode !== "stream" || !audio) {
        audio?.pause();
        setStatus("error");
        setExpanded(true);
        setErrorMessage("This station does not currently expose a playable web stream.");
        return;
      }

      if (audio.src !== nextStation.streamUrl) {
        audio.pause();
        audio.src = nextStation.streamUrl;
        audio.load();
      }

      audio.volume = volume;
      audio.muted = isMuted;
      setStatus("loading");

      try {
        await audio.play();
      } catch {
        setStatus("paused");
        setErrorMessage("Your browser blocked autoplay. Tap play once more to start the live stream.");
      }
    },
    [isMuted, volume]
  );

  const togglePlayback = useCallback(async () => {
    const audio = audioRef.current;
    const activeStation = stationRef.current;

    if (!activeStation) {
      return;
    }

    if (getPlaybackMode(activeStation) === "widget") {
      setExpanded(true);
      return;
    }

    if (!audio) {
      return;
    }

    if (!audio.paused) {
      audio.pause();
      return;
    }

    setErrorMessage("");
    setStatus("loading");
    try {
      await audio.play();
    } catch {
      setStatus("error");
      setErrorMessage("The live stream could not start. Check your connection and try again.");
    }
  }, []);

  const moveStation = useCallback(
    async (direction: -1 | 1) => {
      const available = radioStations.filter(
        (item) => item.streamUrl.trim() || item.embedUrl.trim()
      );
      if (!available.length) {
        return;
      }

      const currentIndex = available.findIndex((item) => item.id === stationRef.current?.id);
      const safeIndex = currentIndex < 0 ? 0 : currentIndex;
      const nextIndex = (safeIndex + direction + available.length) % available.length;
      await playStation(available[nextIndex]);
    },
    [playStation]
  );

  const playPrevious = useCallback(() => moveStation(-1), [moveStation]);
  const playNext = useCallback(() => moveStation(1), [moveStation]);
  const retry = useCallback(async () => {
    if (stationRef.current) {
      await playStation(stationRef.current);
    }
  }, [playStation]);

  const changeVolume = useCallback((nextVolume: number) => {
    const normalized = Math.min(1, Math.max(0, nextVolume));
    setVolumeState(normalized);
    if (normalized > 0) {
      setIsMuted(false);
    }
  }, []);

  const toggleMute = useCallback(() => setIsMuted((value) => !value), []);

  const setSleepTimer = useCallback((minutes: number | null) => {
    if (sleepTimeoutRef.current) {
      window.clearTimeout(sleepTimeoutRef.current);
      sleepTimeoutRef.current = null;
    }

    if (!minutes) {
      setSleepAt(null);
      return;
    }

    setSleepAt(Date.now() + minutes * 60_000);
    sleepTimeoutRef.current = window.setTimeout(() => {
      audioRef.current?.pause();
      setSleepAt(null);
      sleepTimeoutRef.current = null;
    }, minutes * 60_000);
  }, []);

  const closePlayer = useCallback(() => {
    const audio = audioRef.current;
    audio?.pause();
    if (sleepTimeoutRef.current) {
      window.clearTimeout(sleepTimeoutRef.current);
      sleepTimeoutRef.current = null;
    }
    setSleepAt(null);
    setElapsedSeconds(0);
    if (audio) {
      audio.removeAttribute("src");
      audio.load();
    }
    setStation(null);
    stationRef.current = null;
    setStatus("idle");
    setExpanded(false);
    setErrorMessage("");
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) {
      return;
    }

    if (!station || getPlaybackMode(station) !== "stream") {
      return;
    }

    navigator.mediaSession.metadata = new MediaMetadata({
      title: station.name,
      artist: `${station.frequency} · ${station.city}`,
      album: "HabeshaGram Live Radio"
    });

    const handlers: Array<[MediaSessionAction, MediaSessionActionHandler | null]> = [
      ["play", () => void togglePlayback()],
      ["pause", () => audioRef.current?.pause()],
      ["previoustrack", () => void playPrevious()],
      ["nexttrack", () => void playNext()]
    ];

    handlers.forEach(([action, handler]) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        // Some browsers expose Media Session but omit individual actions.
      }
    });

    return () => {
      handlers.forEach(([action]) => {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {
          // Ignore unsupported actions during cleanup.
        }
      });
    };
  }, [playNext, playPrevious, station, togglePlayback]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) {
      return;
    }

    if (status === "playing") {
      navigator.mediaSession.playbackState = "playing";
    } else if (status === "paused" || status === "error") {
      navigator.mediaSession.playbackState = "paused";
    } else {
      navigator.mediaSession.playbackState = "none";
    }
  }, [status]);

  const value = useMemo<RadioContextValue>(
    () => ({
      station,
      status,
      isPlaying: status === "playing",
      isExpanded,
      volume,
      isMuted,
      errorMessage,
      sleepAt,
      elapsedSeconds,
      setSleepTimer,
      playStation,
      togglePlayback,
      playPrevious,
      playNext,
      retry,
      setExpanded,
      setVolume: changeVolume,
      toggleMute,
      closePlayer
    }),
    [
      changeVolume,
      closePlayer,
      elapsedSeconds,
      errorMessage,
      setSleepTimer,
      sleepAt,
      isExpanded,
      isMuted,
      playNext,
      playPrevious,
      playStation,
      retry,
      station,
      status,
      toggleMute,
      togglePlayback,
      volume
    ]
  );

  return (
    <RadioContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        className="hidden"
        preload="none"
        playsInline
        onLoadStart={() => setStatus("loading")}
        onWaiting={() => setStatus("loading")}
        onPlaying={() => {
          setStatus("playing");
          setErrorMessage("");
        }}
        onPause={() => {
          if (stationRef.current && getPlaybackMode(stationRef.current) === "stream") {
            setStatus("paused");
          }
        }}
        onError={() => {
          setStatus("error");
          setErrorMessage("The station stream disconnected. Try reconnecting or choose another station.");
        }}
      />
    </RadioContext.Provider>
  );
}

export function useRadio() {
  const context = useContext(RadioContext);
  if (!context) {
    throw new Error("useRadio must be used inside RadioProvider.");
  }

  return context;
}
