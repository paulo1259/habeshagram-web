import { NextResponse } from "next/server";
import {
  getFallbackLiveMatches,
  LiveMatchFeed,
  mapFootballDataMatchToLiveMatch,
  prioritizeLiveMatches
} from "@/services/live-match-service";

export const dynamic = "force-dynamic";

let lastSuccessfulPayload: LiveMatchFeed | null = null;

function formatApiDate(offsetDays: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

export async function GET() {
  // Keep the football-data.org token on the server only.
  const apiKey = process.env.FOOTBALL_DATA_API_KEY?.trim();

  if (!apiKey) {
    return NextResponse.json({
      matches: getFallbackLiveMatches(),
      source: "fallback",
      stale: true,
      fetchedAt: new Date().toISOString(),
      message:
        "FOOTBALL_DATA_API_KEY is missing on the server, so HabeshaGram is showing the built-in live match fallback."
    } satisfies LiveMatchFeed);
  }

  try {
    const url = new URL("https://api.football-data.org/v4/competitions/PL/matches");
    url.searchParams.set("dateFrom", formatApiDate(-1));
    url.searchParams.set("dateTo", formatApiDate(2));

    const response = await fetch(url.toString(), {
      headers: {
        "X-Auth-Token": apiKey,
        "X-Unfold-Goals": "true"
      },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`football-data.org returned ${response.status}.`);
    }

    const data = (await response.json()) as { matches?: unknown[] };
    const mappedMatches = prioritizeLiveMatches(
      (data.matches ?? [])
        .map((match) => mapFootballDataMatchToLiveMatch(match as never))
        .filter((match): match is NonNullable<typeof match> => Boolean(match))
    );

    const payload: LiveMatchFeed = {
      matches: mappedMatches.length ? mappedMatches : getFallbackLiveMatches(),
      source: "api",
      stale: false,
      fetchedAt: new Date().toISOString(),
      message: mappedMatches.length
        ? undefined
        : "No relevant Premier League club matches were returned right now, so HabeshaGram is showing the built-in fallback slate."
    };

    lastSuccessfulPayload = payload;
    return NextResponse.json(payload);
  } catch (error) {
    if (lastSuccessfulPayload) {
      return NextResponse.json({
        ...lastSuccessfulPayload,
        source: "cache",
        stale: true,
        message: "Using the last successful football-data.org update right now while the live provider recovers."
      } satisfies LiveMatchFeed);
    }

    return NextResponse.json({
      matches: getFallbackLiveMatches(),
      source: "fallback",
      stale: true,
      fetchedAt: new Date().toISOString(),
      message:
        error instanceof Error
          ? `Live football data is temporarily unavailable. ${error.message}`
          : "Live football data is temporarily unavailable."
    } satisfies LiveMatchFeed);
  }
}
