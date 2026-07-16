import { NextResponse } from "next/server";
import { radioStations } from "@/services/discovery-data";

const stations = radioStations.map((station) => ({
  id: station.id,
  name: station.name,
  subtitle: `${station.description} · ${station.frequency} · ${station.city}`,
  source: station.provider,
  category: station.tags?.[0] ?? "Radio",
  isLive: station.status === "live",
  nowPlaying: station.status === "live" ? `Live from ${station.city}` : "Coming soon",
  playbackMode: station.playbackMode,
  streamUrl: station.streamUrl,
  embedUrl: station.embedUrl,
  backgroundPlayback: station.playbackMode === "stream" && Boolean(station.streamUrl)
}));

export async function GET() {
  const featuredStationId = radioStations.find((station) => station.featured)?.id;
  const featuredStation =
    stations.find((station) => station.id === featuredStationId) ?? stations[0];
  const remainingStations = stations.filter((station) => station.id !== featuredStation.id);

  return NextResponse.json(
    { featuredStation, stations: remainingStations },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400"
      }
    }
  );
}
