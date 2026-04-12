import { doc, setDoc } from "firebase/firestore";
import { firebaseDb, isFirebaseConfigured } from "@/lib/firebase";
import { readState, writeState } from "@/services/local-store";
import { Post, PostReport, PostReportReason, User } from "@/types";

const FIRESTORE_TIMEOUT_MS = 5000;

async function withFirestoreTimeout<T>(promise: Promise<T>, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), FIRESTORE_TIMEOUT_MS);
      })
    ]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

function mapReportError(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";

  switch (code) {
    case "permission-denied":
    case "firestore/permission-denied":
      return "Reporting is blocked by your current Firestore rules. Update report permissions and try again.";
    default:
      return error instanceof Error ? error.message : "Unable to send your report right now.";
  }
}

export async function reportPost(input: {
  post: Post;
  actor: User;
  reason: PostReportReason;
  details?: string;
}) {
  if (!input.actor?.id) {
    throw new Error("Please log in before reporting posts.");
  }

  if (!input.post?.id) {
    throw new Error("This post is no longer available.");
  }

  if (input.actor.id === input.post.userId) {
    throw new Error("You cannot report your own post.");
  }

  const reportId = `post_${input.post.id}_${input.actor.id}`;
  const report: PostReport = {
    id: reportId,
    postId: input.post.id,
    reportedUserId: input.post.userId,
    reporterUserId: input.actor.id,
    reporterUsername: input.actor.username,
    reporterProfileImageURL: input.actor.profileImageURL,
    reason: input.reason,
    details: input.details?.trim() || "",
    status: "open",
    postTextPreview: input.post.text.slice(0, 280),
    postImageURL: input.post.imageURL || "",
    createdAt: new Date().toISOString()
  };

  if (isFirebaseConfigured && firebaseDb) {
    try {
      await withFirestoreTimeout(
        setDoc(doc(firebaseDb, "reports", reportId), report, { merge: true }),
        "Timed out while sending your report."
      );
      return;
    } catch (error) {
      throw new Error(mapReportError(error));
    }
  }

  const state = readState();
  const nextReports = state.reports.some((item) => item.id === reportId)
    ? state.reports.map((item) => (item.id === reportId ? report : item))
    : [report, ...state.reports];

  writeState({
    ...state,
    reports: nextReports
  });
}
