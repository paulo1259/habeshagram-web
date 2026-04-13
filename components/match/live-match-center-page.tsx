"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Radio, Send, TimerReset, Zap } from "lucide-react";
import { MatchdayCenter } from "@/components/discovery/matchday-center";
import { AppShell } from "@/components/layout/app-shell";
import { TrendingTopics } from "@/components/discovery/trending-topics";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { useAppData } from "@/hooks/use-app-data";
import { getTeamSlug } from "@/services/football-hub-data";
import { fetchLiveMatches, getInitialLiveMatches } from "@/services/live-match-service";
import { formatDate } from "@/lib/utils";
import { FootballTeam, LiveMatch, Post } from "@/types";

const teamAccent: Record<FootballTeam, string> = {
  "Manchester United": "text-red-700 bg-red-50 border-red-100",
  Arsenal: "text-rose-700 bg-rose-50 border-rose-100",
  Chelsea: "text-blue-700 bg-blue-50 border-blue-100",
  "Manchester City": "text-sky-700 bg-sky-50 border-sky-100"
};

const timelineAccent = {
  goal: "bg-emerald-50 text-emerald-700 border-emerald-100",
  yellow: "bg-amber-50 text-amber-700 border-amber-100",
  red: "bg-red-50 text-red-700 border-red-100"
} as const;

const statusAccent = {
  LIVE: "bg-red-500 text-white",
  HT: "bg-orange-500 text-white",
  FT: "bg-stone-900 text-white",
  UPCOMING: "bg-brand-500 text-white"
} as const;

