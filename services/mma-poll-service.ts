import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { firebaseDb, isFirebaseConfigured } from "@/lib/firebase";
import { WebMMAPredictionPoll } from "@/services/mma-hub-data";

const POLLS_COLLECTION = "mmaPolls";
const FIRESTORE_TIMEOUT_MS = 5000;

export type WebMMAPollState = {
  poll: WebMMAPredictionPoll;
  optionCounts: Record<string, number>;
  totalVotes: number;
  selectedOptionId?: string;
  hasVoted: boolean;
  isClosed: boolean;
};

async function withTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), FIRESTORE_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

function buildClosedState(poll: WebMMAPredictionPoll) {
  const closesAtMs = Date.parse(poll.closesAt);
  return Number.isFinite(closesAtMs) && Date.now() >= closesAtMs;
}

function normalizeCounts(raw: unknown, poll: WebMMAPredictionPoll) {
  const entries = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  return poll.options.reduce<Record<string, number>>((accumulator, option) => {
    const val = entries[option.id];
    accumulator[option.id] = typeof val === "number" && val >= 0 ? val : 0;
    return accumulator;
  }, {});
}

function buildFallbackState(poll: WebMMAPredictionPoll): WebMMAPollState {
  return {
    poll,
    optionCounts: normalizeCounts(undefined, poll),
    totalVotes: poll.totalVotes,
    selectedOptionId: undefined,
    hasVoted: false,
    isClosed: buildClosedState(poll),
  };
}

export async function getMMAPollState(
  poll: WebMMAPredictionPoll,
  userId?: string | null,
): Promise<WebMMAPollState> {
  if (!isFirebaseConfigured || !firebaseDb) {
    return buildFallbackState(poll);
  }

  try {
    const pollRef = doc(firebaseDb, POLLS_COLLECTION, poll.pollId);
    const voteRef = userId ? doc(firebaseDb, POLLS_COLLECTION, poll.pollId, "votes", userId) : null;
    const [pollSnapshot, voteSnapshot] = await Promise.all([
      withTimeout(getDoc(pollRef), "Timed out while loading the prediction poll."),
      voteRef ? withTimeout(getDoc(voteRef), "Timed out while loading your prediction.") : Promise.resolve(null),
    ]);

    const pollData = pollSnapshot.exists() ? (pollSnapshot.data() as Record<string, unknown>) : null;
    const optionCounts = normalizeCounts(pollData?.optionCounts, poll);
    const totalVotes =
      typeof pollData?.totalVotes === "number" && pollData.totalVotes >= 0
        ? pollData.totalVotes
        : Object.values(optionCounts).reduce((sum, count) => sum + count, 0);
    const selectedOptionId =
      voteSnapshot?.exists() && typeof voteSnapshot.data().selectedOptionId === "string"
        ? voteSnapshot.data().selectedOptionId
        : undefined;

    return {
      poll,
      optionCounts,
      totalVotes,
      selectedOptionId,
      hasVoted: Boolean(selectedOptionId),
      isClosed: buildClosedState(poll),
    };
  } catch {
    return buildFallbackState(poll);
  }
}

export async function submitMMAPollVote(input: {
  poll: WebMMAPredictionPoll;
  userId: string;
  optionId: string;
}): Promise<WebMMAPollState> {
  const { poll, userId, optionId } = input;

  if (!isFirebaseConfigured || !firebaseDb) {
    throw new Error("Prediction voting is not available until Firebase is configured.");
  }

  const db = firebaseDb!;
  return withTimeout(
    runTransaction(db, async (transaction) => {
      const pollRef = doc(db, POLLS_COLLECTION, poll.pollId);
      const voteRef = doc(db, POLLS_COLLECTION, poll.pollId, "votes", userId);
      const [pollSnapshot, voteSnapshot] = await Promise.all([
        transaction.get(pollRef),
        transaction.get(voteRef),
      ]);

      const existingCounts = normalizeCounts(
        pollSnapshot.exists() ? (pollSnapshot.data() as Record<string, unknown>).optionCounts : undefined,
        poll,
      );
      const existingTotalVotes =
        pollSnapshot.exists() && typeof pollSnapshot.data().totalVotes === "number"
          ? (pollSnapshot.data().totalVotes as number)
          : Object.values(existingCounts).reduce((sum, count) => sum + count, 0);

      if (voteSnapshot.exists()) {
        const selectedOptionId =
          typeof voteSnapshot.data().selectedOptionId === "string"
            ? voteSnapshot.data().selectedOptionId
            : undefined;

        return {
          poll,
          optionCounts: existingCounts,
          totalVotes: existingTotalVotes,
          selectedOptionId,
          hasVoted: true,
          isClosed: buildClosedState(poll),
        };
      }

      if (buildClosedState(poll)) {
        throw new Error("This prediction poll has already closed.");
      }

      const nextCounts = { ...existingCounts, [optionId]: (existingCounts[optionId] ?? 0) + 1 };
      const nextTotalVotes = existingTotalVotes + 1;

      transaction.set(
        pollRef,
        {
          pollId: poll.pollId,
          eventId: poll.eventId,
          fightTitle: poll.fightTitle,
          fighterA: poll.fighterA,
          fighterB: poll.fighterB,
          closesAt: poll.closesAt,
          relatedRoomTitle: poll.relatedRoomTitle ?? null,
          optionCounts: nextCounts,
          totalVotes: nextTotalVotes,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      transaction.set(voteRef, {
        userId,
        selectedOptionId: optionId,
        createdAt: serverTimestamp(),
      });

      return {
        poll,
        optionCounts: nextCounts,
        totalVotes: nextTotalVotes,
        selectedOptionId: optionId,
        hasVoted: true,
        isClosed: false,
      };
    }),
    "Timed out while saving your prediction.",
  );
}
