"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, Bookmark, Flag, Heart, MessageCircle, Radio, Trash2 } from "lucide-react";
import { useAppData } from "@/hooks/use-app-data";
import { formatDate, parseHashtags } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CommentSection } from "@/components/posts/comment-section";
import { getTeamSlug } from "@/services/football-hub-data";
import { reportPost } from "@/services/report-service";
import { Post, PostReportReason } from "@/types";

const teamChipStyles = {
  "Manchester United": "bg-red-50 text-red-700 hover:bg-red-100",
  Arsenal: "bg-rose-50 text-rose-700 hover:bg-rose-100",
  Chelsea: "bg-blue-50 text-blue-700 hover:bg-blue-100",
  "Manchester City": "bg-sky-50 text-sky-700 hover:bg-sky-100"
} as const;

export function PostCard({ post }: { post: Post }) {
  const { currentUser, likePost, addPostComment, deleteOwnPost, savedPostIds, toggleSaved } = useAppData();
  const [showComments, setShowComments] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState<PostReportReason>("spam");
  const [reportDetails, setReportDetails] = useState("");
  const [isReporting, setIsReporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reportSuccess, setReportSuccess] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const isLiked = currentUser ? post.likedBy.includes(currentUser.id) : false;
  const isSaved = currentUser ? savedPostIds.includes(post.id) : false;
  const hashtags = post.hashtags?.length ? post.hashtags : parseHashtags(post.text);
  const reportReasons: { value: PostReportReason; label: string }[] = [
    { value: "spam", label: "Spam" },
    { value: "harassment", label: "Harassment" },
    { value: "hate", label: "Hate speech" },
    { value: "other", label: "Other" }
  ];

  return (
    <article
      id={`post-${post.id}`}
      className="group border-b border-brand-100/80 bg-white/98 px-3 py-4 transition duration-200 hover:bg-brand-50/10 sm:rounded-[28px] sm:border sm:border-brand-100/80 sm:px-5 sm:py-5 sm:shadow-soft sm:hover:-translate-y-0.5 sm:hover:border-brand-200/90 sm:hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        {post.isSystem ? (
          <div className="shrink-0">
            <Avatar
              username={post.username}
              imageURL={post.userProfileImageURL}
              className="h-10 w-10 ring-2 ring-brand-50 transition duration-200 group-hover:ring-brand-100"
            />
          </div>
        ) : (
          <Link href={`/profile/${post.userId}`} className="shrink-0">
            <Avatar
              username={post.username}
              imageURL={post.userProfileImageURL}
              className="h-10 w-10 ring-2 ring-brand-50 transition duration-200 group-hover:ring-brand-100"
            />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {post.isSystem ? (
              <p className="truncate font-semibold text-ink">@{post.username}</p>
            ) : (
              <Link
                href={`/profile/${post.userId}`}
                className="truncate font-semibold text-ink transition hover:text-brand-800"
              >
                @{post.username}
              </Link>
            )}
            {post.teamTag ? (
              <>
                <span className="text-xs text-stone-300">&bull;</span>
                <Link
                  href={`/football/${getTeamSlug(post.teamTag)}`}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] shadow-sm transition ${teamChipStyles[post.teamTag]}`}
                >
                  {post.teamTag}
                </Link>
              </>
            ) : null}
            <span className="text-xs text-stone-400">&bull;</span>
            <p className="shrink-0 text-xs font-medium text-stone-500">{formatDate(post.createdAt)}</p>
          </div>

          {post.isSystem ? (
            <div className="mt-3 rounded-[22px] border border-brand-100 bg-gradient-to-r from-brand-50/70 via-white to-orange-50/55 px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white">
                  <Radio className="h-3.5 w-3.5" />
                  Breaking
                </span>
                {post.sourceLabel ? (
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-800 shadow-sm">
                    {post.sourceLabel}
                  </span>
                ) : null}
                {post.sourceUrl ? (
                  <Link
                    href={post.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-brand-800 transition hover:text-brand-900"
                  >
                    Source
                  </Link>
                ) : null}
              </div>
              {post.summary ? (
                <p className="mt-2 text-sm leading-6 text-stone-600">{post.summary}</p>
              ) : null}
            </div>
          ) : null}

          <p className="mt-2.5 whitespace-pre-wrap text-[15px] leading-7 text-stone-800 sm:text-[15.5px]">
            {post.text}
          </p>

          {hashtags.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {hashtags.map((tag) => (
                <Link
                  key={tag}
                  href={`/topic/${tag}`}
                  className="rounded-full border border-brand-100 bg-brand-50/90 px-3 py-1.5 text-xs font-semibold text-brand-800 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-100 hover:text-brand-900"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          ) : null}

          {post.imageURL ? (
            <div className="mt-3.5 overflow-hidden rounded-[24px] border border-brand-100 bg-brand-50/30 shadow-sm transition duration-200 group-hover:shadow-md">
              <img
                src={post.imageURL}
                alt="Post"
                className="h-auto max-h-[28rem] w-full object-cover"
              />
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-1.5 text-stone-500">
            <Button
              variant="ghost"
              className="min-h-10 gap-2 rounded-full px-3.5 py-2 text-xs text-stone-500 transition hover:bg-red-50 hover:text-red-500 active:scale-[0.98]"
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
              className="min-h-10 gap-2 rounded-full px-3.5 py-2 text-xs text-stone-500 transition hover:bg-brand-50 hover:text-brand-700 active:scale-[0.98]"
              onClick={() => setShowComments((value) => !value)}
            >
              <MessageCircle className="h-[18px] w-[18px]" />
              <span className="min-w-4 text-left">{post.commentCount}</span>
            </Button>
            <Button
              variant="ghost"
              className="min-h-10 gap-2 rounded-full px-3.5 py-2 text-xs text-stone-500 transition hover:bg-brand-50 hover:text-brand-700 active:scale-[0.98]"
              onClick={async () => {
                try {
                  setErrorMessage("");
                  await toggleSaved(post.id);
                } catch (error) {
                  setErrorMessage(error instanceof Error ? error.message : "Unable to save post.");
                }
              }}
            >
              <Bookmark
                className={`h-[18px] w-[18px] ${isSaved ? "fill-brand-700 text-brand-700" : ""}`}
              />
              <span>{isSaved ? "Saved" : "Save"}</span>
            </Button>
            {post.userId === currentUser?.id ? (
              <Button
                variant="ghost"
                className={`min-h-10 gap-2 rounded-full px-3.5 py-2 text-xs transition active:scale-[0.98] ${
                  showDeleteConfirm
                    ? "bg-red-50 text-red-700 hover:bg-red-100"
                    : "text-stone-500 hover:bg-red-50 hover:text-red-700"
                }`}
                disabled={isDeleting}
                onClick={() => {
                  setErrorMessage("");
                  setReportSuccess("");
                  setShowDeleteConfirm((value) => !value);
                }}
              >
                <Trash2 className="h-[18px] w-[18px]" />
                <span>{isDeleting ? "Deleting..." : showDeleteConfirm ? "Confirm delete" : "Delete"}</span>
              </Button>
            ) : null}
            {post.userId !== currentUser?.id ? (
              <Button
                variant="ghost"
                className="min-h-10 gap-2 rounded-full px-3.5 py-2 text-xs text-stone-500 transition hover:bg-orange-50 hover:text-orange-700 active:scale-[0.98]"
                onClick={() => {
                  setReportSuccess("");
                  setErrorMessage("");
                  setShowReportForm((value) => !value);
                }}
              >
                <Flag className="h-[18px] w-[18px]" />
                <span>Report</span>
              </Button>
            ) : null}
          </div>

          {showDeleteConfirm ? (
            <div className="mt-3 rounded-[22px] border border-red-100 bg-red-50/80 px-4 py-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-red-600 shadow-sm">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-red-900">
                      Are you sure you want to delete this post?
                    </p>
                    <p className="mt-1 text-sm leading-6 text-red-800/80">
                      This will remove the post from the timeline and clean up its comments.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="min-h-10 rounded-full px-4 text-sm text-red-700 hover:bg-white/90"
                    disabled={isDeleting}
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="min-h-10 rounded-full bg-red-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
                    disabled={isDeleting}
                    onClick={async () => {
                      try {
                        setIsDeleting(true);
                        setErrorMessage("");
                        await deleteOwnPost(post.id);
                      } catch (error) {
                        setErrorMessage(
                          error instanceof Error ? error.message : "Unable to delete your post."
                        );
                        setShowDeleteConfirm(true);
                      } finally {
                        setIsDeleting(false);
                      }
                    }}
                  >
                    {isDeleting ? "Deleting..." : "Delete post"}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {errorMessage ? (
            <p className="mt-3 rounded-[18px] border border-red-100 bg-red-50/80 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </p>
          ) : null}
          {reportSuccess ? (
            <p className="mt-3 rounded-[18px] border border-emerald-100 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-700">
              {reportSuccess}
            </p>
          ) : null}

          {showReportForm ? (
            <div className="mt-3 rounded-[24px] border border-brand-100 bg-brand-50/55 p-4">
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
                    Report post
                  </p>
                  <p className="mt-1 text-sm leading-6 text-stone-600">
                    Thanks for helping keep HabeshaGram safe. Pick the closest reason and we will store it for review.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {reportReasons.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setReportReason(item.value)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        reportReason === item.value
                          ? "border-brand-500 bg-brand-500 text-white"
                          : "border-brand-100 bg-white text-stone-600 hover:border-brand-200 hover:bg-brand-50"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={2}
                  value={reportDetails}
                  onChange={(event) => setReportDetails(event.target.value)}
                  placeholder="Optional details"
                  className="w-full rounded-2xl border border-brand-100 bg-white px-4 py-3 text-sm outline-none ring-brand-300 focus:ring-2"
                />

                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setShowReportForm(false);
                      setReportDetails("");
                      setErrorMessage("");
                    }}
                    disabled={isReporting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    disabled={isReporting}
                    onClick={async () => {
                      try {
                        if (!currentUser) {
                          throw new Error("Please log in before reporting posts.");
                        }

                        setIsReporting(true);
                        setErrorMessage("");
                        setReportSuccess("");
                        await reportPost({
                          post,
                          actor: currentUser,
                          reason: reportReason,
                          details: reportDetails
                        });
                        setShowReportForm(false);
                        setReportDetails("");
                        setReportSuccess("Report sent. Thanks for looking out for the community.");
                      } catch (error) {
                        setErrorMessage(
                          error instanceof Error ? error.message : "Unable to send your report."
                        );
                      } finally {
                        setIsReporting(false);
                      }
                    }}
                  >
                    {isReporting ? "Sending..." : "Submit report"}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

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
