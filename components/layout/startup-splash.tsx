"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const SESSION_KEY = "habeshagram-splash-seen";
const FADE_IN_MS = 300;
const HOLD_MS = 760;
const FADE_OUT_MS = 250;
const TOTAL_MS = FADE_IN_MS + HOLD_MS + FADE_OUT_MS;
const REDUCED_MOTION_TOTAL_MS = 120;

type SplashPhase = "enter" | "hold" | "exit" | "done";

export function StartupSplash({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);
  const [phase, setPhase] = useState<SplashPhase>("enter");
  const [reducedMotion, setReducedMotion] = useState(false);

  const isActive = mounted && shouldShow && phase !== "done";
  const contentReady = !mounted || !shouldShow || phase === "done";

  useEffect(() => {
    setMounted(true);

    if (typeof window === "undefined") {
      return;
    }

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const hasSeenSplash = window.sessionStorage.getItem(SESSION_KEY) === "true";
    const nextReducedMotion = motionQuery.matches;
    setReducedMotion(nextReducedMotion);

    if (hasSeenSplash) {
      setPhase("done");
      return;
    }

    window.sessionStorage.setItem(SESSION_KEY, "true");
    setShouldShow(true);

    if (nextReducedMotion) {
      const reducedTimer = window.setTimeout(() => {
        setPhase("done");
      }, REDUCED_MOTION_TOTAL_MS);

      return () => window.clearTimeout(reducedTimer);
    }

    const enterTimer = window.setTimeout(() => setPhase("hold"), FADE_IN_MS);
    const exitTimer = window.setTimeout(() => setPhase("exit"), FADE_IN_MS + HOLD_MS);
    const doneTimer = window.setTimeout(() => setPhase("done"), TOTAL_MS);

    const handleMotionChange = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches);
    };

    motionQuery.addEventListener("change", handleMotionChange);

    return () => {
      window.clearTimeout(enterTimer);
      window.clearTimeout(exitTimer);
      window.clearTimeout(doneTimer);
      motionQuery.removeEventListener("change", handleMotionChange);
    };
  }, []);

  const splashCardClassName = useMemo(() => {
    if (reducedMotion) {
      return "opacity-100 scale-100";
    }

    if (phase === "exit") {
      return "opacity-0 scale-[1.045]";
    }

    if (phase === "hold") {
      return "opacity-100 scale-100";
    }

    return "opacity-0 scale-[0.965]";
  }, [phase, reducedMotion]);

  const splashCardStyle = useMemo(() => {
    if (reducedMotion) {
      return undefined;
    }

    const duration = phase === "exit" ? FADE_OUT_MS : FADE_IN_MS;

    return {
      transitionDuration: `${duration}ms, ${duration}ms`,
      transitionTimingFunction: "ease, cubic-bezier(0.22, 1, 0.36, 1)"
    };
  }, [phase, reducedMotion]);

  return (
    <>
      <div className={cn("transition-opacity duration-500", contentReady ? "opacity-100" : "opacity-0")}>{children}</div>

      {isActive ? (
        <div
          aria-hidden="true"
          className={cn(
            "fixed inset-0 z-[100] flex items-center justify-center bg-black px-6",
            reducedMotion ? "startup-splash-reduced" : "startup-splash-fade"
          )}
        >
          <div
            className={cn(
              "startup-splash-mark flex items-center gap-3 rounded-[28px] border border-white/12 bg-[#fffaf3] px-5 py-4 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:gap-4 sm:px-6 sm:py-5",
              splashCardClassName
            )}
            style={splashCardStyle}
          >
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-[22px] bg-gradient-to-br from-brand-500 to-orange-400 text-base font-black text-white shadow-soft sm:h-14 sm:w-14 sm:text-lg">
              H
            </span>
            <span className="text-2xl font-black tracking-tight text-ink sm:text-[2rem]">HabeshaGram</span>
          </div>
        </div>
      ) : null}
    </>
  );
}
