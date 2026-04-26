import { ProfilePostsSection } from "@/components/profile/profile-posts-section";
import { Post } from "@/types";

export function ProfileGrid({
  posts,
  pinnedPostId,
  canManagePinned = false,
  onPinToggle
}: {
  posts: Post[];
  pinnedPostId?: string;
  canManagePinned?: boolean;
  onPinToggle?: (postId?: string) => void;
}) {
  return (
    <ProfilePostsSection
      posts={posts}
      pinnedPostId={pinnedPostId}
      canManagePinned={canManagePinned}
      onPinToggle={onPinToggle}
    />
  );
}
