"use client";

/**
 * components/mma/mma-prediction-poll-card.tsx
 *
 * MMA Prediction Poll card for the web (habeshagram.today).
 *
 * Behaviour
 * ─────────
 * • Loads current poll state (vote counts + user's existing vote) on mount.
 * • Signed-in users can vote once — locked after the first submission.
 * • Percentages and progress bars are always visible once loaded.
 * • Leading option gets a subtle highlight so it stands out.
 * • If the fight has a related live room, a "Join discussion" link appears at
 *   the bottom to bridge the poll into the audio experience.
 * • No gambling language — this is a community-prediction surface only.
 *
 * Auth
 * ────
 * Uses useAppData() → currentUser. The User type exposes `.id` (not .uid),
 * which is passed directly to the poll service as the userId.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Mic2 } from "lucide-react";
import { useAppData } from "@/hooks/use-app-data";
import { getMMAPollState, submitMMAPollVote, WebMMAPollState } from "@/services/mma-poll-service";
import { WebMMAPredictionPoll } from "@/services/mma-hub-data";

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  poll: WebMMAPredictionPoll;
};

// ── Component ─────────────────────────────────────────────────────────────────

export function MMAPredictionPollCard({ poll }: Props) {
  const { currentUser } = useAppData();

  const initialState: WebMMAPollState = {
    poll,
    optionCounts: poll.options.reduce<Record<string, number>>((acc, o) => {
      acc[o.id] = 0;
      return acc;
    }, {}),
    totalVotes: poll.totalVotes,
    hasVoted: false,
    isClosed: false,
  };

  const [state, setState] = useState<WebMMAPollState>(initialState);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | undefined>();

  // Load real vote counts (and user's existing vote if signed in) on mount.
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      const next = await getMMAPollState(poll, currentUser?.id ?? null);
      if (!cancelled) {
        setState(next);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [poll, currentUser?.id]);

  // The option with the most votes — highlighted after voting.
  const leadingOptionId = useMemo(() => {
    if (state.totalVotes === 0) return null;
    return Object.entries(state.optionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  }, [state.optionCounts, state.totalVotes]);

  const handleVote = async (optionId: string) => {
    if (!currentUser) {
      setWarning("Sign in to add your prediction before fight night.");
      return;
    }

    setSubmittingId(optionId);
    setWarning(undefined);

    try {
      const next = await submitMMAPollVote({ poll, userId: currentUser.id, optionId });
      setState(next);
    } catch (err) {
      setWarning(err instanceof Error ? err.message : "Prediction unavailable right now. Try again.");
    } finally {
      setSubmittingId(null);
    }
  };

  const isLocked = state.hasVoted || state.isClosed || Boolean(submittingId);

  return (
    <section className="overflow-hidden rounded-[26px] border border-brand-100/80 bg-gradient-to-br from-white via-white to-brand-50/35 p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full bg-brand-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-800">
          Prediction poll
        </span>
        <span className="text-xs font-semibold text-stone-500">
          {state.isClosed ? "Closed" : state.poll.closesLabel}
        </span>
      </div>

      {/* Fight title */}
      <p className="mt-3 text-xl font-black tracking-tight text-ink">{state.poll.fightTitle}</p>
      <p className="mt-1 text-xs leading-5 text-stone-500">
        Community picks only. One vote per member before the walkout.
      </p>

      {/* Matchup chips */}
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full bg-red-50 px-3 py-1.5 text-[11px] font-semibold text-red-700">
          {state.poll.fighterA}
        </span>
        <span className="rounded-full bg-stone-100 px-3 py-1.5 text-[11px] font-semibold text-stone-600">
          vs
        </span>
        <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-semibold text-blue-700">
          {state.poll.fighterB}
        </span>
      </div>

      {/* Options */}
      <div className="mt-4 space-y-2.5">
        {loading ? (
          Array.from({ length: poll.options.length }).map((_, i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-[18px] bg-brand-50"
            />
          ))
        ) : (
          state.poll.options.map((option) => {
            const count = state.optionCounts[option.id] ?? 0;
            const pct =
              state.totalVotes > 0
                ? Math.round((count / state.totalVotes) * 100)
                : 0;
            const isSelected = state.selectedOptionId === option.id;
            const isLeading = leadingOptionId === option.id && state.totalVotes > 0;
            const isSubmitting = submittingId === option.id;
            const showResults = state.hasVoted || state.isClosed;

            return (
              <button
                key={option.id}
                type="button"
                disabled={isLocked}
                onClick={() => void handleVote(option.id)}
                className={[
                  "relative w-full overflow-hidden rounded-[18px] border px-4 py-3 text-left transition",
                  isSelected
                    ? "border-brand-400 bg-brand-50 shadow-sm"
                    : isLeading && showResults
                      ? "border-brand-200 bg-white"
                      : "border-brand-100/80 bg-white",
                  !isLocked
                    ? "cursor-pointer hover:border-brand-300 hover:bg-brand-50/60 active:scale-[0.99]"
                    : "cursor-default",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {/* Animated progress fill — only revealed after voting */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 left-0 rounded-[18px] bg-brand-100/55 transition-all duration-500"
                  style={{ width: showResults ? `${pct}%` : "0%" }}
                />

                {/* Option label + percentage */}
                <div className="relative flex items-center justify-between gap-3">
                  <span
                    className={[
                      "text-sm font-semibold",
                      isSelected ? "text-brand-800" : "text-ink",
                    ].join(" ")}
                  >
                    {option.label}
                  </span>
                  <span className="flex shrink-0 items-center gap-2 text-xs text-stone-500">
                    {isSubmitting ? (
                      <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" />
                    ) : null}
                    {showResults ? (
                      <span className="font-bold">{pct}%</span>
                    ) : null}
                  </span>
                </div>

                {/* Count + leading/your-pick badges */}
                {showResults ? (
                  <div className="relative mt-1 flex items-center gap-1.5 text-[11px] text-stone-400">
                    <span>{count} vote{count !== 1 ? "s" : ""}</span>
                    {isLeading ? (
                      <span className="rounded-full bg-brand-100 px-1.5 py-0.5 font-semibold text-brand-800">
                        leading
                      </span>
                    ) : null}
                    {isSelected ? (
                      <span className="rounded-full bg-brand-500 px-1.5 py-0.5 font-semibold text-white">
                        your pick
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </button>
            );
          })
        )}
      </div>

      {/* Footer row */}
      <div className="mt-4 flex items-center justify-between gap-3 text-[11px] text-stone-400">
        <span>{state.totalVotes} total vote{state.totalVotes !== 1 ? "s" : ""}</span>
        {state.isClosed ? (
          <span className="rounded-full bg-stone-100 px-2.5 py-1 font-semibold text-stone-600">
            Poll closed
          </span>
        ) : !currentUser ? (
          <span>Sign in to vote</span>
        ) : state.hasVoted ? (
          <span className="font-semibold text-brand-700">Vote locked in</span>
        ) : null}
      </div>

      {/* Warning banner */}
      {warning ? (
        <p className="mt-3 rounded-[14px] bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700">
          {warning}
        </p>
      ) : null}

      {/* Live room tie-in */}
      {state.poll.relatedRoomTitle ? (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-[18px] bg-brand-50 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-brand-800">
            <Mic2 className="h-4 w-4 shrink-0" />
            <span className="truncate">{state.poll.relatedRoomTitle}</span>
          </div>
          <Link
            href="/live-rooms"
            className="shrink-0 rounded-full bg-brand-500 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-brand-600"
          >
            Join discussion
          </Link>
        </div>
      ) : null}
    </section>
  );
}
