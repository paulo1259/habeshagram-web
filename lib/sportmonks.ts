import "server-only";

const DEFAULT_BASE_URL = "https://api.sportmonks.com/v3/football";
const DEFAULT_PREMIER_LEAGUE_ID = 8;

export function getSportmonksApiToken() {
  return process.env.SPORTMONKS_API_TOKEN?.trim() || "";
}

export function getSportmonksBaseUrl() {
  return process.env.SPORTMONKS_BASE_URL?.trim() || DEFAULT_BASE_URL;
}

export function getSportmonksPremierLeagueId() {
  const raw =
    process.env.SPORTMONKS_PREMIER_LEAGUE_ID?.trim() ||
    process.env.SPORTMONKS_LEAGUE_ID?.trim() ||
    "";
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : DEFAULT_PREMIER_LEAGUE_ID;
}

export type SportmonksApiEnvelope<T> = {
  data?: T[] | T | null;
  meta?: {
    pagination?: {
      current_page?: number;
      total_pages?: number;
      has_more?: boolean;
    } | null;
  } | null;
};

export function extractSportmonksArray<T>(payload: SportmonksApiEnvelope<T>): T[] {
  if (Array.isArray(payload.data)) {
    return payload.data;
  }

  if (payload.data && typeof payload.data === "object") {
    return [payload.data];
  }

  return [];
}

export async function fetchSportmonks<T>(path: string, params: Record<string, string> = {}) {
  const token = getSportmonksApiToken();

  if (!token) {
    throw new Error("SPORTMONKS_API_TOKEN is missing on the server.");
  }

  const baseUrl = getSportmonksBaseUrl();
  const url = new URL(path, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
  url.searchParams.set("api_token", token);

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url.toString(), {
    cache: "no-store",
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Sportmonks returned ${response.status} for ${url.pathname}.`);
  }

  return (await response.json()) as SportmonksApiEnvelope<T>;
}
