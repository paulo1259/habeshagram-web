const DEFAULT_BALLDONTLIE_BASE_URL = "https://api.balldontlie.io/v1";

function normalizeBaseUrl(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed.replace(/\/+$/, "") : DEFAULT_BALLDONTLIE_BASE_URL;
}

export function getApiBasketballConfig() {
  const apiKey = process.env.BALLDONTLIE_API_KEY?.trim() || "";
  const baseUrl = normalizeBaseUrl(process.env.BALLDONTLIE_BASE_URL);

  return {
    apiKey,
    baseUrl
  };
}

export function getDefaultBasketballSeason(date = new Date()) {
  const month = date.getUTCMonth() + 1;
  const year = date.getUTCFullYear();

  // NBA seasons are identified by the starting calendar year.
  return month >= 9 ? year : year - 1;
}

export async function fetchApiBasketballJson<T>(
  path: string,
  searchParams?: Record<string, string | number | boolean | undefined>
) {
  const { apiKey, baseUrl } = getApiBasketballConfig();

  if (!apiKey) {
    throw new Error("BALLDONTLIE_API_KEY is missing on the server.");
  }

  const normalizedPath = path.replace(/^\/+/, "");
  const url = new URL(normalizedPath, `${baseUrl}/`);

  Object.entries(searchParams ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    url.searchParams.set(key, String(value));
  });

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: apiKey,
      Accept: "application/json"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`BALLDONTLIE returned ${response.status} for ${url.pathname}.`);
  }

  return (await response.json()) as T;
}
