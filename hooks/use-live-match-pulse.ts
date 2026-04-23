"use client";

import { useEffect, useRef, useState } from "react";
import { fetchLiveMatches, getInitialLiveMatches } from "@/services/live-match-service";
import { FootballTeam, GoalAlertItem, LiveMatch } from "@/types";

const MATCH_STATE_STORAGE_KEY = "habeshagram_live_match_state_v2";
const SEEN_ALERTS_STORAGE_KEY = "habeshagram_seen_match_alerts_v2";

type StoredMatchStateMap = Record<
  string,
  {
    homeScore: number;
    awayScore: number;
    status: LiveMatch["status"];
    redCardCount: number;
  }
>;

const teamShortLabel: Record<FootballTeam, string> = {
  "Manchester United": "Man Utd",
  Arsenal: "Arsenal",
  Chelsea: "Chelsea",
  "Manchester City": "Man City"
};

function readStoredMatchState(): StoredMatchStateMap {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.sessionStorage.getItem(MATCH_STATE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredMatchStateMap) : {};
  } catch {
    return {};
  }
}

function writeStoredMatchState(value: StoredMatchStateMap) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(MATCH_STATE_STORAGE_KEY, JSON.stringify(value));
}

function readSeenKeys() {
  if (typeof window === "undefined") {
    return new Set<string>();
  }

  try {
    const raw = window.sessionStorage.getItem(SEEN_ALERTS_STORAGE_KEY);
    return new Set<string>(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set<string>();
  }
}

function writeSeenKeys(value: Set<string>) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(SEEN_ALERTS_STORAGE_KEY, JSON.stringify([...value]));
}

