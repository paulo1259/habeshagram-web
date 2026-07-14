import { BreakingItem, DailyDebatePrompt, LocalNewsItem, RadioStation } from "@/types";

export const radioStations: RadioStation[] = [
  {
    id: "sheger-1021",
    name: "Sheger 102.1",
    frequency: "102.1 FM",
    city: "Addis Ababa",
    description: "News, talk, and entertainment",
    provider: "Zeno",
    playbackMode: "stream",
    embedUrl: "https://zeno.fm/player/sheger-fm",
    streamUrl: "https://stream.zenolive.com/y91n1vtbaw5tv",
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
    streamUrl: "https://stream.zeno.fm/72y045deqeruv",
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

export const breakingItems: BreakingItem[] = [
  {
    id: "breaking-1",
    headline: "Addis creators are turning Sunday meetups into fashion, food, and community content nights",
    source: "HabeshaGram Culture Desk",
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    category: "Community",
    badge: "BREAKING"
  },
  {
    id: "breaking-2",
    headline: "New Ethio-jazz listening nights are selling out across Addis and diaspora cities alike",
    source: "HabeshaGram Music Desk",
    timestamp: new Date(Date.now() - 1000 * 60 * 41).toISOString(),
    category: "Culture",
    badge: "LIVE"
  },
  {
    id: "breaking-3",
    headline: "Timeline debate: which city has the strongest Habesha food scene outside East Africa?",
    source: "HabeshaGram Food Desk",
    timestamp: new Date(Date.now() - 1000 * 60 * 66).toISOString(),
    category: "Culture",
    badge: "JUST IN"
  },
  {
    id: "breaking-4",
    headline: "Community spotlight: diaspora mentorship circles are quietly changing career paths back home",
    source: "HabeshaGram Community Desk",
    timestamp: new Date(Date.now() - 1000 * 60 * 92).toISOString(),
    category: "Community",
    badge: "LIVE"
  }
];

export const dailyDebatePrompts: DailyDebatePrompt[] = [
  {
    id: "debate-1",
    prompt: "Is the third round of buna the best one, or is that just nostalgia talking?",
    category: "Culture",
    hashtag: "Buna",
    suggestedText: "My buna take today: #Buna",
    active: true,
    featured: true,
    publishLabel: "Today",
    createdAt: "2026-04-14T08:00:00.000Z"
  },
  {
    id: "debate-2",
    prompt: "Which city outside East Africa has the strongest Habesha food scene right now?",
    category: "Big Debate",
    hashtag: "HabeshaFood",
    suggestedText: "My pick for the strongest Habesha food city: #HabeshaFood",
    active: true,
    publishLabel: "Today",
    createdAt: "2026-04-14T07:30:00.000Z"
  },
  {
    id: "debate-3",
    prompt: "Modern Ethio-jazz remixes: fresh evolution or leave the classics alone?",
    category: "Culture",
    hashtag: "EthioJazz",
    suggestedText: "My honest Ethio-jazz take tonight: #EthioJazz",
    active: true,
    publishLabel: "Today",
    createdAt: "2026-04-14T07:00:00.000Z"
  },
  {
    id: "debate-4",
    prompt: "Who is carrying Habesha community life more right now: the diaspora or the cities back home?",
    category: "Community",
    hashtag: "HabeshaCommunity",
    suggestedText: "Today's community debate: #HabeshaCommunity",
    active: true,
    publishLabel: "Today",
    createdAt: "2026-04-14T06:30:00.000Z"
  }
];
