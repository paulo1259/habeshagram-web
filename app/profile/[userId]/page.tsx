"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
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
  const { currentUser, getProfilePosts, isReady } = useAppData();
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
        <div className="space-y-4">
          <ProfileSkeleton />
          <ProfileGridSkeleton />
        </div>
      ) : profileUser ? (
        <div className="space-y-4">
          <section className="rounded-[32px] border border-brand-100/80 bg-white/94 p-5 shadow-soft sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <Avatar
                  username={profileUser.username}
                  imageURL={profileUser.profileImageURL}
                  className="h-20 w-20 text-xl"
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                    Community Profile
                  </p>
                  <h1 className="mt-1 text-2xl font-black tracking-tight text-ink sm:text-3xl">
                    @{profileUser.username}
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-700">{profileUser.bio}</p>
                  <div className="mt-4 flex flex-wrap gap-3 text-sm text-stone-600">
                    <span className="rounded-full bg-brand-50 px-3 py-1.5 font-medium text-brand-800">
                      {posts.length} posts
                    </span>
                    <span className="rounded-full bg-white px-3 py-1.5">
                      {profileUser.followerCount} followers
                    </span>
                    <span className="rounded-full bg-white px-3 py-1.5">
                      {profileUser.followingCount} following
                    </span>
                    {joinedLabel ? <span className="rounded-full bg-white px-3 py-1.5">Joined {joinedLabel}</span> : null}
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

          <ProfileGrid posts={posts} />
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
