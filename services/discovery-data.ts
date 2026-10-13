import { RadioStation } from "@/types";

/**
 * The first six are direct Zeno.fm streams; the rest come from the HabeshaGram
 * iOS app's list (Radio Garden stream addresses, which redirect to each
 * station's own live stream). Every one was checked to play before adding.
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
  },
  {
    id: "bisrat-fm-1011",
    name: "Bisrat FM 101.1",
    frequency: "101.1 FM",
    city: "Addis Ababa",
    description: "Music, entertainment, and daily shows from Bisrat.",
    provider: "Radio Garden",
    playbackMode: "stream",
    embedUrl: "",
    streamUrl: "https://radio.garden/api/ara/content/listen/6q9bTdKO/channel.mp3",
    featured: false,
    status: "live",
    tags: ["Music", "Entertainment"]
  },
  {
    id: "ahadu-radio-943",
    name: "Ahadu Radio 94.3",
    frequency: "94.3 FM",
    city: "Addis Ababa",
    description: "News, current affairs, and talk from Ahadu.",
    provider: "Radio Garden",
    playbackMode: "stream",
    embedUrl: "",
    streamUrl: "https://radio.garden/api/ara/content/listen/bBTu1Yhr/channel.mp3",
    featured: false,
    status: "live",
    tags: ["News", "Talk"]
  },
  {
    id: "ebc-fm-1047",
    name: "EBC 104.7 FM",
    frequency: "104.7 FM",
    city: "Addis Ababa",
    description: "The national broadcaster live from Addis Ababa.",
    provider: "Radio Garden",
    playbackMode: "stream",
    embedUrl: "",
    streamUrl: "https://radio.garden/api/ara/content/listen/0UDpOLZU/channel.mp3",
    featured: false,
    status: "live",
    tags: ["EBC", "National", "News"]
  },
  {
    id: "arada-fm-951",
    name: "Arada FM 95.1",
    frequency: "95.1 FM",
    city: "Addis Ababa",
    description: "Music and entertainment with an Arada flavor.",
    provider: "Radio Garden",
    playbackMode: "stream",
    embedUrl: "",
    streamUrl: "https://radio.garden/api/ara/content/listen/awONg9RE/channel.mp3",
    featured: false,
    status: "live",
    tags: ["Music", "Entertainment"]
  },
  {
    id: "tirita-fm-976",
    name: "Tirita 97.6 FM",
    frequency: "97.6 FM",
    city: "Addis Ababa",
    description: "Ethiopian music and easy listening around the clock.",
    provider: "Radio Garden",
    playbackMode: "stream",
    embedUrl: "",
    streamUrl: "https://radio.garden/api/ara/content/listen/fgh3L10d/channel.mp3",
    featured: false,
    status: "live",
    tags: ["Music"]
  },
  {
    id: "qesht-fm-1053",
    name: "Qesht FM 105.3",
    frequency: "105.3 FM",
    city: "Addis Ababa",
    description: "Entertainment and lifestyle programming from Addis.",
    provider: "Radio Garden",
    playbackMode: "stream",
    embedUrl: "",
    streamUrl: "https://radio.garden/api/ara/content/listen/jr9CG2ML/channel.mp3",
    featured: false,
    status: "live",
    tags: ["Entertainment", "Lifestyle"]
  },
  {
    id: "taem-radio",
    name: "Taem Radio",
    frequency: "Online",
    city: "Addis Ababa",
    description: "ጣዕም ሬድዮ — culture, conversation, and music.",
    provider: "Radio Garden",
    playbackMode: "stream",
    embedUrl: "",
    streamUrl: "https://radio.garden/api/ara/content/listen/3Jm9Wmt0/channel.mp3",
    featured: false,
    status: "live",
    tags: ["Culture", "Talk"]
  },
  {
    id: "amhara-fm-969",
    name: "Amhara FM 96.9",
    frequency: "96.9 FM",
    city: "Bahir Dar",
    description: "Regional programming live from Bahir Dar.",
    provider: "Radio Garden",
    playbackMode: "stream",
    embedUrl: "",
    streamUrl: "https://radio.garden/api/ara/content/listen/fC8gwCAO/channel.mp3",
    featured: false,
    status: "live",
    tags: ["Regional", "Bahir Dar"]
  },
  {
    id: "amhara-radio",
    name: "Amhara Radio",
    frequency: "AM/Online",
    city: "Bahir Dar",
    description: "AMECO's flagship regional radio service.",
    provider: "Radio Garden",
    playbackMode: "stream",
    embedUrl: "",
    streamUrl: "https://radio.garden/api/ara/content/listen/FuCWOynM/channel.mp3",
    featured: false,
    status: "live",
    tags: ["Regional", "AMECO"]
  },
  {
    id: "debre-birhan-fm-914",
    name: "Debre Birhan FM 91.4",
    frequency: "91.4 FM",
    city: "Debre Birhan",
    description: "Community radio from Debre Birhan.",
    provider: "Radio Garden",
    playbackMode: "stream",
    embedUrl: "",
    streamUrl: "https://radio.garden/api/ara/content/listen/ZvK0ajzE/channel.mp3",
    featured: false,
    status: "live",
    tags: ["Regional", "Community"]
  }
];
