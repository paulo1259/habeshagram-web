import { collection, getDocs } from "firebase/firestore";
import { firebaseDb, isFirebaseConfigured } from "@/lib/firebase";
import { dailyDebatePrompts } from "@/services/discovery-data";
import { DailyDebatePrompt, FootballTeam } from "@/types";

const FIRESTORE_TIMEOUT_MS = 4000;
const DAILY_DEBATES_COLLECTION = "dailyDebates";

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

function sortByCreatedAtDesc(items: DailyDebatePrompt[]) {
  return [...items].sort((a, b) => +new Date(b.createdAt ?? 0) - +new Date(a.createdAt ?? 0));
}

function mapDebate(data: Partial<DailyDebatePrompt>, id: string): DailyDebatePrompt | null {
  if (!data.prompt || !data.category || !data.suggestedText) {
    return null;
  }

  return {
    id: data.id || id,
    prompt: data.prompt,
    category: data.category,
    teamTag: data.teamTag,
    hashtag: typeof data.hashtag === "string" ? data.hashtag : undefined,
    suggestedText: data.suggestedText,
    featured: Boolean(data.featured),
    active: data.active !== false,
    publishLabel: data.publishLabel,
    createdAt: data.createdAt || new Date().toISOString()
  };
}

function rotateDailyDebates(items: DailyDebatePrompt[], team?: FootballTeam) {
  const activeItems = items.filter((item) => item.active !== false);
  const filtered = team
    ? activeItems.filter((item) => item.teamTag === team || !item.teamTag)
    : activeItems;

  if (!filtered.length) {
    return [];
  }

  const sorted = sortByCreatedAtDesc(filtered);
  const featured = sorted.filter((item) => item.featured);
  const nonFeatured = sorted.filter((item) => !item.featured);
  const ordered = [...featured, ...nonFeatured];
  const daySeed = new Date().getUTCDate() + new Date().getUTCMonth() * 31;
  const startIndex = daySeed % ordered.length;
  const rotated = [...ordered.slice(startIndex), ...ordered.slice(0, startIndex)];

  return rotated.slice(0, Math.min(team ? 3 : 4, rotated.length));
}

export async function getDailyDebatePrompts(team?: FootballTeam): Promise<DailyDebatePrompt[]> {
  if (!isFirebaseConfigured || !firebaseDb) {
    return rotateDailyDebates(dailyDebatePrompts, team);
  }

  try {
    const snapshot = await withFirestoreTimeout(
      getDocs(collection(firebaseDb, DAILY_DEBATES_COLLECTION)),
      "Timed out while loading daily debates."
    );

    const items = snapshot.docs
      .map((item) => mapDebate(item.data() as Partial<DailyDebatePrompt>, item.id))
      .filter((item): item is DailyDebatePrompt => Boolean(item));

    return rotateDailyDebates(items.length ? items : dailyDebatePrompts, team);
  } catch {
    return rotateDailyDebates(dailyDebatePrompts, team);
  }
}

// TODO: Replace Firestore Console-only debate curation with an internal admin
// dashboard that writes the same DailyDebatePrompt shape into dailyDebates/{debateId}.
