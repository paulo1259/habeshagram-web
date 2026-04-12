import { getPosts } from "@/services/post-service";
import { getAllUsers } from "@/services/user-service";
import { Post, User } from "@/types";

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function scoreTextMatch(query: string, ...values: string[]) {
  const normalizedQuery = normalize(query);
  const haystack = values.map(normalize);

  if (!normalizedQuery) {
    return -1;
  }

  if (haystack.some((value) => value.startsWith(normalizedQuery))) {
    return 3;
  }

  if (haystack.some((value) => value.includes(normalizedQuery))) {
    return 2;
  }

  return -1;
}

export async function searchUsers(query: string): Promise<User[]> {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) {
    return [];
  }

  const users = await getAllUsers();

  // TODO: Replace this client-side filtering with Algolia/Meilisearch or a
  // dedicated indexed search endpoint once HabeshaGram needs true full-text search.
  return users
    .map((user) => ({
      user,
      score: scoreTextMatch(normalizedQuery, user.username, user.bio)
    }))
    .filter((item) => item.score >= 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return b.user.followerCount - a.user.followerCount;
    })
    .map((item) => item.user);
}

export async function searchPosts(query: string): Promise<Post[]> {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) {
    return [];
  }

  const posts = await getPosts();

  // TODO: Replace this fallback with a dedicated indexed search service when
  // post volume grows beyond what simple Firestore-backed filtering can support.
  return posts
    .map((post) => ({
      post,
      score: scoreTextMatch(normalizedQuery, post.text, post.username, ...(post.hashtags ?? []))
    }))
    .filter((item) => item.score >= 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return +new Date(b.post.createdAt) - +new Date(a.post.createdAt);
    })
    .map((item) => item.post);
}
