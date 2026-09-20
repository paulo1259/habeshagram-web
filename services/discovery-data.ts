import { RadioStation } from "@/types";

/**
 * Every station is a direct Zeno.fm stream.
 *
 * Three of these (Sheger, Wengel, Voice of Grace) used to be `widget` mode,
 * rendering a provider iframe instead of playing through the app's own audio
 * element — which meant no volume control, no sleep timer, no Media Session
 * and no lock-screen controls for half the lineup. Their mount IDs were
 * resolved from the Zeno player pages so they now run through the same path
 * as the rest. `embedUrl` is kept only as a human-readable provider link.
 */

export const radioStations: RadioStation[] = [
  {
    id: "sheger-1021",
    name: "Sheger 102.1",
    frequency: "102.1 FM",
    city: "Addis Ababa",
    description: "News, talk, and entertainment",
    provider: "Zeno.fm",
    playbackMode: "stream",
    embedUrl: "https://zeno.fm/player/sheger-fm",
    streamUrl: "https://stream.zeno.fm/kr5k02vagt5tv",
    featured: false,
    status: "live",
    tags: ["News", "Talk", "Entertainment"]
  },
  {
    id: "ethio-fm-1078",
    name: "Ethio FM 107.8",
    frequency: "107.8 FM",
    city: "Addis Ababa",
    description: "Entertainment, news, and sports",
    provider: "Zeno.fm",
    playbackMode: "stream",
    embedUrl: "",
    streamUrl: "https://stream.zeno.fm/72y045deqeruv",
    featured: true,
    status: "live",
    tags: ["Entertainment", "News", "Sports"]
  },
  {
    id: "fm-addis-971",
    name: "FM Addis 97.1",
    frequency: "97.1 FM",
    city: "Addis Ababa",
    description: "EBC FM Addis live radio",
    provider: "Radio Garden",
    playbackMode: "stream",
    embedUrl: "",
    streamUrl: "https://stream.zeno.fm/rb6wbrap7yzuv",
    featured: false,
    status: "live",
    tags: ["EBC", "Talk", "Live"]
  },
  {
    id: "wengel-fm",
    name: "Wengel FM",
    frequency: "Online",
    city: "Addis Ababa, Ethiopia",
    description: "Religious radio with Amharic and English programming from Addis Ababa.",
    provider: "Zeno.fm",
    playbackMode: "stream",
    embedUrl: "https://zeno.fm/player/wengelfm",
    streamUrl: "https://stream.zeno.fm/wsat39ewmd0uv",
    featured: false,
    status: "live",
    tags: ["Religious", "Ethiopia", "Amharic", "English"]
  },
  {
    id: "orthodox-radio",
    name: "Orthodox Radio",
    frequency: "Online",
    city: "Ethiopia",
    description: "Ethiopian Orthodox Church Mezmur",
    provider: "Zeno.fm",
    playbackMode: "stream",
    embedUrl: "https://zeno.fm/player/orthodox",
    streamUrl: "https://stream.zeno.fm/pfaho9uockwuv",
    featured: false,
    status: "live",
    tags: ["Religious", "Ethiopia", "Amharic", "Orthodox"]
  },
  {
    id: "voice-of-grace-radio",
    name: "The Voice of Grace Radio",
    frequency: "Online",
    city: "Ethiopia",
    description: "Christian teaching, prayer, worship song",
    provider: "Zeno.fm",
    playbackMode: "stream",
    embedUrl: "https://zeno.fm/player/Thevoiceofgraceradio",
    streamUrl: "https://stream.zeno.fm/bbnz36ojnrktv",
    featured: false,
    status: "live",
    tags: ["Religious", "Ethiopia", "Amharic", "Christian"]
  }
];
