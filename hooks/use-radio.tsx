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
import { subscribeToNowPlaying } from "@/services/now-playing-service";
import type { RadioStation } from "@/types";

export type RadioPlaybackStatus =
  | "idle"
  | "loading"
  | "playing"
  | "paused"
  | "reconnecting"
  | "error";

type RadioContextValue = {
  station: RadioStation | null;
  status: RadioPlaybackStatus;
  isPlaying: boolean;
  isExpanded: boolean;
  volume: number;
  isMuted: boolean;
  errorMessage: string;
  /** Current track title from the station's metadata feed, or "" when unknown. */
  nowPlaying: string;
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
const RADIO_VOLUME_KEY = "zema-radio-volume";
const LEGACY_RADIO_VOLUME_KEY = "habeshagram-radio-volume";

/**
 * Every station now streams directly; `embedUrl` survives only as a provider
 * link. A station without a stream URL is simply unplayable.
 */
function getPlaybackMode(station: RadioStation | null) {
  return station?.streamUrl.trim() ? ("stream" as const) : ("unavailable" as const);
}

/** Backoff between automatic reconnect attempts after a stream drops. */
const RECONNECT_DELAYS_MS = [2000, 5000, 12000];

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
  const [nowPlaying, setNowPlaying] = useState("");
  const sleepTimeoutRef = useRef<number | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptRef = useRef(0);
  const wasPlayingRef = useRef(false);

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
    // Fall back to the pre-rename key so anyone who set a volume under the old
    // brand keeps it, then let the next save write it under the new key.
    const raw =
      window.localStorage.getItem(RADIO_VOLUME_KEY) ??
      window.localStorage.getItem(LEGACY_RADIO_VOLUME_KEY);
    const savedVolume = Number(raw);

    if (raw !== null && Number.isFinite(savedVolume) && savedVolume >= 0 && savedVolume <= 1) {
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
      setNowPlaying("");
      reconnectAttemptRef.current = 0;
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      setStation(nextStation);
      stationRef.current = nextStation;

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
      } catch (error) {
        const autoplayWasBlocked =
          error instanceof DOMException && error.name === "NotAllowedError";
        setStatus(autoplayWasBlocked ? "paused" : "error");
        setErrorMessage(
          autoplayWasBlocked
            ? "Your browser blocked playback. Tap play once more to start the live stream."
            : "The live stream could not start. Try reconnecting or choose another station."
        );
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
      const available = radioStations.filter((item) => item.streamUrl.trim());
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
    reconnectAttemptRef.current = 0;
    if (reconnectTimeoutRef.current) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setNowPlaying("");
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

  /**
   * Live streams drop for all sorts of reasons -- a dozy encoder, a phone
   * changing network. Previously any drop surfaced an error and waited for a
   * manual retry, which is the wrong default for background listening. Retry
   * automatically a few times first, and only give up loudly after that.
   */
  const handleStreamError = useCallback(() => {
    const audio = audioRef.current;
    const activeStation = stationRef.current;

    if (!audio || !activeStation || !wasPlayingRef.current) {
      setStatus("error");
      setErrorMessage("The station stream could not be reached. Try another station.");
      return;
    }

    const attempt = reconnectAttemptRef.current;

    if (attempt >= RECONNECT_DELAYS_MS.length) {
      reconnectAttemptRef.current = 0;
      wasPlayingRef.current = false;
      setStatus("error");
      setErrorMessage("The stream kept dropping. It may be off air — try again or pick another station.");
      return;
    }

    reconnectAttemptRef.current = attempt + 1;
    setStatus("reconnecting");
    setErrorMessage("");

    reconnectTimeoutRef.current = window.setTimeout(() => {
      reconnectTimeoutRef.current = null;
      const current = stationRef.current;
      if (!current || !audioRef.current) {
        return;
      }

      // Cache-bust so a proxy does not hand back the dead connection.
      audioRef.current.src = `${current.streamUrl}${current.streamUrl.includes("?") ? "&" : "?"}r=${Date.now()}`;
      audioRef.current.load();
      void audioRef.current.play().catch(() => handleStreamError());
    }, RECONNECT_DELAYS_MS[attempt]);
  }, []);

  // Track titles for the station currently loaded, closed out on change.
  useEffect(() => {
    setNowPlaying("");

    if (!station || getPlaybackMode(station) !== "stream") {
      return;
    }

    const handle = subscribeToNowPlaying(station.streamUrl, setNowPlaying);
    return () => handle.close();
  }, [station]);

  useEffect(
    () => () => {
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
    },
    []
  );

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) {
      return;
    }

    if (!station || getPlaybackMode(station) !== "stream") {
      return;
    }

    // Lock screen shows the track when we know it, the station when we do not.
    navigator.mediaSession.metadata = new MediaMetadata({
      title: nowPlaying || station.name,
      artist: nowPlaying ? station.name : `${station.frequency} · ${station.city}`,
      album: "Zema Live Radio",
      artwork: [
        { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png" }
      ]
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
  }, [nowPlaying, playNext, playPrevious, station, togglePlayback]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) {
      return;
    }

    if (status === "playing") {
      navigator.mediaSession.playbackState = "playing";
    } else if (status === "paused" || status === "error" || status === "reconnecting") {
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
      nowPlaying,
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
      nowPlaying,
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
          reconnectAttemptRef.current = 0;
          wasPlayingRef.current = true;
          setStatus("playing");
          setErrorMessage("");
        }}
        onPause={() => {
          if (reconnectTimeoutRef.current) {
            return;
          }
          if (stationRef.current) {
            wasPlayingRef.current = false;
            setStatus("paused");
          }
        }}
        onStalled={handleStreamError}
        onError={handleStreamError}
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
