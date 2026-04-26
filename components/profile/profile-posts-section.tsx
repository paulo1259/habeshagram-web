"use client";

import { Pin, PinOff, ImageIcon, MessageSquareText } from "lucide-react";
import { FeedList } from "@/components/posts/feed-list";
import { PostCard } from "@/components/posts/post-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { Post } from "@/types";

function ProfilePostShell({
  post,
  canPin,
  isPinned,
  onPinToggle
}: {
  post: Post;
  canPin?: boolean;
  isPinned?: boolean;
  onPinToggle?: (postId: string) => void;
}) {
  return (
    <div className="space-y-2">
      {canPin ? (
        <div className="flex justify-end">
          <Button
            type="button"
            variant={isPinned ? "outline" : "ghost"}
            className="min-h-9 gap-2 px-3 text-xs"
            onClick={() => onPinToggle?.(post.id)}
          >
            {isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
            {isPinned ? "Unpin post" : "Pin to profile"}
          </Button>
        </div>
      ) : null}
      <PostCard post={post} />
    </div>
  );
}

export function ProfilePostsSection({
  posts,
  pinnedPostId,
  canManagePinned = false,
  isLoading = false,
  onPinToggle
}: {
  posts: Post[];
  pinnedPostId?: string;
  canManagePinned?: boolean;
  isLoading?: boolean;
  onPinToggle?: (postId?: string) => void;
}) {
  const pinnedPost = pinnedPostId ? posts.find((post) => post.id === pinnedPostId) ?? null : null;
  const remainingPosts = posts.filter((post) => post.id !== pinnedPost?.id);
  const imagePostCount = posts.filter((post) => Boolean(post.imageURL)).length;
  const textPostCount = posts.length - imagePostCount;

  if (isLoading) {
    return <FeedList posts={[]} isLoading />;
  }

  if (!posts.length) {
    return (
      <EmptyState
        title="No posts yet"
        description="When this user shares their first post, it will appear here."
      />
    );
  }

  return (
    <div className="page-stack">
      <section className="surface-panel p-4 sm:p-5">
        <SectionHeader
          eyebrow="Profile Activity"
          title="Posts and moments"
          description="A smoother way to browse recent thoughts, image posts, and anything the profile owner wants to keep at the top."
        />

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-800">
            {posts.length} total posts
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-stone-600 shadow-sm">
            <ImageIcon className="h-3.5 w-3.5 text-brand-700" />
            {imagePostCount} with media
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-stone-600 shadow-sm">
            <MessageSquareText className="h-3.5 w-3.5 text-brand-700" />
            {textPostCount} text-first
          </span>
          {pinnedPost ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700">
              <Pin className="h-3.5 w-3.5" />
              Pinned post active
            </span>
          ) : null}
        </div>
      </section>

      {pinnedPost ? (
        <section className="surface-panel p-4 sm:p-5">
          <SectionHeader
            eyebrow="Pinned Post"
            title="Kept at the top"
            description="A simple way to spotlight one post that best represents this profile right now."
          />

          <div className="mt-4">
            <ProfilePostShell
              post={pinnedPost}
              canPin={canManagePinned}
              isPinned
              onPinToggle={() => onPinToggle?.(undefined)}
            />
          </div>
        </section>
      ) : null}

      <section className="section-stack">
        <SectionHeader
          eyebrow="Recent Posts"
          title={pinnedPost ? "More from this profile" : "Recent posts"}
          description="Recent posts stay easy to scan, while pinned content no longer gets lost in the feed."
        />

        {canManagePinned ? (
          <div className="space-y-4">
            {remainingPosts.map((post) => (
              <ProfilePostShell
                key={post.id}
                post={post}
                canPin
                isPinned={false}
                onPinToggle={() => onPinToggle?.(post.id)}
              />
            ))}
          </div>
        ) : (
          <FeedList posts={remainingPosts} isLoading={false} />
        )}
      </section>
    </div>
  );
}
