"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { logEvent } from "@/lib/analytics-events";
import { Globe2, Mic2 } from "lucide-react";
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
  isTournamentLive,
  isTournamentOver,
  loadFavorites,
  loadPredictions,
  savePrediction,
  toggleFavorite,
  verifiedHostCities,
  worldCupCommunityPrompts,
  worldCupConfig,
  worldCupCurationLabel,
  worldCupGroups,
  worldCupGroupsSourceLabel,
  worldCupSourceLabel,
} from "@/services/world-cup-data";

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

  if (!teamA || !teamB || match.teamAId.startsWith("tbd")) {
    return null;
  }

  const options: { pick: PredictionPick; label: string }[] = [
    { pick: "home", label: teamA.code },
    { pick: "draw", label: "Draw" },
    { pick: "away", label: teamB.code },
  ];

  return (
    <div className="mt-4 space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">
        Prediction poll for this verified fixture
      </p>
      <div className="flex gap-2">
        {options.map((option) => {
          const active = currentPick === option.pick;
          return (
            <button
              key={option.pick}
              type="button"
              onClick={() => onPick(match.id, option.pick)}
              className={[
                "flex-1 rounded-full border px-3 py-2 text-xs font-semibold transition",
                active
                  ? "border-brand-400 bg-brand-50 text-brand-800"
                  : "border-brand-100/80 bg-white text-stone-600 hover:border-brand-200 hover:bg-brand-50",
              ].join(" ")}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FixtureCard({
  match,
  favoriteIds,
  predictionsMap,
  onPick,
}: {
  match: WorldCupMatch;
  favoriteIds: string[];
  predictionsMap: Record<string, PredictionPick>;
  onPick: (matchId: string, pick: PredictionPick) => void;
}) {
  const teamA = getTeamById(match.teamAId);
  const teamB = getTeamById(match.teamBId);
  const badges = getMatchBadges(match, favoriteIds);
  const currentPick = predictionsMap[match.id] ?? null;
  const isPlaceholder = match.teamAId.startsWith("tbd");

  return (
    <article className="rounded-[24px] border border-brand-100/80 bg-white p-4 shadow-sm">
      {badges.length > 0 ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {badges.map((badge) => (
            <span
              key={badge}
              className="rounded-full bg-brand-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-800"
            >
              {badge}
            </span>
          ))}
        </div>
      ) : null}

      <p className="text-xs font-semibold text-stone-500">
        {match.date} | {match.timeEt}
      </p>
      <p className="mt-2 text-xl font-black tracking-tight text-ink">
        {isPlaceholder
          ? "World Cup Final"
          : `${teamA?.name ?? "TBD"} vs ${teamB?.name ?? "TBD"}`}
      </p>
      <p className="mt-2 text-sm text-stone-500">
        {match.venue} | {match.city}
      </p>
      {match.discussionPrompt ? (
        <p className="mt-3 text-sm leading-6 text-stone-600">{match.discussionPrompt}</p>
      ) : null}
      {!isPlaceholder ? (
        <PredictionWidget match={match} currentPick={currentPick} onPick={onPick} />
      ) : null}
      {match.relatedRoomTitle ? (
        <Link
          href="/live-rooms"
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-800 hover:text-brand-900"
        >
          <Mic2 className="h-4 w-4" />
          Join discussion: {match.relatedRoomTitle}
        </Link>
      ) : null}
    </article>
  );
}

function GroupCard({
  favoriteIds,
  groupId,
  groupName,
  onToggleFavorite,
}: {
  favoriteIds: string[];
  groupId: string;
  groupName: string;
  onToggleFavorite: (teamId: string) => void;
}) {
  const teams = getTeamsForGroup(groupId);

  return (
    <article className="rounded-[24px] border border-brand-100/80 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-lg font-black tracking-tight text-ink">{groupName}</p>
        <span className="rounded-full bg-brand-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-800">
          Official draw
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {teams.map((team) => {
          const isFavorite = favoriteIds.includes(team.id);

          return (
            <button
              key={team.id}
              type="button"
              onClick={() => onToggleFavorite(team.id)}
              className={[
                "flex w-full items-center justify-between gap-3 rounded-[18px] px-3 py-3 text-left transition",
                isFavorite
                  ? "border border-brand-300 bg-brand-50"
                  : "bg-stone-50 hover:bg-brand-50/70",
              ].join(" ")}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="text-2xl">{team.flag}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-ink">{team.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                      {team.code}
                    </span>
                    {team.isHost ? (
                      <span className="rounded-full bg-stone-900 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
                        Host
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
              <span className="text-lg font-bold text-brand-700">{isFavorite ? "★" : "☆"}</span>
            </button>
          );
        })}
      </div>
    </article>
  );
}

export function WorldCupPage() {
  const target = useMemo(() => new Date(worldCupConfig.openingMatchAt), []);
  const [countdown, setCountdown] = useState(() => buildCountdown(target));
  const [isLive, setIsLive] = useState(isTournamentLive());
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [predictionsMap, setPredictionsMap] = useState<Record<string, PredictionPick>>({});
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setFavoriteIds(loadFavorites());
    setPredictionsMap(loadPredictions());
    logEvent("world_cup_hub_open");

    timerRef.current = setInterval(() => {
      setCountdown(buildCountdown(target));
      setIsLive(isTournamentLive());
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [target]);

  const handleToggleFavorite = useCallback((teamId: string) => {
    setFavoriteIds(toggleFavorite(teamId));
  }, []);

  const handlePick = useCallback((matchId: string, pick: PredictionPick) => {
    setPredictionsMap((current) => {
      const next = { ...current };
      const nextPick = current[matchId] === pick ? null : pick;
      savePrediction(matchId, nextPick);
      if (nextPick === null) {
        delete next[matchId];
      } else {
        next[matchId] = nextPick;
      }
      return next;
    });
  }, []);

  if (!worldCupConfig.enabled || isTournamentOver()) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <p className="text-2xl font-black text-ink">World Cup 2026</p>
          <p className="text-stone-500">The tournament hub is turned off right now.</p>
        </div>
      </AppShell>
    );
  }

  const officialFixtures = getUpcomingMatches(8);
  const favoriteFixtures =
    favoriteIds.length > 0 ? getUpcomingMatchesForFavorites(favoriteIds, 3) : [];

  return (
    <AppShell>
      <div className="page-stack">
        <section className="surface-panel p-4 sm:p-5">
          <SectionHeader
            eyebrow="World Cup 2026"
            title={isLive ? "Tournament trust mode" : "World Cup countdown"}
            description="Verified FIFA fixtures first, with community prompts layered around them."
          />

          <div className="mt-4 rounded-[26px] border border-brand-100/80 bg-gradient-to-r from-brand-700 via-brand-600 to-orange-500 p-5 text-white shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <span className="inline-flex rounded-full bg-white/14 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white">
                  {isLive ? "Live tournament window" : "Verified countdown"}
                </span>
                <p className="text-3xl font-black tracking-tight">
                  {isLive
                    ? "The tournament window is live"
                    : `${countdown.days}d ${String(countdown.hours).padStart(2, "0")}h ${String(countdown.minutes).padStart(2, "0")}m ${String(countdown.seconds).padStart(2, "0")}s`}
                </p>
                <p className="max-w-2xl text-sm leading-6 text-white/88">{worldCupCurationLabel}</p>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/75">
                  {worldCupSourceLabel}
                </p>
              </div>
              <Globe2 className="mt-1 hidden h-8 w-8 shrink-0 text-white/70 sm:block" />
            </div>
          </div>
        </section>

        <section className="surface-panel p-4 sm:p-5">
          <SectionHeader
            eyebrow="Official fixtures"
            title="What is confirmed"
            description="Only verified FIFA fixtures appear here. Unconfirmed matchups or kickoff details stay out of the way."
          />

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {officialFixtures.map((match) => (
              <FixtureCard
                key={match.id}
                favoriteIds={favoriteIds}
                match={match}
                onPick={handlePick}
                predictionsMap={predictionsMap}
              />
            ))}
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
            More fixtures coming as FIFA confirms details.
          </p>
        </section>

        <section className="surface-panel p-4 sm:p-5">
          <SectionHeader
            eyebrow="Groups"
            title="FIFA final draw"
            description="Official groups only. Team rows can still be starred without implying a generated round-robin schedule."
          />
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
            {worldCupGroupsSourceLabel}
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {worldCupGroups.map((group) => (
              <GroupCard
                key={group.id}
                favoriteIds={favoriteIds}
                groupId={group.id}
                groupName={group.name}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        </section>

        <section className="surface-panel p-4 sm:p-5">
          <SectionHeader
            eyebrow="Host nations"
            title="Quick favorites"
            description="Save the teams you care about without filling the desk with guessed schedules."
          />

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {['mex', 'usa', 'can'].map((teamId) => {
              const team = getTeamById(teamId);
              const active = favoriteIds.includes(teamId);
              if (!team) {
                return null;
              }

              return (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => handleToggleFavorite(team.id)}
                  className={[
                    "rounded-[22px] border px-4 py-4 text-center shadow-sm transition",
                    active
                      ? "border-brand-300 bg-brand-50"
                      : "border-brand-100/80 bg-white hover:border-brand-200 hover:bg-brand-50/60",
                  ].join(" ")}
                >
                  <p className="text-2xl">{team.flag}</p>
                  <p className="mt-2 text-sm font-black text-ink">{team.name}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    {active ? "Following" : "Tap to follow"}
                  </p>
                </button>
              );
            })}
          </div>

          {favoriteFixtures.length > 0 ? (
            <div className="mt-5 space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">
                Saved matchups
              </p>
              <div className="grid gap-3 lg:grid-cols-2">
                {favoriteFixtures.map((match) => (
                  <FixtureCard
                    key={`favorite-${match.id}`}
                    favoriteIds={favoriteIds}
                    match={match}
                    onPick={handlePick}
                    predictionsMap={predictionsMap}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section className="surface-panel p-4 sm:p-5">
          <SectionHeader
            eyebrow="Host cities"
            title="Verified tournament footprint"
            description="Official host cities only."
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {verifiedHostCities.map((city, index) => (
              <article
                key={city}
                className="rounded-[22px] border border-brand-100/80 bg-white px-4 py-4 shadow-sm"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">
                  Host city
                </p>
                <p className="mt-2 text-base font-black tracking-tight text-ink">{city}</p>
                <p className="mt-2 text-sm text-stone-500">
                  {index < 3 ? "Opening-week energy" : index < 8 ? "Group-stage stage" : "Tournament stop"}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="surface-panel p-4 sm:p-5">
          <SectionHeader
            eyebrow="Community prompts"
            title="Talk about the tournament"
            description="These are clearly editorial conversation starters, not official schedule updates."
          />
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {worldCupCommunityPrompts.map((prompt) => (
              <article
                key={prompt.id}
                className="rounded-[22px] border border-brand-100/80 bg-white px-4 py-4 shadow-sm"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">
                  Community discussion
                </p>
                <p className="mt-2 text-lg font-black tracking-tight text-ink">{prompt.title}</p>
                <p className="mt-3 text-sm leading-6 text-stone-600">{prompt.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="surface-panel p-4 sm:p-5">
          <SectionHeader
            eyebrow="Live rooms"
            title="Tournament conversations"
            description="A simple bridge from verified fixtures into the audio side of HabeshaGram."
            action={
              <Link
                href="/live-rooms"
                className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-800 transition hover:bg-brand-100"
              >
                <Mic2 className="h-3.5 w-3.5" />
                Open rooms
              </Link>
            }
          />
          <div className="mt-4 rounded-[24px] border border-brand-100/80 bg-white px-4 py-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-700">Verified match rooms</p>
            <p className="mt-2 text-lg font-black tracking-tight text-ink">World Cup watch rooms</p>
            <p className="mt-3 text-sm leading-6 text-stone-600">
              Bring verified fixtures into a watch-room flow without pretending HabeshaGram has live score coverage it cannot verify.
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
