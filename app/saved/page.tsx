"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AppShell } from "@/components/layout/app-shell";
import { FeedList } from "@/components/posts/feed-list";
import { EmptyState } from "@/components/ui/empty-state";
import { useAppData } from "@/hooks/use-app-data";
import { Post } from "@/types";

export default function SavedPage() {
  const { currentUser, deletedPostIds, isReady, getSavedFeed, savedPostIds } = useAppData();
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!currentUser) {
      setSavedPosts([]);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    void (async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");
        const posts = await getSavedFeed();
        if (isMounted) {
          setSavedPosts(posts);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : "Unable to load saved posts.");
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
  }, [currentUser, getSavedFeed, savedPostIds]);

  const visibleSavedPosts = savedPosts.filter((post) => !deletedPostIds.includes(post.id));

  return (
    <AppShell>
      <AuthGuard>
        <div className="space-y-4">
          <section className="glass-card rounded-[30px] border border-brand-100/80 p-4 shadow-soft sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">
              Saved
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-ink">Posts you want to revisit</h1>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Keep your favorite conversations, images, and fight-night takes in one easy place.
            </p>
          </section>

          {errorMessage ? (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>
          ) : null}

          {!isLoading && !visibleSavedPosts.length ? (
            <EmptyState
              title="Nothing saved yet"
              description="Tap the save icon on any post to build your own collection of posts to revisit later."
            />
          ) : (
            <FeedList posts={visibleSavedPosts} isLoading={isLoading} />
          )}
        </div>
      </AuthGuard>
    </AppShell>
  );
}
