import { collection, doc, getDoc, getDocs, orderBy, query, runTransaction } from "firebase/firestore";
import { firebaseDb, isFirebaseConfigured } from "@/lib/firebase";
import { readState, writeState } from "@/services/local-store";
import { createNotification } from "@/services/notification-service";
import { FollowRelation, User } from "@/types";

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

function mapFollowError(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";

  switch (code) {
    case "permission-denied":
    case "firestore/permission-denied":
      return "This action is blocked by your current Firestore rules. Update your follow permissions and try again.";
    default:
      return error instanceof Error ? error.message : "Unable to update follow status.";
  }
}

export async function isFollowingUser(followerId: string, followingId: string): Promise<boolean> {
  if (!followerId || !followingId || followerId === followingId) {
    return false;
  }

  if (isFirebaseConfigured && firebaseDb) {
    try {
      const snapshot = await withFirestoreTimeout(
        getDoc(doc(firebaseDb, "users", followerId, "following", followingId)),
        "Timed out while checking follow status."
      );
      return snapshot.exists();
    } catch (error) {
      throw new Error(mapFollowError(error));
    }
  }

  const state = readState();
  return state.follows.some(
    (item) => item.followerId === followerId && item.followingId === followingId
  );
}

export async function getSuggestedUsers(currentUserId?: string | null): Promise<User[]> {
  if (isFirebaseConfigured && firebaseDb) {
    const snapshot = await withFirestoreTimeout(
      getDocs(query(collection(firebaseDb, "users"), orderBy("createdAt", "desc"))),
      "Timed out while loading suggested users."
    );

    return snapshot.docs
      .map((item) => {
        const data = item.data() as Partial<User>;
        return {
          id: data.id || item.id,
          username: data.username || "habesha_user",
          email: data.email || "",
          profileImageURL: data.profileImageURL || "",
          bio: data.bio || "",
          createdAt: data.createdAt || new Date().toISOString(),
          followerCount: typeof data.followerCount === "number" ? data.followerCount : 0,
          followingCount: typeof data.followingCount === "number" ? data.followingCount : 0
        };
      })
      .filter((user) => user.id !== currentUserId)
      .slice(0, 4);
  }

  const state = readState();
  return state.users.filter((user) => user.id !== currentUserId).slice(0, 4);
}

export async function getFollowingIds(userId: string): Promise<string[]> {
  if (!userId) {
    return [];
  }

  if (isFirebaseConfigured && firebaseDb) {
    try {
      const snapshot = await withFirestoreTimeout(
        getDocs(query(collection(firebaseDb, "users", userId, "following"), orderBy("createdAt", "desc"))),
        "Timed out while loading your following list."
      );

      return snapshot.docs.map((item) => item.id);
    } catch (error) {
      throw new Error(mapFollowError(error));
    }
  }

  const state = readState();
  return state.follows
    .filter((item) => item.followerId === userId)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .map((item) => item.followingId);
}

export async function toggleFollowUser(input: {
  actor: User;
  followingId: string;
}): Promise<{ isFollowing: boolean; followerCount: number; followingCount: number }> {
  if (!input.actor.id || !input.followingId || input.actor.id === input.followingId) {
    throw new Error("You cannot follow this profile.");
  }

  if (isFirebaseConfigured && firebaseDb) {
    const followerRef = doc(firebaseDb, "users", input.actor.id);
    const followingRef = doc(firebaseDb, "users", input.followingId);
    const followEdgeRef = doc(firebaseDb, "users", input.actor.id, "following", input.followingId);
    const followerEdgeRef = doc(firebaseDb, "users", input.followingId, "followers", input.actor.id);

    try {
      const result = await withFirestoreTimeout(
        runTransaction(firebaseDb, async (transaction) => {
          const [followerSnapshot, followingSnapshot, followEdgeSnapshot] = await Promise.all([
            transaction.get(followerRef),
            transaction.get(followingRef),
            transaction.get(followEdgeRef)
          ]);

          if (!followerSnapshot.exists() || !followingSnapshot.exists()) {
            throw new Error("This profile is no longer available.");
          }

          const isFollowing = followEdgeSnapshot.exists();
          const currentFollowingCount =
            typeof followerSnapshot.data().followingCount === "number"
              ? followerSnapshot.data().followingCount
              : 0;
          const currentFollowerCount =
            typeof followingSnapshot.data().followerCount === "number"
              ? followingSnapshot.data().followerCount
              : 0;

          if (isFollowing) {
            transaction.delete(followEdgeRef);
            transaction.delete(followerEdgeRef);
          } else {
            const edge: FollowRelation = {
              followerId: input.actor.id,
              followingId: input.followingId,
              createdAt: new Date().toISOString()
            };
            transaction.set(followEdgeRef, edge);
            transaction.set(followerEdgeRef, edge);
          }

          const nextFollowerCount = isFollowing
            ? Math.max(0, currentFollowerCount - 1)
            : currentFollowerCount + 1;
          const nextFollowingCount = isFollowing
            ? Math.max(0, currentFollowingCount - 1)
            : currentFollowingCount + 1;

          transaction.update(followingRef, { followerCount: nextFollowerCount });
          transaction.update(followerRef, { followingCount: nextFollowingCount });

          return {
            isFollowing: !isFollowing,
            followerCount: nextFollowerCount,
            followingCount: nextFollowingCount
          };
        }),
        "Timed out while updating follow status."
      );

      if (result.isFollowing) {
        void createNotification({
          recipientUserId: input.followingId,
          type: "follow",
          actor: input.actor,
          message: "started following you"
        });
      }

      return result;
    } catch (error) {
      throw new Error(mapFollowError(error));
    }
  }

  const state = readState();
  const alreadyFollowing = state.follows.some(
    (item) => item.followerId === input.actor.id && item.followingId === input.followingId
  );

  const follows = alreadyFollowing
    ? state.follows.filter(
        (item) => !(item.followerId === input.actor.id && item.followingId === input.followingId)
      )
    : [
        ...state.follows,
        {
          followerId: input.actor.id,
          followingId: input.followingId,
          createdAt: new Date().toISOString()
        }
      ];

  const users = state.users.map((user) => {
    if (user.id === input.followingId) {
      return {
        ...user,
        followerCount: alreadyFollowing ? Math.max(0, user.followerCount - 1) : user.followerCount + 1
      };
    }

    if (user.id === input.actor.id) {
      return {
        ...user,
        followingCount: alreadyFollowing ? Math.max(0, user.followingCount - 1) : user.followingCount + 1
      };
    }

    return user;
  });

  writeState({ ...state, follows, users });

  const result = {
    isFollowing: !alreadyFollowing,
    followerCount: users.find((user) => user.id === input.followingId)?.followerCount ?? 0,
    followingCount: users.find((user) => user.id === input.actor.id)?.followingCount ?? 0
  };

  if (result.isFollowing) {
    void createNotification({
      recipientUserId: input.followingId,
      type: "follow",
      actor: input.actor,
      message: "started following you"
    });
  }

  return result;
}
