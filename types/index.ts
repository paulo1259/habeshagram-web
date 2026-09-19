export type User = {
  id: string;
  username: string;
  profileImageURL: string;
  bio: string;
  createdAt: string;
};

export type RadioStation = {
  id: string;
  name: string;
  frequency: string;
  city: string;
  description: string;
  provider: string;
  playbackMode: "widget" | "stream" | "external";
  embedUrl: string;
  streamUrl: string;
  featured: boolean;
  status: "live" | "soon";
  tags?: string[];
};

export type EditorialHighlightCategory =
  | "Entertainment"
  | "Culture"
  | "Music"
  | "Events"
  | "Community";

export type LocalNewsItem = {
  id: string;
  headline: string;
  source: string;
  summary: string;
  category: EditorialHighlightCategory | string;
  imageURL: string;
  link: string;
  featured?: boolean;
  createdAt?: string;
  publishLabel?: string;
  hashtags?: string[];
};

export type WorldNewsSectionKey = "top" | "ethiopia" | "eastafrica" | "diaspora";

export type WorldNewsItem = {
  id: string;
  headline: string;
  source: string;
  summary: string;
  category: "Top stories" | "Ethiopia" | "East Africa" | "Diaspora & Immigration";
  imageURL: string;
  link: string;
  publishedAt: string;
  publishLabel: string;
  section: WorldNewsSectionKey;
};

export type BreakingBadge = "BREAKING" | "LIVE" | "JUST IN";

export type BreakingItem = {
  id: string;
  headline: string;
  source: string;
  summary?: string;
  link?: string;
  timestamp: string;
  category: "News" | "Culture" | "Community" | "Events";
  badge: BreakingBadge;
};
