export type User = {
  id: string;
  username: string;
  email: string;
  profileImageURL: string;
  bio: string;
  createdAt: string;
};

export type Post = {
  id: string;
  userId: string;
  username: string;
  userProfileImageURL: string;
  text: string;
  imageURL: string;
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

export type LocalNewsItem = {
  id: string;
  headline: string;
  source: string;
  summary: string;
  category: string;
  imageURL: string;
  link: string;
};
