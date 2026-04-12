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
  hashtags?: string[];
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
