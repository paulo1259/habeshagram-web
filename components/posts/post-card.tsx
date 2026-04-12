"use client";

import { useState } from "react";
import { Heart, MessageCircle } from "lucide-react";
import { useAppData } from "@/hooks/use-app-data";
import { formatDate } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CommentSection } from "@/components/posts/comment-section";
import { Post } from "@/types";

export function PostCard({ post }: { post: Post }) {
  const { currentUser, likePost, addPostComment } = useAppData();
  const [showComments, setShowComments] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isLiked = currentUser ? post.likedBy.includes(currentUser.id) : false;

  return (
    <article className="border-b border-brand-100 bg-white/98 px-3 py-4 transition hover:bg-brand-50/20 sm:rounded-[24px] sm:border sm:border-brand-100 sm:px-5 sm:py-4 sm:shadow-soft">
      <div className="flex items-start gap-3">
        <Avatar
          username={post.username}
          imageURL={post.userProfileImageURL}
          className="h-10 w-10"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm">
            <p className="truncate font-semibold text-ink">@{post.username}</p>
            <span className="text-xs text-stone-400">&bull;</span>
            <p className="shrink-0 text-xs text-stone-500">{formatDate(post.createdAt)}</p>
          </div>

          <p className="mt-2.5 whitespace-pre-wrap text-[15px] leading-7 text-stone-800">
            {post.text}
          </p>

          {post.imageURL ? (
            <div className="mt-3.5 overflow-hidden rounded-[20px] border border-brand-100 bg-brand-50/30">
              <img
                src={post.imageURL}
                alt="Post"
                className="h-auto max-h-[26rem] w-full object-cover"
              />
            </div>
          ) : null}

          <div className="mt-4 flex items-center gap-1 text-stone-500">
            <Button
              variant="ghost"
              className="gap-2 rounded-full px-2.5 py-2 text-xs text-stone-500 hover:bg-red-50 hover:text-red-500 active:scale-[0.98]"
              onClick={async () => {
                try {
                  setErrorMessage("");
                  await likePost(post.id);
                } catch (error) {
                  setErrorMessage(error instanceof Error ? error.message : "Unable to like post.");
                }
              }}
            >
              <Heart
                className={`h-[18px] w-[18px] ${isLiked ? "fill-red-500 text-red-500" : ""}`}
              />
              <span className="min-w-4 text-left">{post.likeCount}</span>
            </Button>
            <Button
              variant="ghost"
              className="gap-2 rounded-full px-2.5 py-2 text-xs text-stone-500 hover:bg-brand-50 hover:text-brand-700 active:scale-[0.98]"
              onClick={() => setShowComments((value) => !value)}
            >
              <MessageCircle className="h-[18px] w-[18px]" />
              <span className="min-w-4 text-left">{post.commentCount}</span>
            </Button>
          </div>

          {errorMessage ? <p className="mt-2 text-sm text-red-600">{errorMessage}</p> : null}

          {showComments ? (
            <CommentSection
              postId={post.id}
              commentCount={post.commentCount}
              canComment={Boolean(currentUser)}
              onSubmit={(text) => addPostComment(post.id, text)}
            />
          ) : null}
        </div>
      </div>
    </article>
  );
}
