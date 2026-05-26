"use client";

/**
 * components/world-cup/world-cup-page.tsx
 *
 * World Cup 2026 Hub v2 — full group-stage schedule, My Teams,
 * match predictions (localStorage), Live Room tie-ins, premium badges.
 * Client component for countdown timer and localStorage access.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { logEvent } from "@/lib/analytics-events";
import { Mic2, Star } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { SectionHeader } from "@/components/ui/section-header";
import {
  PredictionPick,
  WorldCupMatch,
  buildCountdown,
  getMatchBadges,
  getTeamById,
  getTeamsForGroup,
  getUpcomingMatches,
  getUpcomingMatchesForFavorites,
  getUpcomingMatchesForGroup,
  isTournamentLive,
  isTournamentOver,
  loadFavorites,
  loadPredictions,
  savePrediction,
  toggleFavorite,
  worldCupConfig,
  worldCupGroups,
} from "@/services/world-cup-data";

// ── Countdown unit ────────────────────────────────────────────────────────────

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex min-w-[4.5rem] flex-col items-center gap-1">
      <span className="text-5xl font-black tabular-nums text-white sm:text-6xl">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
        {label}
      </span>
    </div>
  );
}

// ── Badge pill ────────────────────────────────────────────────────────────────

function BadgePill({ label }: { label: string }) {
  const isToday    = label === "Today";
  const isFav      = label === "Your Team";
  const isOpening  = label === "Opening Match";
  const isFinalBdg = label === "Final";
  const isLive     = label === "Live";
  const isFeatured = label === "Featured";

  const cls =
    isToday    ? "bg-blue-600 text-white" :
    isFav      ? "bg-amber-400 text-amber-900" :
    isOpening  ? "bg-brand-700 text-white" :
    isFinalBdg ? "bg-purple-600 text-white" :
    isLive     ? "bg-green-500 text-white" :
    isFeatured ? "bg-brand-100 text-brand-800" :
    "bg-stone-100 text-stone-600";

  const icon =
    isToday   ? "🗓 " :
    isFav     ? "⭐ " :
    isLive    ? "🔴 " :
    "";

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cls}`}>
      {icon}{label}
    </span>
  );
}

// ── Prediction widget ─────────────────────────────────────────────────────────

function PredictionWidget({
  match,
  currentPick,
  onPick,
}: {
  match: WorldCupMatch;
  currentPick: PredictionPick | null;
  onPick: (matchId: string, pick: PredictionPick) => void;
}) {
  const teamA = getTeamById(match.teamAId);
  const teamB = getTeamById(match.teamBId);
  if (!teamA || !teamB) return null;

  const opts: { pick: PredictionPick; label: string }[] = [
    { pick: "home",  label: `${teamA.flag} ${teamA.code}` },
    { pick: "draw",  label: "Draw" },
    { pick: "away",  label: `${teamB.flag} ${teamB.code}` },
  ];

  return (
    <div className="mt-3 space-y-1.5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Community pick — who do you think wins?</p>
      <div className="flex gap-2">
        {opts.map((o) => {
          const active = currentPick === o.pick;
          return (
            <button
              key={o.pick}
              onClick={() => onPick(match.id, o.pick)}
              className={`flex flex-1 items-center justify-center gap-1 rounded-lg border py-2 text-xs font-bold transition-all ${
                active
                  ? "border-brand-600 bg-brand-50 text-brand-700"
                  : "border-stone-200 bg-white text-stone-500 hover:border-stone-300 hover:bg-stone-50"
              }`}
            >
              {o.label}
              {active && <span className="text-brand-600">✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Match card ────────────────────────────────────────────────────────────────

function MatchCard({
  match,
  favoriteIds,
  predictionsMap,
  onPick,
  compact = false,
}: {
  match: WorldCupMatch;
  favoriteIds: string[];
  predictionsMap: Record<string, PredictionPick>;
  onPick: (matchId: string, pick: PredictionPick) => void;
  compact?: boolean;
}) {
  const teamA = getTeamById(match.teamAId);
  const teamB = getTeamById(match.teamBId);
  const isPlaceholder = match.teamAId === "tbd-a";
  const badges = getMatchBadges(match, favoriteIds);
  const currentPick = predictionsMap[match.id] ?? null;
  const isFavMatch = badges.includes("Your Team");

  return (
    <article
      className={`rounded-[22px] border bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${
        isFavMatch ? "border-amber-300 ring-1 ring-amber-200" : "border-brand-100/80"
      }`}
    >
      {/* Badges */}
      {badges.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {badges.map((b) => <BadgePill key={b} label={b} />)}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-800">
          {match.isFinal ? "Final" : `Group ${match.groupId} · MD${match.round}`}
        </span>
        <span className="text-xs font-semibold text-stone-500">{match.timeEt}</span>
      </div>

      {/* Teams */}
      {isPlaceholder ? (
        <p className="mt-3 text-base font-black tracking-tight text-ink">
          World Cup Final — TBD
        </p>
      ) : (
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex flex-1 flex-col items-start gap-0.5">
            <span className="text-2xl">{teamA?.flag ?? "🏳️"}</span>
            <span className="text-sm font-black text-ink leading-tight">
              {teamA?.name ?? match.teamAId}
            </span>
            <span className="text-[10px] font-bold tracking-widest text-stone-400">
              {teamA?.code}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            {match.status === "live" ? (
              <span className="rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-white">
                🔴 Live
              </span>
            ) : match.scoreA !== undefined && match.scoreB !== undefined ? (
              <span className="text-lg font-black text-ink">
                {match.scoreA} – {match.scoreB}
              </span>
            ) : (
              <span className="text-sm font-bold text-stone-400">VS</span>
            )}
            <span className="text-[10px] text-stone-400">{match.date.slice(5).replace("-", "/")}</span>
          </div>
          <div className="flex flex-1 flex-col items-end gap-0.5">
            <span className="text-2xl">{teamB?.flag ?? "🏳️"}</span>
            <span className="text-sm font-black text-ink leading-tight text-right">
              {teamB?.name ?? match.teamBId}
            </span>
            <span className="text-[10px] font-bold tracking-widest text-stone-400">
              {teamB?.code}
            </span>
          </div>
        </div>
      )}

      {/* Venue */}
      <p className="mt-2 text-xs text-stone-400">
        {match.venue}, {match.city}
      </p>

      {!compact && !isPlaceholder && (
        <>
          {/* Discussion prompt */}
          {match.discussionPrompt && (
            <p className="mt-3 text-xs italic text-stone-500 leading-relaxed border-l-2 border-brand-200 pl-2">
              {match.discussionPrompt}
            </p>
          )}

          {/* Prediction widget */}
          <PredictionWidget match={match} currentPick={currentPick} onPick={onPick} />

          {/* Live Room CTA */}
          {match.relatedRoomTitle ? (
            <Link
              href="/live-rooms"
              className="mt-3 flex items-center justify-between rounded-xl bg-brand-50 px-3 py-2.5 transition-colors hover:bg-brand-100"
            >
              <span className="flex items-center gap-2 text-xs font-bold text-brand-800">
                <Mic2 className="h-3.5 w-3.5" />
                {match.relatedRoomTitle}
              </span>
              <span className="text-xs font-bold text-brand-600">Talk about this match →</span>
            </Link>
          ) : (
            <Link
              href="/live-rooms"
              className="mt-3 block text-right text-xs font-semibold text-brand-500 hover:text-brand-700"
            >
              Join the conversation →
            </Link>
          )}
        </>
      )}
    </article>
  );
}

