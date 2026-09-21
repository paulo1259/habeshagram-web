"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRadio } from "@/hooks/use-radio";
import { logEvent } from "@/lib/analytics-events";

type BriefPlayerState = "idle" | "loading" | "playing" | "paused" | "error";

type BriefPlayerValue = {
  state: BriefPlayerState;
  /** The audio URL loaded, or null. Tells a button whether it owns the player. */
  src: string | null;
  progress: number;
  duration: number;
  play: (src: string) => void;
  pause: () => void;
};

const BriefPlayerContext = createContext<BriefPlayerValue | null>(null);

/**
 * One audio element for the spoken brief, shared site-wide so it keeps
 * playing while you move between pages. The brief and the radio never talk
 * over each other: starting one pauses the other.
 */
export function BriefPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { isPlaying: radioPlaying, togglePlayback } = useRadio();
  const [state, setState] = useState<BriefPlayerState>("idle");
  const [src, setSrc] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "none";
    audioRef.current = audio;

    const onPlaying = () => setState("playing");
    const onPause = () => setState((current) => (current === "error" ? current : "paused"));
    const onWaiting = () => setState("loading");
    const onEnded = () => {
      setState("idle");
      setProgress(0);
      logEvent("brief_listened", null, { completed: true });
    };
    const onError = () => setState("error");
    const onTime = () => setProgress(audio.currentTime);
    const onMeta = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);

    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);

    return () => {
      audio.pause();
      audio.src = "";
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
    };
  }, []);

  // Radio started while the brief was playing: the radio wins.
  useEffect(() => {
    if (radioPlaying && audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
  }, [radioPlaying]);

  const play = useCallback(
    (nextSrc: string) => {
      const audio = audioRef.current;
      if (!audio) return;

      if (radioPlaying) void togglePlayback();

      if (audio.getAttribute("src") !== nextSrc) {
        audio.src = nextSrc;
        setSrc(nextSrc);
        setProgress(0);
        setDuration(0);
        logEvent("brief_listened", null, { completed: false });
      }

      setState("loading");
      audio.play().catch(() => setState("error"));
    },
    [radioPlaying, togglePlayback]
  );

  const pause = useCallback(() => audioRef.current?.pause(), []);

  const value = useMemo(
    () => ({ state, src, progress, duration, play, pause }),
    [duration, pause, play, progress, src, state]
  );

  return <BriefPlayerContext.Provider value={value}>{children}</BriefPlayerContext.Provider>;
}

export function useBriefPlayer() {
  const context = useContext(BriefPlayerContext);
  if (!context) throw new Error("useBriefPlayer must be used inside BriefPlayerProvider");
  return context;
}
