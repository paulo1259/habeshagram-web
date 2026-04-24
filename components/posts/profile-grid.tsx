import { FeedList } from "@/components/posts/feed-list";
import { EmptyState } from "@/components/ui/empty-state";
import { Post } from "@/types";

export function ProfileGrid({ posts }: { posts: Post[] }) {
  if (!posts.length) {
    return (
      <EmptyState
        title="No posts yet"
        description="When this user shares their first post, it will appear here."
      />
    );
  }

  return <FeedList posts={posts} isLoading={false} />;
}
