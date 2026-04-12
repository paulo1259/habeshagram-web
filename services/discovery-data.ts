import { LocalNewsItem, RadioStation } from "@/types";

export const radioStations: RadioStation[] = [
  {
    id: "sheger-1021",
    name: "Sheger 102.1",
    frequency: "102.1 FM",
    city: "Addis Ababa",
    description: "News, talk, and entertainment",
    provider: "Zeno",
    playbackMode: "widget",
    embedUrl: "https://zeno.fm/player/sheger-fm",
    streamUrl: "",
    featured: true,
    status: "live",
    tags: ["News", "Talk", "Entertainment"]
  },
  {
    id: "ethio-fm-1078",
    name: "Ethio FM 107.8",
    frequency: "107.8 FM",
    city: "Addis Ababa",
    description: "Entertainment, news, and sports",
    provider: "Radio Garden",
    playbackMode: "stream",
    embedUrl: "",
    streamUrl: "https://radio.garden/api/ara/content/listen/StmwUVGt/channel.mp3",
    featured: false,
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
    streamUrl: "https://radio.garden/api/ara/content/listen/hmf5qN63/channel.mp3",
    featured: false,
    status: "live",
    tags: ["EBC", "Talk", "Live"]
  }
];

export const localNewsItems: LocalNewsItem[] = [
  {
    id: "news-1",
    headline: "Addis weekend art pop-up draws young designers, photographers, and music lovers",
    source: "Addis Insight",
    summary:
      "A new city art pop-up is blending fashion, visual storytelling, and independent DJs into one social gathering.",
    category: "Arts",
    imageURL:
      "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80",
    link: ""
  },
  {
    id: "news-2",
    headline: "What's Out Addis spotlights five live music nights worth planning around this month",
    source: "What's Out Addis",
    summary:
      "From jazz lounges to modern event spaces, the city calendar is filling with live performances and intimate sets.",
    category: "Music",
    imageURL:
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80",
    link: ""
  },
  {
    id: "news-3",
    headline: "Independent stylists bring traditional textures into a new wave of Addis street fashion",
    source: "Ethiopian Arts Network",
    summary:
      "Young creatives are reworking heritage-inspired silhouettes and fabrics into fresh everyday looks for the city.",
    category: "Fashion",
    imageURL:
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=80",
    link: ""
  },
  {
    id: "news-4",
    headline: "Food collectives in Addis are turning neighborhood dinners into cultural micro-events",
    source: "Addis Insight",
    summary:
      "Smaller supper clubs are mixing cuisine, storytelling, and music to create more community-centered nights out.",
    category: "Food",
    imageURL:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
    link: ""
  }
];
