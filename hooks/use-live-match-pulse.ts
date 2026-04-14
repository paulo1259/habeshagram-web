"use client";

import { useEffect, useRef, useState } from "react";
import { fetchLiveMatches, getInitialLiveMatches } from "@/services/live-match-service";
import { GoalAlertItem, LiveMatch } from "@/types";

const SCORE_STORAGE_KEY = "habeshagram_live_scores_v1";
const SEEN_ALERTS_STORAGE_KEY = "habeshagram_seen_goal_alerts_v1";

type StoredScoreMap = Record<string, { homeScore: number; awayScore: number }>;

function readStoredScores(): StoredScoreMap {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.sessionStorage.getItem(SCORE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredScoreMap) : {};
  } catch {
    return {};
  }
}

function writeStoredScores(value: StoredScoreMap) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(SCORE_STORAGE_KEY, JSON.stringify(value));
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

function getLatestGoalEvent(match: LiveMatch, scoredByHome: boolean) {
  const scoringTeam = scoredByHome ? match.homeTeam : match.awayTeam;
  return [...match.timeline]
    .reverse()
    .find((event) => event.type === "goal" && event.team === scoringTeam);
}

function buildGoalAlerts(
  matches: LiveMatch[],
  previousScores: StoredScoreMap,
  seenGoalKeys: Set<string>,
  primeOnly: boolean
) {
  const nextScores: StoredScoreMap = {};
  const nextAlerts: GoalAlertItem[] = [];

  matches.forEach((match) => {
    nextScores[match.id] = {
      homeScore: match.homeScore,
      awayScore: match.awayScore
    };

    const previous = previousScores[match.id];
    if (!previous || primeOnly || match.status === "FT" || match.status === "UPCOMING") {
      return;
    }

    const homeScored = match.homeScore > previous.homeScore;
    const awayScored = match.awayScore > previous.awayScore;

    if (!homeScored && !awayScored) {
      return;
    }

    const dedupeKey = `${match.id}:${match.homeScore}-${match.awayScore}`;
    if (seenGoalKeys.has(dedupeKey)) {
      return;
    }

    seenGoalKeys.add(dedupeKey);
    const goalEvent = getLatestGoalEvent(match, homeScored);
    const minute = goalEvent?.minute || (match.status === "LIVE" || match.status === "HT" ? match.matchClock : undefined);

    nextAlerts.push({
      id: `${dedupeKey}:${Date.now()}`,
      matchId: match.id,
      team: homeScored ? match.homeTeam : match.awayTeam,
      scorer: goalEvent?.player,
      minute,
      message: `GOAL! ${match.homeTeam} ${match.homeScore}-${match.awayScore} ${match.awayTeam}`
    });
  });

  return {
    nextScores,
    nextAlerts
  };
}

export function useLiveMatchPulse({ pollMs = 15000 }: { pollMs?: number } = {}) {
  const [matches, setMatches] = useState<LiveMatch[]>(() => getInitialLiveMatches());
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [goalAlerts, setGoalAlerts] = useState<GoalAlertItem[]>([]);
  const previousScoresRef = useRef<StoredScoreMap>({});
  const seenGoalKeysRef = useRef<Set<string>>(new Set());
  const hasPrimedRef = useRef(false);

  useEffect(() => {
    previousScoresRef.current = readStoredScores();
    seenGoalKeysRef.current = readSeenKeys();
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

        const { nextScores, nextAlerts } = buildGoalAlerts(
          payload.matches,
          previousScoresRef.current,
          seenGoalKeysRef.current,
          !hasPrimedRef.current
        );

        previousScoresRef.current = nextScores;
        writeStoredScores(nextScores);
        writeSeenKeys(seenGoalKeysRef.current);
        hasPrimedRef.current = true;

        setMatches(payload.matches);
        setMessage(payload.message ?? "");
        if (nextAlerts.length) {
          setGoalAlerts((current) => [...nextAlerts, ...current].slice(0, 3));
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
  }, [pollMs]);

  return {
    matches,
    isLoading,
    message,
    goalAlerts
  };
}
