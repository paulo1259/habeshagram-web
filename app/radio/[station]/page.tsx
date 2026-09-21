import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StationPage } from "@/components/radio/station-page";
import { radioStations } from "@/services/discovery-data";

type Params = { params: { station: string } };

function findStation(id: string) {
  return radioStations.find((station) => station.id === id);
}

/** Six stations, all known at build time — prerender every one. */
export function generateStaticParams() {
  return radioStations.map((station) => ({ station: station.id }));
}

export const dynamicParams = false;

export function generateMetadata({ params }: Params): Metadata {
  const station = findStation(params.station);

  if (!station) {
    return { title: "Station not found" };
  }

  const title = `${station.name} — Live radio`;
  const description = `Listen to ${station.name} live from ${station.city}. ${station.description}. Streams in the background while you browse Zema.`;
  const path = `/radio/${station.id}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      title: `${station.name} · Live on Zema`,
      description,
      url: path
    },
    twitter: {
      card: "summary_large_image",
      title: `${station.name} · Live on Zema`,
      description
    }
  };
}

export default function StationRoutePage({ params }: Params) {
  const station = findStation(params.station);

  if (!station) {
    notFound();
  }

  return <StationPage station={station} />;
}
