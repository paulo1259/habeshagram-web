import { Post } from "@/types";
import { EmptyState } from "@/components/ui/empty-state";

export function ProfileGrid({ posts }: { posts: Post[] }) {
  if (!posts.length) {
    return (
      <EmptyState
        title="No posts yet"
        description="When this user shares their first post, it will appear here."
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {posts.map((post) => (
        <div key={post.id} className="overflow-hidden rounded-[28px] border border-brand-100/80 bg-white shadow-soft">
          {post.imageURL ? (
            <img src={post.imageURL} alt={post.text} className="aspect-square w-full object-cover" />
          ) : (
            <div className="flex aspect-square items-center justify-center bg-brand-50 p-4 text-center text-sm text-stone-600">
              {post.text}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
