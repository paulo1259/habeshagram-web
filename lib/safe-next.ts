/**
 * Where to send someone after they sign in. Only same-site paths are
 * accepted: "/radio" yes, "//evil.test" or "https://evil.test" no — otherwise
 * a crafted login link could bounce people off to another site.
 */
export function getSafeNext(fallback = "/"): string {
  if (typeof window === "undefined") return fallback;

  const next = new URLSearchParams(window.location.search).get("next");
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next;
}

export function loginHref(returnTo: string) {
  return `/login?next=${encodeURIComponent(returnTo)}`;
}
