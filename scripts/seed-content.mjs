import { getApps, initializeApp, applicationDefault, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || "";

const dailyDebates = [
  {
    id: "debate-arsenal-complete-side",
    prompt: "Is Arsenal the most complete side in the league right now?",
    category: "Big Debate",
    teamTag: "Arsenal",
    hashtag: "COYG",
    suggestedText: "My take on Arsenal right now: #COYG",
    featured: true,
    active: true,
    publishLabel: "Today",
    createdAt: "2026-04-15T08:00:00.000Z"
  },
  {
    id: "debate-chelsea-rebuild-again",
    prompt: "Should Chelsea rebuild again, or finally trust what they already have?",
    category: "Big Debate",
    teamTag: "Chelsea",
    hashtag: "CFC",
    suggestedText: "My Chelsea rebuild take: #CFC",
    active: true,
    publishLabel: "Today",
    createdAt: "2026-04-15T07:30:00.000Z"
  },
  {
    id: "debate-united-still-top-club",
    prompt: "Is Manchester United still a top club, or are fans living on history and hope?",
    category: "Fan Base",
    teamTag: "Manchester United",
    hashtag: "GGMU",
    suggestedText: "My honest United take tonight: #GGMU",
    active: true,
    publishLabel: "Today",
    createdAt: "2026-04-15T07:00:00.000Z"
  },
  {
    id: "debate-city-standards-too-high",
    prompt: "Are Manchester City standards now so high that even comfortable wins feel underwhelming?",
    category: "Matchday",
    teamTag: "Manchester City",
    hashtag: "MCFC",
    suggestedText: "City fans, here is my take: #MCFC",
    active: true,
    publishLabel: "Today",
    createdAt: "2026-04-15T06:30:00.000Z"
  },
  {
    id: "debate-habesha-fanbase-loudest",
    prompt: "Who has the loudest football fan base in the Habesha community right now?",
    category: "Community",
    hashtag: "HabeshaFootball",
    suggestedText: "Today's Habesha football debate: #HabeshaFootball",
    active: true,
    publishLabel: "Today",
    createdAt: "2026-04-15T06:00:00.000Z"
  }
];

const curatedVideos = [
  {
    id: "video_mu_last-minute-chaos",
    title: "United chaos in stoppage time gets the whole timeline screaming",
    category: "Football Moments",
    source: "YouTube",
    summary:
      "A high-drama late goal clip that feels perfect for the Habesha matchday mood when group chats go wild.",
    thumbnailURL: "https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=900&q=80",
    videoUrl: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
    embedUrl: "https://www.youtube.com/embed/ysz5S6PUM-U",
    duration: "2:18",
    teamTag: "Manchester United",
    hashtags: ["ggmu", "matchday", "premierleague"],
    createdAt: "2026-04-15T09:30:00.000Z",
    publishLabel: "2h ago",
    featured: true
  },
  {
    id: "video_arsenal-fan-cam",
    title: "Arsenal fan cam energy after a statement win",
    category: "Fan Reactions",
    source: "YouTube",
    summary:
      "Pure post-match emotion, the kind of reaction clip that makes the fan zone feel alive even after full time.",
    thumbnailURL: "https://images.unsplash.com/photo-1518604666860-9ed391f76460?auto=format&fit=crop&w=900&q=80",
    videoUrl: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
    embedUrl: "https://www.youtube.com/embed/jNQXAC9IVRw",
    duration: "3:42",
    teamTag: "Arsenal",
    hashtags: ["coyg", "fanreactions", "london"],
    createdAt: "2026-04-15T08:10:00.000Z",
    publishLabel: "Today",
    featured: true
  },
  {
    id: "video_chelsea-tactical-breakdown",
    title: "Chelsea moments that sparked the loudest debate this week",
    category: "Football Moments",
    source: "YouTube",
    summary:
      "A tight highlight reel built around the biggest moments fans are already arguing about across the app.",
    thumbnailURL: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=900&q=80",
    videoUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    embedUrl: "https://www.youtube.com/embed/aqz-KE-bpKQ",
    duration: "4:06",
    teamTag: "Chelsea",
    hashtags: ["cfc", "bigdebate", "premierleague"],
    createdAt: "2026-04-14T20:15:00.000Z",
    publishLabel: "Last night"
  },
  {
    id: "video_city-clinical-finish",
    title: "City finishing clinic with all the little details fans love",
    category: "Football Moments",
    source: "YouTube",
    summary:
      "A polished clip for City supporters who want to replay the quality and for rivals who want to study it.",
    thumbnailURL: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=900&q=80",
    videoUrl: "https://www.youtube.com/watch?v=ScMzIvxBSi4",
    embedUrl: "https://www.youtube.com/embed/ScMzIvxBSi4",
    duration: "2:54",
    teamTag: "Manchester City",
    hashtags: ["mcfc", "footballmoments", "titlecharge"],
    createdAt: "2026-04-14T18:30:00.000Z",
    publishLabel: "Yesterday"
  },
  {
    id: "video_habesha-street-style",
    title: "Habesha street style clip with music, confidence, and color",
    category: "Culture",
    source: "YouTube",
    summary:
      "A warm visual break from football that still feels perfectly on-brand for the HabeshaGram discovery mood.",
    thumbnailURL: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
    videoUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    embedUrl: "https://www.youtube.com/embed/aqz-KE-bpKQ",
    duration: "1:49",
    hashtags: ["habesha", "fashion", "addis"],
    createdAt: "2026-04-13T16:05:00.000Z",
    publishLabel: "Weekend pick"
  },
  {
    id: "video_music-lounge-vibes",
    title: "Late-night Habesha music lounge clip to reset the timeline",
    category: "Music",
    source: "YouTube",
    summary:
      "Curated music energy that keeps discovery broader than football without losing the app's warm, social feel.",
    thumbnailURL: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=900&q=80",
    videoUrl: "https://www.youtube.com/watch?v=ysz5S6PUM-U",
    embedUrl: "https://www.youtube.com/embed/ysz5S6PUM-U",
    duration: "5:11",
    hashtags: ["music", "habesha", "nightvibes"],
    createdAt: "2026-04-12T23:00:00.000Z",
    publishLabel: "Featured clip",
    featured: true
  }
];

function getCredential() {
  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64?.trim();

  if (base64) {
    const json = Buffer.from(base64, "base64").toString("utf8");
    return cert(JSON.parse(json));
  }

  return applicationDefault();
}

function initializeAdmin() {
  if (getApps().length) {
    return getApps()[0];
  }

  return initializeApp({
    credential: getCredential(),
    ...(projectId ? { projectId } : {})
  });
}

async function seedCollection(db, collectionName, docs) {
  let created = 0;
  let skipped = 0;

  for (const entry of docs) {
    const ref = db.collection(collectionName).doc(entry.id);
    const snapshot = await ref.get();

    if (snapshot.exists) {
      skipped += 1;
      console.log(`[skip] ${collectionName}/${entry.id}`);
      continue;
    }

    await ref.set(entry);
    created += 1;
    console.log(`[create] ${collectionName}/${entry.id}`);
  }

  return { created, skipped };
}

async function main() {
  if (!projectId) {
    throw new Error(
      "NEXT_PUBLIC_FIREBASE_PROJECT_ID is missing. Add your Firebase web config to .env.local before seeding."
    );
  }

  initializeAdmin();
  const db = getFirestore();

  console.log(`Seeding Firestore content into project "${projectId}"...`);

  const debatesResult = await seedCollection(db, "dailyDebates", dailyDebates);
  const videosResult = await seedCollection(db, "curatedVideos", curatedVideos);

  console.log("");
  console.log("Seed complete.");
  console.log(
    `dailyDebates: created ${debatesResult.created}, skipped ${debatesResult.skipped}`
  );
  console.log(
    `curatedVideos: created ${videosResult.created}, skipped ${videosResult.skipped}`
  );
  console.log("");
  console.log("This script is admin-only and safe to rerun. Existing docs are skipped by default.");
}

main().catch((error) => {
  console.error("Content seed failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
