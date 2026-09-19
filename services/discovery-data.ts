import { RadioStation } from "@/types";

export const radioStations: RadioStation[] = [
  {
    id: "sheger-1021",
    name: "Sheger 102.1",
    frequency: "102.1 FM",
    city: "Addis Ababa",
    description: "News, talk, and entertainment",
    provider: "Zeno.fm",
    playbackMode: "widget",
    embedUrl: "https://zeno.fm/player/sheger-fm",
    streamUrl: "",
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
    playbackMode: "widget",
    embedUrl: "https://zeno.fm/player/wengelfm",
    streamUrl: "",
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
    playbackMode: "widget",
    embedUrl: "https://zeno.fm/player/Thevoiceofgraceradio",
    streamUrl: "",
    featured: false,
    status: "live",
    tags: ["Religious", "Ethiopia", "Amharic", "Christian"]
  }
];
