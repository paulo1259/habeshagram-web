export type User = {
  id: string;
  username: string;
  email: string;
  profileImageURL: string;
  bio: string;
  createdAt: string;
  followerCount: number;
  followingCount: number;
  pinnedPostId?: string;
};

export type Post = {
  id: string;
  userId: string;
  username: string;
  userProfileImageURL: string;
  text: string;
  imageURL: string;
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

export type FollowRelation = {
  followerId: string;
  followingId: string;
  createdAt: string;
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

export type DailyDebatePrompt = {
  id: string;
  prompt: string;
  category: "Big Debate" | "Community" | "Culture";
  hashtag?: string;
  suggestedText: string;
  featured?: boolean;
  active: boolean;
  publishLabel?: string;
  createdAt?: string;
};

export type CuratedVideoCategory = "Community Moments" | "Culture" | "Music" | "Events";

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
  hashtags?: string[];
  createdAt: string;
  publishLabel?: string;
  featured?: boolean;
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

export type PostReportStatus = "open" | "reviewed" | "dismissed" | "escalated";

export type PostReport = {
  id: string;
  postId: string;
  reportedUserId: string;
  reporterUserId: string;
  reporterUsername: string;
  reporterProfileImageURL: string;
  reason: PostReportReason;
  details: string;
  status: PostReportStatus;
  postTextPreview: string;
  postImageURL: string;
  createdAt: string;
};
