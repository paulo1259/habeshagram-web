export type User = {
  id: string;
  username: string;
  email: string;
  profileImageURL: string;
  bio: string;
  createdAt: string;
  followerCount: number;
  followingCount: number;
};

export type Post = {
  id: string;
  userId: string;
  username: string;
  userProfileImageURL: string;
  text: string;
  imageURL: string;
  teamTag?: FootballTeam;
  matchTag?: string;
  hashtags?: string[];
  summary?: string;
  sourceLabel?: string;
  sourceUrl?: string;
  isSystem?: boolean;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  likedBy: string[];
};

export type Comment = {
  id: string;
  postId: string;
  userId: string;
  username: string;
  text: string;
  createdAt: string;
};

export type AppState = {
  users: User[];
  posts: Post[];
  comments: Comment[];
  follows: FollowRelation[];
  notifications: NotificationItem[];
  savedPosts: SavedPostItem[];
  reports: PostReport[];
  currentUserId: string | null;
};

export type CreatePostInput = {
  text: string;
  imageFile?: File | null;
  imageURL?: string;
  teamTag?: FootballTeam;
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

export type LocalNewsItem = {
  id: string;
  headline: string;
  source: string;
  summary: string;
  category: string;
  imageURL: string;
  link: string;
};

export type FollowRelation = {
  followerId: string;
  followingId: string;
  createdAt: string;
};

export type FootballTeam = "Manchester United" | "Arsenal" | "Chelsea" | "Manchester City";

export type FootballNewsItem = {
  id: string;
  headline: string;
  source: string;
  summary: string;
  category: "Matchday" | "Transfer Buzz" | "Fan Reactions" | "Club News" | "Big Debate";
  team: FootballTeam;
  imageURL: string;
  link: string;
};

export type BreakingBadge = "BREAKING" | "LIVE" | "JUST IN";

export type BreakingItem = {
  id: string;
  headline: string;
  source: string;
  summary?: string;
  link?: string;
  timestamp: string;
  category: "Football" | "Culture" | "Community" | "Events";
  badge: BreakingBadge;
  team?: FootballTeam;
};

export type DailyDebatePrompt = {
  id: string;
  prompt: string;
  category: "Big Debate" | "Fan Base" | "Matchday" | "Community";
  teamTag?: FootballTeam;
  hashtag?: string;
  suggestedText: string;
  featured?: boolean;
  active: boolean;
  publishLabel?: string;
  createdAt?: string;
};

export type CuratedVideoCategory = "Football Moments" | "Fan Reactions" | "Culture" | "Music";

export type CuratedVideoItem = {
  id: string;
  title: string;
  category: CuratedVideoCategory;
  source: string;
  summary: string;
  thumbnailURL: string;
  videoUrl: string;
  embedUrl: string;
  duration: string;
  teamTag?: FootballTeam;
  hashtags?: string[];
  createdAt: string;
  publishLabel?: string;
  featured?: boolean;
};

export type LiveMatchStatus = "LIVE" | "HT" | "FT" | "UPCOMING";

export type LiveMatchEvent = {
  id: string;
  minute: string;
  team: FootballTeam;
  type: "goal" | "yellow" | "red";
  player: string;
  description: string;
};

export type LiveMatch = {
  id: string;
  homeTeam: FootballTeam;
  awayTeam: FootballTeam;
  homeScore: number;
  awayScore: number;
  status: LiveMatchStatus;
  matchClock: string;
  venue: string;
  kickoffAt?: string;
  timeline: LiveMatchEvent[];
};

export type GoalAlertItem = {
  id: string;
  matchId: string;
  message: string;
  minute?: string;
  scorer?: string;
  team?: FootballTeam;
};

export type LeagueStandingRow = {
  position: number;
  team: string;
  teamTag?: FootballTeam;
  tracked?: boolean;
  played: number;
  points: number;
  goalDifference: number;
};

export type MatchdayFixtureStatus = "upcoming" | "live" | "finished";

export type MatchdayFixture = {
  id: string;
  homeTeam: FootballTeam;
  awayTeam: FootballTeam;
  kickoffAt: string;
  venue: string;
  status: MatchdayFixtureStatus;
  homeScore?: number;
  awayScore?: number;
  featured?: boolean;
};

export type MatchdayAlert = {
  id: string;
  badge: "GOAL" | "RED CARD" | "BREAKING";
  headline: string;
  detail: string;
  timestamp: string;
  team?: FootballTeam;
};

export type NotificationItem = {
  id: string;
  type: "like" | "comment" | "follow";
  recipientUserId?: string;
  actorUserId: string;
  actorUsername: string;
  actorProfileImageURL: string;
  targetPostId?: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export type SavedPostItem = {
  userId: string;
  postId: string;
  savedAt: string;
};

export type PostReportReason = "spam" | "harassment" | "hate" | "other";

export type PostReport = {
  id: string;
  postId: string;
  reportedUserId: string;
  reporterUserId: string;
  reporterUsername: string;
  reporterProfileImageURL: string;
  reason: PostReportReason;
  details: string;
  status: "open";
  postTextPreview: string;
  postImageURL: string;
  createdAt: string;
};
