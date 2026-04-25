const DEFAULT_API_BASKETBALL_BASE_URL = "https://api-basketball.p.rapidapi.com";

function normalizeBaseUrl(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed.replace(/\/+$/, "") : DEFAULT_API_BASKETBALL_BASE_URL;
}

function resolveHost(baseUrl: string, explicitHost?: string | null) {
  const host = explicitHost?.trim();
  if (host) {
    return host;
  }

  return new URL(baseUrl).host;
}

export function getApiBasketballConfig() {
  const apiKey = process.env.API_BASKETBALL_RAPIDAPI_KEY?.trim() || process.env.RAPIDAPI_KEY?.trim();
  const baseUrl = normalizeBaseUrl(process.env.API_BASKETBALL_BASE_URL);
  const host = resolveHost(baseUrl, process.env.API_BASKETBALL_RAPIDAPI_HOST);

  return {
    apiKey,
    baseUrl,
    host,
    defaultLeagueId: process.env.API_BASKETBALL_DEFAULT_LEAGUE_ID?.trim() || ""
  };
}

export async function fetchApiBasketballJson<T>(
  path: string,
  searchParams?: Record<string, string | number | boolean | undefined>
) {
  const { apiKey, baseUrl, host } = getApiBasketballConfig();

  if (!apiKey) {
    throw new Error("API_BASKETBALL_RAPIDAPI_KEY is missing on the server.");
  }

  const url = new URL(path, `${baseUrl}/`);

  Object.entries(searchParams ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    url.searchParams.set(key, String(value));
  });

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "X-RapidAPI-Key": apiKey,
      "X-RapidAPI-Host": host,
      Accept: "application/json"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`API-Basketball returned ${response.status} for ${url.pathname}.`);
  }

  return (await response.json()) as T;
}
