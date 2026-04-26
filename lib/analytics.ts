"use client";

export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
export const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

let posthogModulePromise: Promise<typeof import("posthog-js")> | null = null;
let initPromise: Promise<Awaited<ReturnType<typeof getPostHog>>> | null = null;

async function getPostHog() {
  if (!POSTHOG_KEY || typeof window === "undefined") {
    return null;
  }

  if (!posthogModulePromise) {
    posthogModulePromise = import("posthog-js");
  }

  const module = await posthogModulePromise;
  return module.default;
}

export function initAnalytics() {
  if (!POSTHOG_KEY || typeof window === "undefined") {
    return Promise.resolve(null);
  }

  if (!initPromise) {
    initPromise = getPostHog().then((posthog) => {
      if (!posthog) {
        return null;
      }

      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        autocapture: false,
        capture_pageview: false,
        disable_session_recording: true,
        persistence: "localStorage+cookie"
      });

      return posthog;
    });
  }

  return initPromise;
}

export function trackEvent(eventName: string, properties?: Record<string, unknown>) {
  void initAnalytics().then((posthog) => {
    posthog?.capture(eventName, properties);
  });
}
