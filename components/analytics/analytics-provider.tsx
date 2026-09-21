"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { POSTHOG_KEY, initAnalytics, trackEvent } from "@/lib/analytics";

/**
 * A readable name for each page, so dashboards say "radio" rather than a raw
 * path. Dynamic routes are grouped by prefix: every /radio/<station> page is
 * "station" with the path kept alongside for the per-station breakdown.
 */
function pageNameFor(pathname: string): string {
  if (pathname === "/") return "home";
  if (pathname === "/radio") return "radio";
  if (pathname.startsWith("/radio/")) return "station";
  if (pathname === "/world-news") return "news";
  if (pathname === "/login" || pathname === "/signup" || pathname === "/forgot-password") return "auth";
  return "other";
}

let hasInitialized = false;

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (!POSTHOG_KEY || hasInitialized) {
      return;
    }

    void initAnalytics().then(() => {
      hasInitialized = true;
    });
  }, []);

  useEffect(() => {
    trackEvent("page_view", {
      page_name: pageNameFor(pathname),
      pathname
    });
  }, [pathname]);

  return <>{children}</>;
}
