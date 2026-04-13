"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Flame, Hash, Radio, Trophy } from "lucide-react";
import { useAppData } from "@/hooks/use-app-data";
import { getTeamSlug } from "@/services/football-hub-data";
import { calculateHotPosts, calculateTrendingHashtags, calculateTrendingTeams, findMostActiveMatch } from "@/services/trending-service";
import { LiveMatch } from "@/types";

export function TrendingTopics({
  liveMatches,
  compact = false
}: {
  liveMatches?: LiveMatch[];
  compact?: boolean;
}) {
  const { posts } = useAppData();

  const trendingHashtags = useMemo(() => calculateTrendingHashtags(posts), [posts]);
  const trendingTeams = useMemo(() => calculateTrendingTeams(posts), [posts]);
  const hotPosts = useMemo(() => calculateHotPosts(posts), [posts]);
  const hottestMatch = useMemo(
    () => findMostActiveMatch(posts, liveMatches),
    [liveMatches, posts]
  );

  const containerClassName = compact
    ? "glass-card rounded-[26px] border border-brand-100/80 p-4 shadow-soft"
    : "glass-card rounded-[28px] border border-brand-100/80 p-5 shadow-soft";

  return (
    <section className={containerClassName}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">
        Hot Now
      </p>
      <h3 className="mt-1 text-lg font-black tracking-tight text-ink">What is moving the timeline</h3>

      <div className={`mt-4 ${compact ? "space-y-3" : "space-y-4"}`}>
        {hottestMatch ? (
          <Link
            href="/match/live"
            className={`block rounded-[22px] border border-orange-100 bg-gradient-to-r from-orange-50 via-white to-brand-50 transition hover:-translate-y-0.5 hover:shadow-sm ${
              compact ? "px-4 py-3.5" : "px-4 py-4"
            }`}
          >
            <div className="flex items-center gap-2 text-orange-700">
              <Radio className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-[0.14em]">Most active live match</p>
            </div>
            <p className="mt-2 text-sm font-semibold text-ink">
              {hottestMatch.match.homeTeam} vs {hottestMatch.match.awayTeam}
            </p>
            <p className="mt-1 text-xs text-stone-500">
              {hottestMatch.reactionCount} live reactions in the current post stream
            </p>
          </Link>
        ) : null}

        <div>
          <div className="flex items-center gap-2 text-brand-800">
            <Hash className="h-4 w-4" />
            <p className="text-xs font-semibold uppercase tracking-[0.14em]">Trending hashtags</p>
          </div>
          <div className={`mt-3 flex flex-wrap gap-2 ${compact ? "max-h-28 overflow-hidden" : ""}`}>
            {trendingHashtags.length ? (
              trendingHashtags.slice(0, compact ? 4 : 6).map((item) => (
                <Link
                  key={item.tag}
                  href={`/topic/${item.tag}`}
                  className="rounded-full border border-brand-100 bg-brand-50/80 px-3 py-2 text-xs font-semibold text-brand-800 transition hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-100"
                >
                  #{item.tag}
                  <span className="ml-2 text-stone-500">{item.postCount}</span>
                </Link>
              ))
            ) : (
              <p className="text-sm text-stone-500">Hashtags will heat up as more posts land.</p>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 text-brand-800">
            <Flame className="h-4 w-4" />
            <p className="text-xs font-semibold uppercase tracking-[0.14em]">Trending teams</p>
          </div>
          <div className="mt-3 space-y-2">
            {trendingTeams.length ? (
              trendingTeams.slice(0, compact ? 3 : 4).map((item, index) => (
                <Link
                  key={item.team}
                  href={`/football/${getTeamSlug(item.team)}`}
                  className="flex items-center justify-between gap-3 rounded-[20px] bg-brand-50/55 px-4 py-3 transition hover:bg-brand-100/70"
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                      Team heat {index + 1}
                    </p>
                    <p className="mt-1 font-semibold text-ink">{item.team}</p>
                  </div>
                  <p className="text-xs font-semibold text-brand-800">{item.postCount} posts</p>
                </Link>
              ))
            ) : (
              <p className="text-sm text-stone-500">Team chatter will show up here once fans start tagging posts.</p>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 text-brand-800">
            <Trophy className="h-4 w-4" />
            <p className="text-xs font-semibold uppercase tracking-[0.14em]">Hot posts</p>
          </div>
          <div className="mt-3 space-y-2">
            {hotPosts.slice(0, compact ? 2 : 3).map(({ post, score }) => (
              <Link
                key={post.id}
                href={post.teamTag ? `/football/${getTeamSlug(post.teamTag)}` : "/"}
                className="block rounded-[20px] border border-brand-100/80 bg-white/92 px-4 py-3 transition hover:-translate-y-0.5 hover:shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-ink">@{post.username}</p>
                  <p className="text-xs font-semibold text-brand-700">{Math.round(score)} pts</p>
                </div>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-600">{post.text}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
