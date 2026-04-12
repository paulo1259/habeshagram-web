import { FeedSkeleton } from "@/components/posts/feed-skeleton";
import { PostCard } from "@/components/posts/post-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Post } from "@/types";

export function FeedList({ posts, isLoading }: { posts: Post[]; isLoading: boolean }) {
  if (isLoading) {
    return <FeedSkeleton />;
  }

  if (!posts.length) {
    return (
      <EmptyState
        title="The feed is quiet"
        description="Create the first post and get the community talking."
      />
    );
  }

  return (
    <div className="overflow-hidden border-y border-brand-100/80 bg-white/94 sm:space-y-3 sm:border-0 sm:bg-transparent">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
