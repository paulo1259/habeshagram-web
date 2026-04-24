"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Hash, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { FeedList } from "@/components/posts/feed-list";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { useAppData } from "@/hooks/use-app-data";
import { normalizeHashtag } from "@/lib/utils";
import { getPostsByHashtag } from "@/services/post-service";
import { Post } from "@/types";

export function TopicPageClient({ initialTag }: { initialTag: string }) {
  const normalizedTag = normalizeHashtag(initialTag);
  const { deletedPostIds } = useAppData();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");
        const next = await getPostsByHashtag(normalizedTag);
        if (isMounted) {
          setPosts(next);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : "Unable to load this topic.");
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
  }, [normalizedTag]);

  const visiblePosts = useMemo(
    () => posts.filter((post) => !deletedPostIds.includes(post.id)),
    [deletedPostIds, posts]
  );

  const relatedTags = useMemo(() => {
    const counts = new Map<string, number>();

    visiblePosts.forEach((post) => {
      (post.hashtags ?? []).forEach((tag) => {
        if (tag === normalizedTag) {
          return;
        }

        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      });
    });

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([tag]) => tag);
  }, [normalizedTag, visiblePosts]);

  return (
    <AppShell>
      <div className="space-y-5">
        <section className="overflow-hidden border-b border-brand-100/80 bg-white/96 sm:rounded-[32px] sm:border sm:shadow-soft">
          <div className="bg-gradient-to-br from-brand-600 via-orange-400 to-brand-300 px-4 py-5 text-white sm:px-6 sm:py-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/95 transition hover:bg-white/18"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to feed
            </Link>

            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
                  Topic Page
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-[22px] bg-white/14 backdrop-blur">
                    <Hash className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className="text-[1.9rem] font-black tracking-tight sm:text-[2.4rem]">
                      #{normalizedTag}
                    </h1>
                    <p className="mt-1 text-sm text-white/85">
                      {visiblePosts.length} {visiblePosts.length === 1 ? "post" : "posts"} in this conversation
                    </p>
                  </div>
                </div>
              </div>
              <div className="max-w-sm rounded-[24px] bg-white/12 px-4 py-3 text-sm leading-6 text-white/90 backdrop-blur">
                Hashtags help football talk, community updates, and city vibes stay discoverable in one clean social feed.
              </div>
            </div>
          </div>

          {relatedTags.length ? (
            <div className="px-4 py-4 sm:px-6">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                <Sparkles className="h-3.5 w-3.5 text-brand-700" />
                Related tags
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {relatedTags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/topic/${tag}`}
                    className="rounded-full bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-800 transition hover:bg-brand-100"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        {errorMessage ? (
          <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>
        ) : null}

        <section className="space-y-3">
          <SectionHeader
            eyebrow="Topic Feed"
            title={`Posts tagged #${normalizedTag}`}
            description="Same HabeshaGram feed style, filtered down to one shared conversation."
          />
          {!isLoading && !visiblePosts.length ? (
            <EmptyState
              title="No posts yet for this topic"
              description={`Try posting with #${normalizedTag} to start the conversation, or search for a nearby tag to find where the community is already talking.`}
            />
          ) : (
            <FeedList posts={visiblePosts} isLoading={isLoading} />
          )}
        </section>
      </div>
    </AppShell>
  );
}