// ── Compact group match row ───────────────────────────────────────────────────

function GroupMatchRow({ match }: { match: WorldCupMatch }) {
  const teamA = getTeamById(match.teamAId);
  const teamB = getTeamById(match.teamBId);
  const today = new Date().toISOString().slice(0, 10);
  const isToday = match.date === today;

  return (
    <div className={`flex items-center justify-between rounded-lg px-2 py-1.5 text-xs ${isToday ? "bg-blue-50" : "hover:bg-stone-50"}`}>
      <div className="flex items-center gap-1.5">
        <span>{teamA?.flag}</span>
        <span className="font-bold text-stone-700">{teamA?.code}</span>
        <span className="text-stone-400">vs</span>
        <span className="font-bold text-stone-700">{teamB?.code}</span>
        <span>{teamB?.flag}</span>
      </div>
      <div className="flex items-center gap-2 text-right">
        {isToday ? (
          <span className="font-bold text-blue-600">Today</span>
        ) : (
          <span className="text-stone-400">{match.date.slice(5).replace("-", "/")}</span>
        )}
        <span className="hidden text-stone-400 sm:inline">{match.city}</span>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export function WorldCupPage() {
  const [countdown, setCountdown] = useState(
    buildCountdown(new Date(worldCupConfig.openingMatchAt)),
  );
  const [isLive, setIsLive] = useState(isTournamentLive());
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [predictionsMap, setPredictionsMap] = useState<Record<string, PredictionPick>>({});
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Load persisted state (localStorage only available in browser)
    setFavoriteIds(loadFavorites());
    setPredictionsMap(loadPredictions());
    logEvent("world_cup_hub_open");

    const target = new Date(worldCupConfig.openingMatchAt);
    timerRef.current = setInterval(() => {
      setCountdown(buildCountdown(target));
      setIsLive(isTournamentLive());
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleToggleFavorite = useCallback((teamId: string) => {
    setFavoriteIds((prev) => {
      const next = toggleFavorite(teamId);
      return next;
    });
  }, []);

  const handlePredict = useCallback((matchId: string, pick: PredictionPick) => {
    setPredictionsMap((prev) => {
      const current = prev[matchId];
      const newPick = current === pick ? null : pick;
      savePrediction(matchId, newPick);
      const next = { ...prev };
      if (newPick === null) { delete next[matchId]; } else { next[matchId] = newPick; }
      return next;
    });
  }, []);

  if (!worldCupConfig.enabled || isTournamentOver()) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <p className="text-2xl font-black text-ink">World Cup 2026</p>
          <p className="text-stone-500">The tournament has ended. Thanks for watching with HabeshaGram.</p>
        </div>
      </AppShell>
    );
  }

  const favMatches = getUpcomingMatchesForFavorites(favoriteIds, 5);
  const upcomingMatches = getUpcomingMatches(8);
  const favoriteTeams = favoriteIds.map((id) => getTeamById(id)).filter(Boolean);

  return (
    <AppShell>
      {/* ══ COUNTDOWN HERO ════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-brand-700 via-brand-600 to-orange-500 p-6 sm:p-8">
        {/* Decorative blur */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

        <div className="relative">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/60">
                FIFA World Cup
              </p>
              <p className="text-4xl font-black text-white sm:text-5xl">2026</p>
            </div>
            <p className="text-xs font-bold text-white/60">Jun 11 – Jul 19</p>
          </div>

          {isLive ? (
            <div className="mt-4 flex items-center gap-3">
              <span className="h-3 w-3 animate-pulse rounded-full bg-green-400" />
              <p className="text-xl font-black text-white">Matchday mode</p>
            </div>
          ) : (
            <>
              <p className="mt-4 text-sm font-semibold text-white/70">Tournament starts in</p>
              <div className="mt-2 flex items-end gap-2 sm:gap-3">
                <CountdownUnit value={countdown.days}    label="days" />
                <span className="mb-4 text-3xl font-black text-white/50">:</span>
                <CountdownUnit value={countdown.hours}   label="hrs" />
                <span className="mb-4 text-3xl font-black text-white/50">:</span>
                <CountdownUnit value={countdown.minutes} label="min" />
                <span className="mb-4 text-3xl font-black text-white/50">:</span>
                <CountdownUnit value={countdown.seconds} label="sec" />
              </div>
              <p className="mt-2 text-xs text-white/60">
                ⚽ Opening match · Estadio Azteca · Mexico City · 7:00 PM CT
              </p>
            </>
          )}

          <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 border-t border-white/20 pt-4 text-xs font-semibold text-white/70">
            <span>🇲🇽 Mexico</span>
            <span className="text-white/30">·</span>
            <span>🇨🇦 Canada</span>
            <span className="text-white/30">·</span>
            <span>🇺🇸 USA</span>
            <span className="text-white/30">·</span>
            <span>48 teams · 16 venues</span>
          </div>
        </div>
      </section>

      {/* ══ MY TEAMS ══════════════════════════════════════════════════════════ */}
      <section className="space-y-4">
        <SectionHeader
          eyebrow="My teams"
          title={favoriteTeams.length > 0 ? "Following" : "Pick your teams"}
          description={
            favoriteTeams.length > 0
              ? "Your favorites are highlighted and their matches surfaced first."
              : "Star any team in the group stage below to follow them through the tournament."
          }
        />

        {favoriteTeams.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {favoriteTeams.map((team) =>
              team ? (
                <button
                  key={team.id}
                  onClick={() => handleToggleFavorite(team.id)}
                  className="flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 transition-colors hover:bg-amber-100"
                >
                  <span>{team.flag}</span>
                  <span>{team.code}</span>
                  <span className="text-amber-400">✕</span>
                </button>
              ) : null,
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 p-5 text-center text-sm text-stone-400">
            ⭐ Tap the star on any team in the group stage to follow them.
          </div>
        )}
      </section>

      {/* ══ FAVORITE TEAM MATCHES ═════════════════════════════════════════════ */}
      {favMatches.length > 0 && (
        <section className="space-y-4">
          <SectionHeader
            eyebrow="Your teams"
            title="Next matches for your teams"
            description="Filtered to only matches your favorites are playing in."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {favMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                favoriteIds={favoriteIds}
                predictionsMap={predictionsMap}
                onPick={handlePredict}
              />
            ))}
          </div>
        </section>
      )}

      {/* ══ UPCOMING MATCHES ══════════════════════════════════════════════════ */}
      <section className="space-y-4">
        <SectionHeader
          eyebrow={isLive ? "Today / upcoming" : "Schedule"}
          title="Next on the schedule"
          description="Curated match schedule — verify exact kickoff times at fifa.com."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {upcomingMatches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              favoriteIds={favoriteIds}
              predictionsMap={predictionsMap}
              onPick={handlePredict}
            />
          ))}
        </div>
      </section>

      {/* ══ GROUP STAGE ═══════════════════════════════════════════════════════ */}
      <section className="space-y-4">
        <SectionHeader
          eyebrow="Group stage"
          title="All 12 groups"
          description="⭐ to follow a team · upcoming fixtures shown per group · groups from official FIFA draw Dec 2024"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {worldCupGroups.map((group) => {
            const teams = getTeamsForGroup(group.id);
            const groupMatches = getUpcomingMatchesForGroup(group.id, 3);
            const hasHostTeam = teams.some((t) => t.isHost);
            const hasFavTeam = teams.some((t) => favoriteIds.includes(t.id));

            return (
              <div
                key={group.id}
                className={`rounded-[22px] border bg-white p-4 shadow-sm ${
                  hasFavTeam ? "border-amber-300 ring-1 ring-amber-100" : "border-stone-200"
                }`}
              >
                {/* Group header */}
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-black text-ink">{group.name}</h3>
                  <div className="flex gap-1">
                    {hasHostTeam && (
                      <span className="rounded-full bg-green-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-green-700">
                        Host
                      </span>
                    )}
                    {hasFavTeam && (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700">
                        ⭐ Following
                      </span>
                    )}
                  </div>
                </div>

                {/* Teams list */}
                <div className="mt-3 divide-y divide-stone-100">
                  {teams.map((team) => {
                    const isFav = favoriteIds.includes(team.id);
                    return (
                      <div key={team.id} className="flex items-center gap-2 py-1.5">
                        <span className="text-lg">{team.flag}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`truncate text-xs font-bold leading-tight ${isFav ? "text-brand-700" : "text-ink"}`}>
                            {team.name}
                          </p>
                          <div className="flex items-center gap-1">
                            <p className="text-[9px] font-bold tracking-widest text-stone-400">
                              {team.code}
                            </p>
                            {team.isHost && (
                              <span className="rounded bg-green-100 px-1 text-[8px] font-bold text-green-700">
                                Host
                              </span>
                            )}
                            {isFav && (
                              <span className="rounded bg-amber-100 px-1 text-[8px] font-bold text-amber-700">
                                Following
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleToggleFavorite(team.id)}
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-sm transition-colors ${
                            isFav ? "text-amber-400" : "text-stone-300 hover:text-amber-300"
                          }`}
                          title={isFav ? "Unfollow" : "Follow"}
                        >
                          <Star className="h-4 w-4" fill={isFav ? "currentColor" : "none"} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Group match schedule */}
                {groupMatches.length > 0 && (
                  <div className="mt-3 space-y-0.5 border-t border-stone-100 pt-3">
                    <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-stone-400">
                      Upcoming fixtures
                    </p>
                    {groupMatches.map((m) => <GroupMatchRow key={m.id} match={m} />)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ══ ALL 48 TEAMS ══════════════════════════════════════════════════════ */}
      <section className="space-y-4">
        <SectionHeader
          eyebrow="Teams"
          title="All 48 nations"
          description="The complete field — from Group A through Group L."
        />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {worldCupGroups.flatMap((g) =>
            getTeamsForGroup(g.id).map((team) => {
              const isFav = favoriteIds.includes(team.id);
              return (
                <button
                  key={team.id}
                  onClick={() => handleToggleFavorite(team.id)}
                  className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition-all ${
                    isFav
                      ? "border-amber-300 bg-amber-50"
                      : "border-stone-100 bg-white hover:border-stone-200 hover:bg-stone-50"
                  }`}
                >
                  <span className="text-xl">{team.flag}</span>
                  <div className="min-w-0">
                    <p className={`truncate text-[11px] font-bold ${isFav ? "text-amber-800" : "text-ink"}`}>
                      {team.name}
                    </p>
                    <p className="text-[9px] font-bold tracking-widest text-stone-400">
                      {team.code} · Grp {team.groupId}
                    </p>
                  </div>
                </button>
              );
            }),
          )}
        </div>
      </section>

      {/* ══ COMMUNITY ═════════════════════════════════════════════════════════ */}
      <section className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/live-rooms"
          className="flex flex-col gap-3 rounded-[22px] border border-brand-100 bg-brand-50/60 p-5 transition-colors hover:bg-brand-50"
        >
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-brand-700 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
              Live rooms
            </span>
            <Mic2 className="h-4 w-4 text-brand-400" />
          </div>
          <div>
            <p className="text-base font-black text-ink">World Cup match rooms</p>
            <p className="mt-1 text-xs text-stone-500">
              Join audio rooms built around tonight&apos;s fixtures for scorecards, predictions,
              and post-match reactions.
            </p>
          </div>
          <p className="text-xs font-bold text-brand-600">Browse live rooms →</p>
        </Link>

        <div className="flex flex-col gap-3 rounded-[22px] border border-stone-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-stone-600">
              Predictions
            </span>
            <span className="text-xs text-stone-400">Community only</span>
          </div>
          <div>
            <p className="text-base font-black text-ink">Predict every match</p>
            <p className="mt-1 text-xs text-stone-500">
              Use the Who wins? buttons on each match card above. Your picks are saved locally
              — no gambling, no money, just community predictions.
            </p>
          </div>
        </div>
      </section>
    </AppShell>
  );
}