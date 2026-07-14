import { Post } from "@/types";

type TrendingHashtag = {
  tag: string;
  score: number;
  postCount: number;
};

type HotPost = {
  post: Post;
  score: number;
};

function getRecencyWeight(createdAt: string) {
  const hoursAgo = Math.max(0, (Date.now() - new Date(createdAt).getTime()) / 36e5);
  return Math.max(1, 24 - hoursAgo);
}

export function calculateTrendingHashtags(posts: Post[]): TrendingHashtag[] {
  const scores = new Map<string, TrendingHashtag>();

  posts.forEach((post) => {
    const recency = getRecencyWeight(post.createdAt);

    (post.hashtags ?? []).forEach((tag) => {
      const current = scores.get(tag) ?? { tag, score: 0, postCount: 0 };
      current.score += recency + post.likeCount * 0.4 + post.commentCount * 0.7;
      current.postCount += 1;
      scores.set(tag, current);
    });
  });

  // TODO: Move this ranking to a backend job or API once the feed volume grows.
  return [...scores.values()].sort((a, b) => b.score - a.score).slice(0, 6);
}

export function calculateHotPosts(posts: Post[]): HotPost[] {
  return posts
    .map((post) => ({
      post,
      score: post.likeCount + post.commentCount * 1.5 + getRecencyWeight(post.createdAt)
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}
