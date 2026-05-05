import { NextResponse } from 'next/server';

// Mobile-compatible RadioStation shape.
// The web app stores richer station data (embedUrl, streamUrl, playbackMode, etc.)
// in services/discovery-data.ts. This route maps that data to the flatter shape
// that the HabeshaGram mobile app expects.
type MobileRadioStation = {
  id: string;
  name: string;
  subtitle: string;
  source: string;
  category: string;
  isLive: boolean;
  nowPlaying: string;
};

const stations: MobileRadioStation[] = [
  {
    id: 'sheger-1021',
    name: 'Sheger 102.1',
    subtitle: 'News, talk, and entertainment · 102.1 FM · Addis Ababa',
    source: 'Zeno.fm',
    category: 'News',
    isLive: true,
    nowPlaying: 'Broadcasting live on 102.1 FM',
  },
  {
    id: 'ethio-fm-1078',
    name: 'Ethio FM 107.8',
    subtitle: 'Entertainment, news, and sports · 107.8 FM · Addis Ababa',
    source: 'Radio Garden',
    category: 'Entertainment',
    isLive: true,
    nowPlaying: 'Streaming live via Radio Garden',
  },
  {
    id: 'fm-addis-971',
    name: 'FM Addis 97.1',
    subtitle: 'EBC FM Addis live radio · 97.1 FM · Addis Ababa',
    source: 'Radio Garden',
    category: 'Talk',
    isLive: true,
    nowPlaying: 'EBC FM Addis live broadcast',
  },
  {
    id: 'wengel-fm',
    name: 'Wengel FM',
    subtitle: 'Religious radio with Amharic and English programming',
    source: 'Zeno.fm',
    category: 'Religious',
    isLive: true,
    nowPlaying: 'Amharic and English programming',
  },
  {
    id: 'orthodox-radio',
    name: 'Orthodox Radio',
    subtitle: 'Ethiopian Orthodox Church Mezmur',
    source: 'Zeno.fm',
    category: 'Religious',
    isLive: true,
    nowPlaying: 'Ethiopian Orthodox mezmur',
  },
  {
    id: 'voice-of-grace-radio',
    name: 'The Voice of Grace Radio',
    subtitle: 'Christian teaching, prayer, and worship song',
    source: 'Zeno.fm',
    category: 'Religious',
    isLive: true,
    nowPlaying: 'Christian worship and teaching',
  },
];

export async function GET() {
  // Sheger 102.1 is the featured station (only one marked featured in the source data).
  const featuredStation = stations.find((s) => s.id === 'sheger-1021') ?? stations[0];
  const remainingStations = stations.filter((s) => s.id !== featuredStation.id);

  return NextResponse.json(
    {
      featuredStation,
      stations: remainingStations,
    },
    {
      headers: {
        // Allow native mobile clients (React Native) to call this endpoint.
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    },
  );
}
