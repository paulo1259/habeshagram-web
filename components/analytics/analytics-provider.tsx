"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { POSTHOG_KEY, initAnalytics, trackEvent } from "@/lib/analytics";
import { recordSectionUsage } from "@/lib/personalization";

const TRACKED_PAGE_LABELS: Record<string, string> = {
  "/": "homepage",
  "/football": "football",
  "/basketball": "basketball",
  "/radio": "radio",
  "/world-news": "world-news"
};

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
    const label = TRACKED_PAGE_LABELS[pathname];

    if (!label) {
      return;
    }

    trackEvent("page_view", {
      page_name: label,
      pathname
    });

    if (label === "homepage") {
      return;
    }

    recordSectionUsage(label as "football" | "basketball" | "radio" | "world-news");
  }, [pathname]);

  return <>{children}</>;
}
