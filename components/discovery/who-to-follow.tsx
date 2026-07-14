"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/hooks/use-app-data";
import { getSuggestedUsers, isFollowingUser, toggleFollowUser } from "@/services/follow-service";
import { User } from "@/types";

export function WhoToFollow() {
  const { currentUser } = useAppData();
  const [users, setUsers] = useState<User[]>([]);
  const [followMap, setFollowMap] = useState<Record<string, boolean>>({});
  const [loadingUserId, setLoadingUserId] = useState("");

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      const nextUsers = await getSuggestedUsers(currentUser?.id);
      if (!isMounted) {
        return;
      }

      setUsers(nextUsers);

      if (currentUser) {
        const nextEntries = await Promise.all(
          nextUsers.map(async (user) => [user.id, await isFollowingUser(currentUser.id, user.id)] as const)
        );

        if (isMounted) {
          setFollowMap(Object.fromEntries(nextEntries));
        }
      } else {
        setFollowMap({});
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  async function handleToggleFollow(user: User) {
    if (!currentUser) {
      return;
    }

    try {
      setLoadingUserId(user.id);
      const result = await toggleFollowUser({
        actor: currentUser,
        followingId: user.id
      });
      setFollowMap((current) => ({ ...current, [user.id]: result.isFollowing }));
      setUsers((current) =>
        current.map((item) =>
          item.id === user.id ? { ...item, followerCount: result.followerCount } : item
        )
      );
    } finally {
      setLoadingUserId("");
    }
  }

  return (
    <section className="rounded-[28px] border border-brand-100/80 bg-card/96 p-5 shadow-soft">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">
        Who To Follow
      </p>
      <h3 className="mt-1 text-lg font-black tracking-tight text-ink">Creators lighting up the timeline</h3>
      <div className="mt-4 space-y-3">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between gap-3 rounded-[22px] border border-brand-100 bg-brand-50/30 px-4 py-3"
          >
            <Link href={`/profile/${user.id}`} className="flex min-w-0 items-center gap-3">
              <Avatar username={user.username} imageURL={user.profileImageURL} className="h-11 w-11" />
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">@{user.username}</p>
                <p className="mt-1 truncate text-sm text-stone-600">{user.bio}</p>
                <p className="mt-1 text-xs text-stone-500">{user.followerCount} followers</p>
              </div>
            </Link>

            {currentUser ? (
              <Button
                type="button"
                variant={followMap[user.id] ? "outline" : "primary"}
                className="shrink-0 px-3 py-2 text-xs"
                onClick={() => void handleToggleFollow(user)}
                disabled={loadingUserId === user.id}
              >
                {loadingUserId === user.id ? "..." : followMap[user.id] ? "Following" : "Follow"}
              </Button>
            ) : (
              <Link href="/login">
                <Button type="button" variant="outline" className="shrink-0 px-3 py-2 text-xs">
                  Follow
                </Button>
              </Link>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
