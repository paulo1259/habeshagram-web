"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Pin, Sparkles, Users2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { ProfileGridSkeleton } from "@/components/profile/profile-grid-skeleton";
import { ProfileGrid } from "@/components/posts/profile-grid";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProfileSkeleton } from "@/components/profile/profile-skeleton";
import { useAppData } from "@/hooks/use-app-data";
import { isFollowingUser, toggleFollowUser } from "@/services/follow-service";
import { getUserDocument, subscribeToUserDocument } from "@/services/user-service";
import { Post, User } from "@/types";

export default function PublicProfilePage() {
  const params = useParams<{ userId: string }>();
  const profileId = params.userId;
  const { currentUser, deletedPostIds, getProfilePosts, isReady } = useAppData();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isUpdatingFollow, setIsUpdatingFollow] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");
        const [user, userPosts] = await Promise.all([getUserDocument(profileId), getProfilePosts(profileId)]);

        if (!isMounted) {
          return;
        }

        setProfileUser(user);
        setPosts(userPosts);

        if (currentUser && user && currentUser.id !== user.id) {
          const nextIsFollowing = await isFollowingUser(currentUser.id, user.id);
          if (isMounted) {
            setIsFollowing(nextIsFollowing);
          }
        } else {
          setIsFollowing(false);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error ? error.message : "Unable to load this profile right now."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();

    const unsubscribe = subscribeToUserDocument(profileId, (user) => {
      if (isMounted) {
        setProfileUser(user);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [currentUser, getProfilePosts, profileId]);

  const joinedLabel = useMemo(() => {
    if (!profileUser?.createdAt) {
      return "";
    }

    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric"
    }).format(new Date(profileUser.createdAt));
  }, [profileUser?.createdAt]);

  const visiblePosts = useMemo(
    () => posts.filter((post) => !deletedPostIds.includes(post.id)),
    [deletedPostIds, posts]
  );
  const contributorLabel = useMemo(() => {
    if (visiblePosts.length >= 12) {
      return "Active community voice";
    }

    if (visiblePosts.length >= 4) {
      return "Community regular";
    }

    return "Habesha community member";
  }, [visiblePosts.length]);
  const bioText = profileUser?.bio?.trim()
    ? profileUser.bio
    : "No bio added yet, but this profile is part of the HabeshaGram community.";

  async function handleToggleFollow() {
    if (!currentUser || !profileUser || currentUser.id === profileUser.id) {
      return;
    }

    try {
      setIsUpdatingFollow(true);
      setErrorMessage("");
      const result = await toggleFollowUser({
        actor: currentUser,
        followingId: profileUser.id
      });
      setIsFollowing(result.isFollowing);
      setProfileUser((current) =>
        current ? { ...current, followerCount: result.followerCount } : current
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to update follow status.");
    } finally {
      setIsUpdatingFollow(false);
    }
  }

  return (
    <AppShell>
      {!isReady || isLoading ? (
        <div className="page-stack">
          <ProfileSkeleton />
          <ProfileGridSkeleton />
        </div>
      ) : profileUser ? (
        <div className="page-stack">
          <section className="surface-panel p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <Avatar
                  username={profileUser.username}
                  imageURL={profileUser.profileImageURL}
                  className="h-20 w-20 text-xl"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-brand-50 px-3 py-1 meta-label text-brand-800">
                      Community Profile
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-stone-600 shadow-sm">
                      <Sparkles className="h-3.5 w-3.5 text-brand-700" />
                      {contributorLabel}
                    </span>
                    {profileUser.pinnedPostId ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                        <Pin className="h-3.5 w-3.5" />
                        Pinned post
                      </span>
                    ) : null}
                  </div>
                  <h1 className="page-title mt-3 text-[2rem] sm:text-[2.2rem]">
                    @{profileUser.username}
                  </h1>
                  <div className="surface-card mt-4 bg-gradient-to-r from-brand-50/70 via-white to-orange-50/50 p-4 shadow-sm">
                    <p className="meta-label text-stone-500">About</p>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-700">{bioText}</p>
                  </div>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="surface-card bg-brand-50/65 px-4 py-3">
                      <p className="meta-label text-brand-700">Posts</p>
                      <p className="mt-2 text-lg font-black text-ink">{visiblePosts.length}</p>
                    </div>
                    <div className="surface-card px-4 py-3">
                      <p className="meta-label text-stone-500">Followers</p>
                      <p className="mt-2 text-lg font-black text-ink">{profileUser.followerCount}</p>
                    </div>
                    <div className="surface-card px-4 py-3">
                      <p className="meta-label text-stone-500">Following</p>
                      <p className="mt-2 text-lg font-black text-ink">{profileUser.followingCount}</p>
                    </div>
                    <div className="surface-card px-4 py-3">
                      <p className="meta-label text-stone-500">Joined</p>
                      <p className="mt-2 text-sm font-bold text-ink">{joinedLabel || "Recently"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {currentUser?.id === profileUser.id ? (
                <Link href="/profile">
                  <Button>Edit profile</Button>
                </Link>
              ) : currentUser ? (
                <Button onClick={handleToggleFollow} disabled={isUpdatingFollow}>
                  {isUpdatingFollow ? "Updating..." : isFollowing ? "Following" : "Follow"}
                </Button>
              ) : (
                <Link href="/login">
                  <Button>Log in to follow</Button>
                </Link>
              )}
            </div>

            {errorMessage ? <p className="mt-4 text-sm text-red-600">{errorMessage}</p> : null}
          </section>

          <section className="surface-card bg-brand-50/35 px-4 py-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-brand-800 shadow-sm">
                <Users2 className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="meta-label text-brand-700">Community feel</p>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  Profiles now feel more personal and easier to scan, with a clearer identity area and optional pinned post support when the owner sets one.
                </p>
              </div>
            </div>
          </section>

          <ProfileGrid posts={visiblePosts} pinnedPostId={profileUser.pinnedPostId} />
        </div>
      ) : (
        <EmptyState
          title="Profile not found"
          description="This HabeshaGram profile is not available yet or may have moved."
        />
      )}
    </AppShell>
  );
}
