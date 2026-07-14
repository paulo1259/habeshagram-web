"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PostCard } from "@/components/posts/post-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ShareActions } from "@/components/ui/share-actions";
import { getPostById } from "@/services/post-service";
import { Post } from "@/types";

export function PostDetailPage({ postId }: { postId: string }) {
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");
        const nextPost = await getPostById(postId);
        if (isMounted) {
          setPost(nextPost);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : "Unable to load this post.");
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
  }, [postId]);

  if (!isLoading && !post) {
    return (
      <AppShell>
        <EmptyState
          title="This post could not be found"
          description={errorMessage || "The post may have been deleted or is no longer available."}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <section className="overflow-hidden border-b border-brand-100/80 bg-card/96 sm:rounded-[32px] sm:border sm:shadow-soft">
          <div className="bg-gradient-to-br from-red-600 via-orange-500 to-brand-500 px-4 py-5 text-white sm:px-6 sm:py-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/95 transition hover:bg-white/18"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to feed
                </Link>
                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-white/75">Shared post</p>
                <h1 className="mt-2 text-[1.9rem] font-black tracking-tight sm:text-[2.4rem]">
                  Join the conversation
                </h1>
              </div>
              <ShareActions
                path={`/posts/${postId}`}
                title={post ? `@${post.username} on HabeshaGram` : "HabeshaGram post"}
                text={post?.text}
                className="rounded-[24px] bg-white/12 p-3 backdrop-blur"
              />
            </div>
          </div>
        </section>

        {post ? <PostCard post={post} /> : null}
      </div>
    </AppShell>
  );
}
