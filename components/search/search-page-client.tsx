"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { FeedList } from "@/components/posts/feed-list";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useAppData } from "@/hooks/use-app-data";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { isFollowingUser, toggleFollowUser } from "@/services/follow-service";
import { searchPosts, searchUsers } from "@/services/search-service";
import { Post, User } from "@/types";

type SearchTab = "people" | "posts";

export function SearchPageClient({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const { currentUser } = useAppData();
  const [activeTab, setActiveTab] = useState<SearchTab>("people");
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebouncedValue(query, 250);
  const [peopleResults, setPeopleResults] = useState<User[]>([]);
  const [postResults, setPostResults] = useState<Post[]>([]);
  const [followMap, setFollowMap] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loadingUserId, setLoadingUserId] = useState("");

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    const nextQuery = debouncedQuery.trim();

    if (!nextQuery) {
      setPeopleResults([]);
      setPostResults([]);
      setFollowMap({});
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    void (async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");
        const [users, posts] = await Promise.all([searchUsers(nextQuery), searchPosts(nextQuery)]);

        if (!isMounted) {
          return;
        }

        setPeopleResults(users);
        setPostResults(posts);

        if (currentUser) {
          const entries = await Promise.all(
            users
              .filter((user) => user.id !== currentUser.id)
              .map(async (user) => [user.id, await isFollowingUser(currentUser.id, user.id)] as const)
          );

          if (isMounted) {
            setFollowMap(Object.fromEntries(entries));
          }
        } else {
          setFollowMap({});
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : "Unable to search right now.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [currentUser, debouncedQuery]);

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuery = query.trim();
    router.replace(nextQuery ? `/search?q=${encodeURIComponent(nextQuery)}` : "/search");
  }

  async function handleToggleFollow(user: User) {
    if (!currentUser || currentUser.id === user.id) {
      return;
    }

    try {
      setLoadingUserId(user.id);
      const result = await toggleFollowUser({
        actor: currentUser,
        followingId: user.id
      });
      setFollowMap((current) => ({ ...current, [user.id]: result.isFollowing }));
      setPeopleResults((current) =>
        current.map((item) =>
          item.id === user.id ? { ...item, followerCount: result.followerCount } : item
        )
      );
    } finally {
      setLoadingUserId("");
    }
  }

  const activeCount = activeTab === "people" ? peopleResults.length : postResults.length;

  return (
    <AppShell>
      <div className="space-y-4">
        <section className="glass-card rounded-[30px] border border-brand-100/80 p-4 shadow-soft sm:p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">
            Search
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-ink">Find people and posts</h1>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Search HabeshaGram by username, bio, post text, and football-related conversation.
          </p>

          <form
            onSubmit={handleSearchSubmit}
            className="mt-4 flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50/40 px-4 py-3 transition duration-200 focus-within:border-brand-200 focus-within:bg-white"
          >
            <Search className="h-4 w-4 text-stone-400" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search people, posts, football, trends"
              className="w-full bg-transparent text-sm outline-none placeholder:text-stone-400"
            />
          </form>

          <div className="mt-4 inline-flex rounded-full border border-brand-100 bg-white p-1 shadow-soft">
            <button
              type="button"
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === "people"
                  ? "bg-gradient-to-r from-brand-500 to-orange-400 text-white"
                  : "text-stone-600 hover:bg-brand-50"
              }`}
              onClick={() => setActiveTab("people")}
            >
              People
            </button>
            <button
              type="button"
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === "posts"
                  ? "bg-gradient-to-r from-brand-500 to-orange-400 text-white"
                  : "text-stone-600 hover:bg-brand-50"
              }`}
              onClick={() => setActiveTab("posts")}
            >
              Posts
            </button>
          </div>
        </section>

        {errorMessage ? (
          <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>
        ) : null}

        {!debouncedQuery.trim() ? (
          <EmptyState
            title="Start searching"
            description="Try usernames, club names, football debates, or any post topic you want to discover."
          />
        ) : isLoading ? (
          <div className="glass-card rounded-[30px] border border-brand-100/80 p-5 shadow-soft">
            <div className="space-y-3">
              <p className="text-sm font-medium text-stone-600">Searching HabeshaGram...</p>
              <div className="grid gap-3">
                {[1, 2].map((item) => (
                  <div key={item} className="rounded-[24px] bg-brand-50/45 px-4 py-4">
                    <div className="h-4 w-1/3 animate-pulse rounded-full bg-brand-100" />
                    <div className="mt-3 h-3.5 w-full animate-pulse rounded-full bg-brand-100" />
                    <div className="mt-2 h-3.5 w-4/5 animate-pulse rounded-full bg-brand-100" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeCount === 0 ? (
          <EmptyState
            title="No matches yet"
            description="Try a broader username, football keyword, or post topic to find more results."
          />
        ) : activeTab === "people" ? (
          <section className="space-y-3">
            {peopleResults.map((user) => (
              <article
                key={user.id}
                className="glass-card flex items-center justify-between gap-3 rounded-[28px] border border-brand-100/80 p-4 shadow-soft transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <Link href={`/profile/${user.id}`} className="flex min-w-0 items-center gap-3">
                  <Avatar username={user.username} imageURL={user.profileImageURL} className="h-12 w-12" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">@{user.username}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-stone-600">{user.bio}</p>
                    <p className="mt-1 text-xs text-stone-500">{user.followerCount} followers</p>
                  </div>
                </Link>

                {currentUser && currentUser.id !== user.id ? (
                  <Button
                    type="button"
                    variant={followMap[user.id] ? "outline" : "primary"}
                    className="shrink-0 px-3 py-2 text-xs"
                    disabled={loadingUserId === user.id}
                    onClick={() => void handleToggleFollow(user)}
                  >
                    {loadingUserId === user.id ? "..." : followMap[user.id] ? "Following" : "Follow"}
                  </Button>
                ) : currentUser?.id === user.id ? (
                  <Link href="/profile">
                    <Button type="button" variant="outline" className="shrink-0 px-3 py-2 text-xs">
                      View profile
                    </Button>
                  </Link>
                ) : (
                  <Link href="/login">
                    <Button type="button" variant="outline" className="shrink-0 px-3 py-2 text-xs">
                      Log in to follow
                    </Button>
                  </Link>
                )}
              </article>
            ))}
          </section>
        ) : (
          <FeedList posts={postResults} isLoading={false} />
        )}
      </div>
    </AppShell>
  );
}