function parseMinute(value?: string) {
  if (!value) {
    return 0;
  }

  const parsed = Number.parseInt(value.replace(/[^\d]/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getLatestGoalEvent(match: LiveMatch, scoredByHome: boolean) {
  const scoringTeam = scoredByHome ? match.homeTeam : match.awayTeam;
  return [...match.timeline]
    .reverse()
    .find((event) => event.type === "goal" && event.team === scoringTeam);
}

function getLatestRedCardEvent(match: LiveMatch) {
  return [...match.timeline].reverse().find((event) => event.type === "red");
}

function getRedCardCount(match: LiveMatch) {
  return match.timeline.filter((event) => event.type === "red").length;
}

function getFullTimeContextLabel(match: LiveMatch) {
  const latestGoal = [...match.timeline].reverse().find((event) => event.type === "goal");
  const goalDiff = Math.abs(match.homeScore - match.awayScore);
  const awayWin = match.awayScore > match.homeScore;

  if (latestGoal && parseMinute(latestGoal.minute) >= 85 && goalDiff === 1) {
    return "Late winner";
  }

  if (awayWin && goalDiff >= 2) {
    return "Big away win";
  }

  if (match.homeTeam !== match.awayTeam) {
    return "Big club result";
  }

  return undefined;
}

function getMatchHeatSignal(match: LiveMatch, reactionCount: number) {
  const redCards = getRedCardCount(match);
  const lateGoals = match.timeline.filter(
    (event) => event.type === "goal" && parseMinute(event.minute) >= 70
  ).length;

  if (redCards > 0 || (lateGoals >= 2 && reactionCount >= 6)) {
    return "Big drama" as const;
  }

  if (reactionCount >= 10) {
    return "Fan storm" as const;
  }

  if (lateGoals > 0 || reactionCount >= 5) {
    return "Heating up" as const;
  }

  return undefined;
}

function buildMatchAlerts(
  matches: LiveMatch[],
  previousState: StoredMatchStateMap,
  seenAlertKeys: Set<string>,
  primeOnly: boolean
) {
  const nextState: StoredMatchStateMap = {};
  const nextAlerts: GoalAlertItem[] = [];

  matches.forEach((match) => {
    const redCardCount = getRedCardCount(match);

    nextState[match.id] = {
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      status: match.status,
      redCardCount
    };

    const previous = previousState[match.id];
    if (!previous || primeOnly) {
      return;
    }

    const homeScored = match.status !== "FT" && match.status !== "UPCOMING" && match.homeScore > previous.homeScore;
    const awayScored = match.status !== "FT" && match.status !== "UPCOMING" && match.awayScore > previous.awayScore;

    if (homeScored || awayScored) {
      const dedupeKey = `${match.id}:goal:${match.homeScore}-${match.awayScore}`;
      if (!seenAlertKeys.has(dedupeKey)) {
        seenAlertKeys.add(dedupeKey);
        const goalEvent = getLatestGoalEvent(match, homeScored);
        const minute =
          goalEvent?.minute ||
          (match.status === "LIVE" || match.status === "HT" ? match.matchClock : undefined);

        nextAlerts.push({
          id: `${dedupeKey}:${Date.now()}`,
          matchId: match.id,
          team: homeScored ? match.homeTeam : match.awayTeam,
          scorer: goalEvent?.player,
          minute,
          type: "goal",
          message: `GOAL! ${teamShortLabel[match.homeTeam]} ${match.homeScore}-${match.awayScore} ${teamShortLabel[match.awayTeam]}`
        });
      }
    }

    if (redCardCount > previous.redCardCount) {
      const redCardEvent = getLatestRedCardEvent(match);
      const team = redCardEvent?.team ?? match.homeTeam;
      const dedupeKey = `${match.id}:red:${redCardEvent?.id ?? redCardCount}`;

      if (!seenAlertKeys.has(dedupeKey)) {
        seenAlertKeys.add(dedupeKey);
        nextAlerts.push({
          id: `${dedupeKey}:${Date.now()}`,
          matchId: match.id,
          team,
          player: redCardEvent?.player,
          minute: redCardEvent?.minute,
          type: "red-card",
          message: `RED CARD! ${teamShortLabel[team]} down to 10 men`
        });
      }
    }

    if (previous.status !== "FT" && match.status === "FT") {
      const dedupeKey = `${match.id}:ft:${match.homeScore}-${match.awayScore}`;

      if (!seenAlertKeys.has(dedupeKey)) {
        seenAlertKeys.add(dedupeKey);
        nextAlerts.push({
          id: `${dedupeKey}:${Date.now()}`,
          matchId: match.id,
          type: "ft",
          contextLabel: getFullTimeContextLabel(match),
          message: `FT ${teamShortLabel[match.homeTeam]} ${match.homeScore}-${match.awayScore} ${teamShortLabel[match.awayTeam]}`
        });
      }
    }
  });

  return {
    nextState,
    nextAlerts
  };
}

export function useLiveMatchPulse({
  pollMs = 15000,
  posts = []
}: {
  pollMs?: number;
  posts?: Array<{ teamTag?: FootballTeam; likeCount: number; commentCount: number; createdAt: string }>;
} = {}) {
  const [matches, setMatches] = useState<LiveMatch[]>(() => getInitialLiveMatches());
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [goalAlerts, setGoalAlerts] = useState<GoalAlertItem[]>([]);
  const previousStateRef = useRef<StoredMatchStateMap>({});
  const seenAlertKeysRef = useRef<Set<string>>(new Set());
  const hasPrimedRef = useRef(false);

  useEffect(() => {
    previousStateRef.current = readStoredMatchState();
    seenAlertKeysRef.current = readSeenKeys();
  }, []);

  useEffect(() => {
    if (!goalAlerts.length) {
      return;
    }

    const timers = goalAlerts.map((alert) =>
      window.setTimeout(() => {
        setGoalAlerts((current) => current.filter((item) => item.id !== alert.id));
      }, 4200)
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [goalAlerts]);

  useEffect(() => {
    let isMounted = true;

    const loadMatches = async () => {
      try {
        if (isMounted) {
          setIsLoading(true);
        }

        const payload = await fetchLiveMatches();
        if (!isMounted) {
          return;
        }

        const { nextState, nextAlerts } = buildMatchAlerts(
          payload.matches,
          previousStateRef.current,
          seenAlertKeysRef.current,
          !hasPrimedRef.current
        );

        previousStateRef.current = nextState;
        writeStoredMatchState(nextState);
        writeSeenKeys(seenAlertKeysRef.current);
        hasPrimedRef.current = true;

        const enrichedMatches = payload.matches.map((match) => {
          const reactionCount = posts.filter((post) => {
            if (!post.teamTag) {
              return false;
            }

            const teams = [match.homeTeam, match.awayTeam];
            return teams.includes(post.teamTag);
          }).length;

          return {
            ...match,
            heatSignal: getMatchHeatSignal(match, reactionCount)
          };
        });

        setMatches(enrichedMatches);
        setMessage(payload.message ?? "");
        if (nextAlerts.length) {
          setGoalAlerts((current) => [...nextAlerts, ...current].slice(0, 4));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadMatches();
    const interval = window.setInterval(() => {
      void loadMatches();
    }, pollMs);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, [pollMs, posts]);

  return {
    matches,
    isLoading,
    message,
    goalAlerts
  };
}
