/**
 * Canonical origin for Zema.
 *
 * Order of precedence:
 *  1. `NEXT_PUBLIC_SITE_URL` — an explicit override always wins
 *  2. Vercel preview/branch deployments — the deployment's own URL, so preview
 *     share cards and canonicals point at the preview, not at production
 *  3. Any other production build — the real domain
 *  4. Local development — localhost
 *
 * Step 3 matters: if the env var is ever missing in production we still emit
 * the real domain instead of silently publishing localhost canonicals and
 * Open Graph image URLs.
 */
const PRODUCTION_ORIGIN = "https://habeshagram.today";

function normalize(value: string): string {
  return `https://${value.replace(/^https?:\/\//, "").replace(/\/+$/, "")}`;
}

function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/+$/, "");
  }

  const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL?.trim();
  if (process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" && vercelUrl) {
    return normalize(vercelUrl);
  }

  if (process.env.NODE_ENV === "production") {
    return PRODUCTION_ORIGIN;
  }

  return "http://localhost:3000";
}

export const siteUrl = resolveSiteUrl();

export const siteName = "Zema";

export const siteTagline = "Every station. One frequency.";

export const siteDescription =
  "Zema streams live Ethiopian and Eritrean radio alongside the East Africa stories worth knowing about today — one uninterrupted signal, wherever you are.";

export function absoluteUrl(path = "/"): string {
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
