import { FeedSkeleton } from "@/components/posts/feed-skeleton";
import { PostCard } from "@/components/posts/post-card";
import { Reveal } from "@/components/motion/reveal";
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
    <div className="overflow-visible border-y border-white/[0.06] bg-card/60 sm:space-y-4 sm:border-0 sm:bg-transparent">
      {posts.map((post, index) => (
        <Reveal key={post.id} delay={Math.min(index, 4) * 60}>
          <PostCard post={post} />
        </Reveal>
      ))}
    </div>
  );
}
