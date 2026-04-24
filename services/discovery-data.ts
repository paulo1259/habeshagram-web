import { BreakingItem, DailyDebatePrompt, FootballNewsItem, LocalNewsItem, RadioStation } from "@/types";

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

export const footballBuzzItems: FootballNewsItem[] = [
  {
    id: "football-1",
    headline: "United fans are split again over the midfield balance, and Addis group chats are on fire",
    source: "HabeshaGram Fan Zone",
    summary:
      "One side wants control, the other wants chaos. Either way, Manchester United talk is dominating late-night reactions this week.",
    category: "Big Debate",
    team: "Manchester United",
    imageURL:
      "https://images.unsplash.com/photo-1543357480-c60d40007a3f?auto=format&fit=crop&w=1200&q=80",
    link: ""
  },
  {
    id: "football-1b",
    headline: "Manchester United watch parties in Addis are turning every late kickoff into a full tactical argument",
    source: "Red Room Addis",
    summary:
      "From lineup panic to post-match optimism, United conversations are still some of the loudest in the city.",
    category: "Fan Reactions",
    team: "Manchester United",
    imageURL:
      "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=1200&q=80",
    link: ""
  },
  {
    id: "football-2",
    headline: "Arsenal supporters are already calling this the kind of weekend that shapes a title race",
    source: "Premier Addis",
    summary:
      "Form, nerves, and expectations are all colliding. Arsenal fans are watching every result like it might decide the season.",
    category: "Matchday",
    team: "Arsenal",
    imageURL:
      "https://images.unsplash.com/photo-1518604666860-9ed391f76460?auto=format&fit=crop&w=1200&q=80",
    link: ""
  },
  {
    id: "football-2b",
    headline: "Arsenal fans keep asking the same question: is this finally the season that feels grown up?",
    source: "North London Addis",
    summary:
      "The football is smooth, the pressure is real, and fans are weighing style against the kind of edge that wins titles.",
    category: "Big Debate",
    team: "Arsenal",
    imageURL:
      "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=1200&q=80",
    link: ""
  },
  {
    id: "football-3",
    headline: "Chelsea fans are treating every young player rumor like the next big long-term project",
    source: "Blue Corner Addis",
    summary:
      "Transfer chatter is back in full swing, and the mood swings are exactly what you would expect from a Chelsea timeline.",
    category: "Transfer Buzz",
    team: "Chelsea",
    imageURL:
      "https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=1200&q=80",
    link: ""
  },
  {
    id: "football-3b",
    headline: "Chelsea supporters in Habesha timelines are still trying to decide which pieces are actually untouchable",
    source: "Blue Corner Addis",
    summary:
      "The squad is full of names people want to believe in, which makes every selection choice feel bigger than it should.",
    category: "Club News",
    team: "Chelsea",
    imageURL:
      "https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&w=1200&q=80",
    link: ""
  },
  {
    id: "football-4",
    headline: "City supporters say the standards are still absurdly high, even when the performance looks comfortable",
    source: "Touchline Addis",
    summary:
      "Manchester City reactions are rarely calm. Even easy wins turn into conversations about control, depth, and the next big test.",
    category: "Club News",
    team: "Manchester City",
    imageURL:
      "https://images.unsplash.com/photo-1508098682722-e99c643e7485?auto=format&fit=crop&w=1200&q=80",
    link: ""
  },
  {
    id: "football-4b",
    headline: "Manchester City fans are already measuring the next run of fixtures like a final exam",
    source: "Touchline Addis",
    summary:
      "Depth, control, and small margins still dominate City conversations, especially when the schedule tightens.",
    category: "Matchday",
    team: "Manchester City",
    imageURL:
      "https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=1200&q=80",
    link: ""
  }
];

export const breakingItems: BreakingItem[] = [
  {
    id: "breaking-1",
    headline: "Manchester United lineup rumors are already taking over Habesha timelines ahead of kickoff",
    source: "Matchday Addis",
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    category: "Football",
    badge: "BREAKING",
    team: "Manchester United"
  },
  {
    id: "breaking-2",
    headline: "Arsenal group chats are debating whether this is the most balanced side in the league right now",
    source: "North London Addis",
    timestamp: new Date(Date.now() - 1000 * 60 * 41).toISOString(),
    category: "Football",
    badge: "LIVE",
    team: "Arsenal"
  },
  {
    id: "breaking-3",
    headline: "Chelsea fan pages are lighting up again after another wave of rebuild talk",
    source: "Blue Corner Addis",
    timestamp: new Date(Date.now() - 1000 * 60 * 66).toISOString(),
    category: "Football",
    badge: "JUST IN",
    team: "Chelsea"
  },
  {
    id: "breaking-4",
    headline: "Manchester City supporters are already framing the next fixture as a season-shaping checkpoint",
    source: "Touchline Addis",
    timestamp: new Date(Date.now() - 1000 * 60 * 92).toISOString(),
    category: "Football",
    badge: "LIVE",
    team: "Manchester City"
  },
  {
    id: "breaking-5",
    headline: "Addis creators are turning Sunday meetups into a mix of football, fashion, and community content nights",
    source: "HabeshaGram Culture Desk",
    timestamp: new Date(Date.now() - 1000 * 60 * 130).toISOString(),
    category: "Community",
    badge: "JUST IN"
  }
];

export const dailyDebatePrompts: DailyDebatePrompt[] = [
  {
    id: "debate-1",
    prompt: "Is Arsenal the most complete side in the league right now?",
    category: "Big Debate",
    teamTag: "Arsenal",
    hashtag: "COYG",
    suggestedText: "My take on Arsenal right now: #COYG",
    active: true,
    featured: true,
    publishLabel: "Today",
    createdAt: "2026-04-14T08:00:00.000Z"
  },
  {
    id: "debate-2",
    prompt: "Should Chelsea rebuild again, or finally trust what they already have?",
    category: "Big Debate",
    teamTag: "Chelsea",
    hashtag: "CFC",
    suggestedText: "My Chelsea rebuild take: #CFC",
    active: true,
    publishLabel: "Today",
    createdAt: "2026-04-14T07:30:00.000Z"
  },
  {
    id: "debate-3",
    prompt: "Is Manchester United still a top club, or are fans living on history and hope?",
    category: "Fan Base",
    teamTag: "Manchester United",
    hashtag: "GGMU",
    suggestedText: "My honest United take tonight: #GGMU",
    active: true,
    publishLabel: "Today",
    createdAt: "2026-04-14T07:00:00.000Z"
  },
  {
    id: "debate-4",
    prompt: "Are Manchester City standards now so high that comfortable wins still feel underwhelming?",
    category: "Matchday",
    teamTag: "Manchester City",
    hashtag: "MCFC",
    suggestedText: "City fans, here is my take: #MCFC",
    active: true,
    publishLabel: "Today",
    createdAt: "2026-04-14T06:30:00.000Z"
  },
  {
    id: "debate-5",
    prompt: "Who has the loudest football fan base in the Habesha community right now?",
    category: "Community",
    hashtag: "HabeshaFootball",
    suggestedText: "Today's Habesha football debate: #HabeshaFootball",
    active: true,
    publishLabel: "Today",
    createdAt: "2026-04-14T06:00:00.000Z"
  }
];
