"use client";

import { FormEvent, useEffect, useState } from "react";
import { subscribeToCommentsByPost } from "@/services/comment-service";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Comment } from "@/types";

export function CommentSection({
  postId,
  commentCount,
  canComment,
  onSubmit
}: {
  postId: string;
  commentCount: number;
  canComment: boolean;
  onSubmit: (text: string) => Promise<Comment>;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setIsLoading(true);
    setErrorMessage("");

    const unsubscribe = subscribeToCommentsByPost(
      postId,
      (nextComments) => {
        setComments(nextComments);
        setIsLoading(false);
      },
      (message) => {
        setErrorMessage(message);
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, [postId, commentCount]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!text.trim()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");
      const nextComment = await onSubmit(text);
      setComments((currentComments) =>
        currentComments.some((comment) => comment.id === nextComment.id)
          ? currentComments
          : [...currentComments, nextComment]
      );
      setText("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to add comment.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mt-4 border-t border-brand-100 pt-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={canComment ? "Write a kind comment..." : "Log in to comment"}
          disabled={!canComment || isSubmitting}
          className="min-w-0 flex-1 rounded-full border border-brand-100 bg-card px-4 py-2 text-sm outline-none ring-brand-300 focus:ring-2"
        />
        <Button type="submit" disabled={!canComment || isSubmitting} className="px-4">
          {isSubmitting ? "Posting..." : "Post"}
        </Button>
      </form>
      {!canComment ? (
        <p className="mt-2 text-sm text-stone-500">Log in to join the conversation.</p>
      ) : null}
      {errorMessage ? <p className="mt-2 text-sm text-red-600">{errorMessage}</p> : null}
      <div className="mt-4 space-y-2">
        {isLoading ? (
          <p className="text-sm text-stone-500">Loading comments...</p>
        ) : comments.length ? (
          comments.map((comment) => (
            <div key={comment.id} className="rounded-2xl border border-brand-100 bg-brand-50/35 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-ink">@{comment.username}</p>
                <p className="text-xs text-stone-500">{formatDate(comment.createdAt)}</p>
              </div>
              <p className="mt-1 text-sm text-stone-700">{comment.text}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-stone-500">No comments yet. Start the conversation.</p>
        )}
      </div>
    </div>
  );
}
