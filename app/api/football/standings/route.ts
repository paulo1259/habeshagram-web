import { NextResponse } from "next/server";
import { LeagueStandingRow } from "@/types";
import { fetchSportmonksStandings } from "@/services/sportmonks-football-service";

export const dynamic = "force-dynamic";

type StandingsFeed = {
  standings: LeagueStandingRow[];
  source: "api" | "cache" | "empty";
  stale: boolean;
  fetchedAt: string;
  message?: string;
};

let lastSuccessfulPayload: StandingsFeed | null = null;

export async function GET() {
  const apiToken = process.env.SPORTMONKS_API_TOKEN?.trim();

  if (!apiToken) {
    return NextResponse.json({
      standings: [],
      source: "empty",
      stale: true,
      fetchedAt: new Date().toISOString(),
      message: "Sportmonks standings are not configured on the server yet."
    } satisfies StandingsFeed);
  }

  try {
    const standings = await fetchSportmonksStandings();

    const payload: StandingsFeed = {
      standings,
      source: "api",
      stale: false,
      fetchedAt: new Date().toISOString(),
      message: standings.length ? undefined : "No Premier League table rows are available right now."
    };

    lastSuccessfulPayload = payload;
    return NextResponse.json(payload);
  } catch (error) {
    if (lastSuccessfulPayload) {
      return NextResponse.json({
        ...lastSuccessfulPayload,
        source: "cache",
        stale: true,
        message: "Using the last successful Sportmonks table while the provider recovers."
      } satisfies StandingsFeed);
    }

    return NextResponse.json({
      standings: [],
      source: "empty",
      stale: true,
      fetchedAt: new Date().toISOString(),
      message:
        error instanceof Error
          ? `Standings are temporarily unavailable. ${error.message}`
          : "Standings are temporarily unavailable."
    } satisfies StandingsFeed);
  }
}
