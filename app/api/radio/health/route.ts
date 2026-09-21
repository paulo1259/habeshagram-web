import { NextResponse } from "next/server";
import { checkStationHealth } from "@/services/station-health-service";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

/**
 * Which stations are on air right now. Vercel's CDN keeps the answer for a
 * minute, so however many people open the radio page, the streams are probed
 * at most about once a minute.
 */
export async function GET() {
  const report = await checkStationHealth();

  return NextResponse.json(report, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300"
    }
  });
}