export function LiveMatchCenterPage() {
  const { posts, isLoading, currentUser, createNewPost } = useAppData();
  const [matches, setMatches] = useState<LiveMatch[]>(() => getInitialLiveMatches());
  const [isMatchLoading, setIsMatchLoading] = useState(true);
  const [matchMessage, setMatchMessage] = useState("");
  const [activeMatchId, setActiveMatchId] = useState(getInitialLiveMatches()[0]?.id ?? "");
  const [reactionText, setReactionText] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<FootballTeam | "">("");
  const [isSubmittingReaction, setIsSubmittingReaction] = useState(false);
  const [reactionError, setReactionError] = useState("");
  const [freshReactionIds, setFreshReactionIds] = useState<string[]>([]);
  const previousReactionIds = useRef<string[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadMatches = async () => {
      try {
        if (isMounted) {
          setIsMatchLoading(true);
        }

        const payload = await fetchLiveMatches();
        if (!isMounted) {
          return;
        }

        setMatches(payload.matches);
        setMatchMessage(payload.message ?? "");
        setActiveMatchId((current) =>
          payload.matches.some((match) => match.id === current)
            ? current
            : (payload.matches[0]?.id ?? "")
        );
      } finally {
        if (isMounted) {
          setIsMatchLoading(false);
        }
      }
    };

    void loadMatches();

    const interval = window.setInterval(() => {
      void loadMatches();
    }, 45000);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const activeMatch = useMemo(
    () => matches.find((match) => match.id === activeMatchId) ?? matches[0] ?? null,
    [activeMatchId, matches]
  );

  useEffect(() => {
    if (activeMatch && !selectedTeam) {
      setSelectedTeam(activeMatch.homeTeam);
    }
  }, [activeMatch, selectedTeam]);

  const liveReactions = useMemo(() => {
    if (!activeMatch) {
      return [];
    }

    const teams = [activeMatch.homeTeam, activeMatch.awayTeam];

    return posts
      .filter((post) => post.teamTag && teams.includes(post.teamTag))
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 40);
  }, [activeMatch, posts]);

  useEffect(() => {
    const nextIds = liveReactions.map((post) => post.id);
    const previousIds = previousReactionIds.current;
    const freshIds = nextIds.filter((id) => !previousIds.includes(id)).slice(0, 6);

    if (previousIds.length) {
      setFreshReactionIds(freshIds);
      if (freshIds.length) {
        const timer = window.setTimeout(() => setFreshReactionIds([]), 2500);
        previousReactionIds.current = nextIds;
        return () => window.clearTimeout(timer);
      }
    }

    previousReactionIds.current = nextIds;
  }, [liveReactions]);

  async function handleSubmitReaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentUser) {
      setReactionError("Log in to join the live reactions.");
      return;
    }

    if (!reactionText.trim()) {
      setReactionError("Write a quick reaction before posting.");
      return;
    }

    try {
      setIsSubmittingReaction(true);
      setReactionError("");
      await createNewPost({
        text: reactionText,
        teamTag: selectedTeam || activeMatch?.homeTeam
      });
      setReactionText("");
    } catch (error) {
      setReactionError(error instanceof Error ? error.message : "Unable to post your reaction.");
    } finally {
      setIsSubmittingReaction(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <section className="overflow-hidden border-b border-brand-100/80 bg-white/96 sm:rounded-[32px] sm:border sm:shadow-soft">
          <div className="bg-gradient-to-br from-brand-600 via-orange-400 to-rose-400 px-4 py-5 text-white sm:px-6 sm:py-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/95 transition hover:bg-white/18"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to feed
            </Link>

            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
                  Match Center
                </p>
                <h1 className="mt-1 text-[2rem] font-black tracking-tight sm:text-[2.6rem]">
                  Live Matchday Pulse
                </h1>
                <p className="mt-3 text-sm leading-6 text-white/90 sm:text-[15px]">
                  Real football-data.org match coverage for Premier League club nights, plus HabeshaGram fan reactions on top.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:min-w-[17rem]">
                <div className="rounded-[24px] bg-white/12 px-4 py-3 backdrop-blur">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
                    Live matches
                  </p>
                  <p className="mt-2 text-xl font-black">{matches.length}</p>
                </div>
                <div className="rounded-[24px] bg-white/12 px-4 py-3 backdrop-blur">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
                    Reactions
                  </p>
                  <p className="mt-2 text-xl font-black">{liveReactions.length}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <SectionHeader
            eyebrow="Now Live"
            title="Matches lighting up the timeline"
            description="Live and nearby Premier League club fixtures poll on a lightweight interval, while fan reactions keep flowing through the existing real-time post system."
          />

          {matchMessage ? (
            <div className="rounded-[24px] border border-brand-100 bg-brand-50/60 px-4 py-3 text-sm text-brand-900">
              {matchMessage}
            </div>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="space-y-4">
              {isMatchLoading ? (
                [1, 2].map((item) => (
                  <article
                    key={item}
                    className="glass-card overflow-hidden rounded-[30px] border border-brand-100/80 shadow-soft"
                  >
                    <div className="h-16 animate-pulse bg-brand-100/60" />
                    <div className="space-y-4 px-4 py-5 sm:px-5">
                      <div className="h-16 animate-pulse rounded-[24px] bg-brand-100/60" />
                      <div className="h-24 animate-pulse rounded-[24px] bg-brand-100/60" />
                    </div>
                  </article>
                ))
              ) : matches.length ? (
                matches.map((match) => (
                <article
                  key={match.id}
                  className={`glass-card overflow-hidden rounded-[30px] border shadow-soft transition ${
                    activeMatch?.id === match.id
                      ? "border-brand-300 ring-2 ring-brand-200/80"
                      : "border-brand-100/80"
                  }`}
                >
                  <div className="border-b border-brand-100/80 bg-gradient-to-r from-brand-50 via-white to-orange-50 px-4 py-3 sm:px-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 ${statusAccent[match.status]}`}>
                          <Radio className="h-3.5 w-3.5" />
                          {match.status}
                        </span>
                        <span>{match.matchClock}</span>
                      </div>
                      <p className="text-xs font-medium text-stone-500">{match.venue}</p>
                    </div>
                  </div>

                  <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMatchId(match.id);
                          setSelectedTeam(match.homeTeam);
                        }}
                        className={`rounded-[24px] border px-4 py-4 text-center transition hover:-translate-y-0.5 ${teamAccent[match.homeTeam]}`}
                      >
                        <p className="text-sm font-semibold uppercase tracking-[0.12em]">{match.homeTeam}</p>
                      </button>
                      <div className="rounded-[24px] bg-stone-950 px-4 py-3 text-center text-white shadow-lg">
                        <p className="text-2xl font-black tracking-tight">
                          {match.homeScore} - {match.awayScore}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveMatchId(match.id);
                          setSelectedTeam(match.awayTeam);
                        }}
                        className={`rounded-[24px] border px-4 py-4 text-center transition hover:-translate-y-0.5 ${teamAccent[match.awayTeam]}`}
                      >
                        <p className="text-sm font-semibold uppercase tracking-[0.12em]">{match.awayTeam}</p>
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                        Fan hubs
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/football/${getTeamSlug(match.homeTeam)}`}
                          className="text-xs font-semibold text-brand-800 hover:text-brand-900"
                        >
                          {match.homeTeam} hub
                        </Link>
                        <Link
                          href={`/football/${getTeamSlug(match.awayTeam)}`}
                          className="text-xs font-semibold text-brand-800 hover:text-brand-900"
                        >
                          {match.awayTeam} hub
                        </Link>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                        Timeline
                      </p>
                      <div className="space-y-2">
                        {match.timeline.map((event) => (
                          <div
                            key={event.id}
                            className={`flex items-start gap-3 rounded-[20px] border px-3 py-3 ${timelineAccent[event.type]}`}
                          >
                            <div className="rounded-full bg-white px-2.5 py-1 text-xs font-black shadow-sm">
                              {event.minute}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold">{event.player}</p>
                              <p className="mt-1 text-sm leading-6">{event.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>
              ))
              ) : (
                <EmptyState
                  title="No relevant live club matches right now"
                  description="The live page is ready, but football-data.org did not return any matching Premier League fixtures for the tracked clubs at the moment."
                />
              )}
            </div>

            <div className="space-y-4">
              <section className="glass-card rounded-[30px] border border-brand-100/80 p-4 shadow-soft sm:p-5">
                <SectionHeader
                  eyebrow="Live Notes"
                  title="What makes this feel alive"
                  description="A tiny mock interval is enough to make the match center feel active for now."
                />
                <div className="mt-4 space-y-3">
                  <div className="rounded-[24px] bg-brand-50/70 px-4 py-3">
                    <div className="flex items-center gap-2 text-brand-800">
                      <Zap className="h-4 w-4" />
                      <p className="text-xs font-semibold uppercase tracking-[0.14em]">Simulated pulse</p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-stone-700">
                      Match cards refresh from football-data.org on a lightweight polling interval, with safe fallback if the provider slows down.
                    </p>
                  </div>
                  <div className="rounded-[24px] bg-orange-50/80 px-4 py-3">
                    <div className="flex items-center gap-2 text-orange-700">
                      <TimerReset className="h-4 w-4" />
                      <p className="text-xs font-semibold uppercase tracking-[0.14em]">API-ready</p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-stone-700">
                      The API key stays server-side through a Next route, so the page can stay Vercel-ready without exposing secrets in the browser.
                    </p>
                  </div>
                </div>
              </section>

              <TrendingTopics liveMatches={matches} compact />
              <MatchdayCenter compact liveMatches={matches} />

              <section className="space-y-3">
                <SectionHeader
                  eyebrow="Fan Reactions"
                  title={activeMatch ? `${activeMatch.homeTeam} vs ${activeMatch.awayTeam} live chat` : "Live discussion from team-tagged posts"}
                  description="Fast reactions use the existing posting system and show up here instantly through the live post subscription."
                />
                <section className="glass-card rounded-[30px] border border-brand-100/80 p-4 shadow-soft sm:p-5">
                  <form onSubmit={handleSubmitReaction} className="space-y-3">
                    <textarea
                      rows={3}
                      value={reactionText}
                      onChange={(event) => setReactionText(event.target.value)}
                      placeholder="Drop a quick live reaction..."
                      className="w-full rounded-[24px] border border-brand-100 bg-brand-50/40 px-4 py-3 text-sm leading-6 outline-none ring-brand-300 transition focus:ring-2"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-2">
                        {activeMatch ? [activeMatch.homeTeam, activeMatch.awayTeam].map((team) => (
                          <button
                            key={team}
                            type="button"
                            onClick={() => setSelectedTeam(team)}
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                              selectedTeam === team
                                ? `${teamAccent[team]} shadow-sm`
                                : "border-brand-100 bg-white text-stone-600 hover:border-brand-200 hover:bg-brand-50"
                            }`}
                          >
                            {team}
                          </button>
                        )) : null}
                      </div>
                      <Button type="submit" disabled={isSubmittingReaction}>
                        <Send className="mr-2 h-4 w-4" />
                        {isSubmittingReaction ? "Sending..." : "React live"}
                      </Button>
                    </div>
                    {reactionError ? <p className="text-sm text-red-600">{reactionError}</p> : null}
                  </form>
                </section>

                <section className="glass-card overflow-hidden rounded-[30px] border border-brand-100/80 shadow-soft">
                  {isLoading ? (
                    <div className="space-y-3 px-4 py-4 sm:px-5">
                      {[1, 2, 3].map((item) => (
                        <div key={item} className="rounded-[22px] bg-brand-50/45 px-4 py-4">
                          <div className="h-4 w-1/3 animate-pulse rounded-full bg-brand-100" />
                          <div className="mt-3 h-3.5 w-full animate-pulse rounded-full bg-brand-100" />
                        </div>
                      ))}
                    </div>
                  ) : liveReactions.length ? (
                    <div className="max-h-[42rem] overflow-y-auto px-3 py-3 sm:px-4">
                      <div className="space-y-2">
                        {liveReactions.map((post) => (
                          <LiveReactionCard
                            key={post.id}
                            post={post}
                            isFresh={freshReactionIds.includes(post.id)}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 sm:p-5">
                      <EmptyState
                        title="No live reactions yet"
                        description="Create a team-tagged post during the match and it will show up here with the rest of the fan noise."
                      />
                    </div>
                  )}
                </section>
              </section>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function LiveReactionCard({ post, isFresh }: { post: Post; isFresh: boolean }) {
  return (
    <article
      className={`rounded-[24px] border px-4 py-3 transition ${
        isFresh
          ? "border-brand-200 bg-brand-50/70 shadow-sm"
          : "border-brand-100/80 bg-white/92"
      }`}
    >
      <div className="flex items-start gap-3">
        <Avatar username={post.username} imageURL={post.userProfileImageURL} className="h-10 w-10" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-ink">@{post.username}</p>
            {post.teamTag ? (
              <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${teamAccent[post.teamTag]}`}>
                {post.teamTag}
              </span>
            ) : null}
            <span className="text-xs text-stone-400">&bull;</span>
            <p className="text-xs font-medium text-stone-500">{formatDate(post.createdAt)}</p>
          </div>
          <p className="mt-2 text-sm leading-6 text-stone-700">{post.text}</p>
        </div>
      </div>
    </article>
  );
}
