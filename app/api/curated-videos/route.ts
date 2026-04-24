import { NextResponse } from "next/server";
import { mapCuratedVideoData, sortCuratedVideos, type CuratedVideoDiagnostics } from "@/lib/curated-video-utils";
import { getFirebaseAdminDb, getFirebaseAdminDiagnostics } from "@/lib/firebase-admin";
import { CuratedVideoItem } from "@/types";

const CURATED_VIDEOS_COLLECTION = "curatedVideos";

export const dynamic = "force-dynamic";

function buildDiagnostics(items: CuratedVideoItem[], totalDocs: number, rejectedDocs: CuratedVideoDiagnostics["rejectedDocs"], error?: string): CuratedVideoDiagnostics {
  return {
    source: error ? "error" : items.length ? "firestore" : "empty",
    collection: CURATED_VIDEOS_COLLECTION,
    totalDocs,
    mappedDocs: items.length,
    rejectedDocs,
    items,
    returnedItems: items.map((item) => ({
      id: item.id,
      title: item.title,
      featured: Boolean(item.featured),
      createdAt: item.createdAt,
      teamTag: item.teamTag
    })),
    error
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const debug = url.searchParams.get("debug") === "1";
  const includeDebug = debug && process.env.NODE_ENV !== "production";
  const adminDiagnostics = includeDebug ? getFirebaseAdminDiagnostics() : null;

  try {
    const snapshot = await getFirebaseAdminDb().collection(CURATED_VIDEOS_COLLECTION).get();
    const rejectedDocs: CuratedVideoDiagnostics["rejectedDocs"] = [];

    const items = sortCuratedVideos(
      snapshot.docs
        .map((item) => mapCuratedVideoData(item.data() as Partial<CuratedVideoItem>, item.id, rejectedDocs))
        .filter((item): item is CuratedVideoItem => Boolean(item))
    );

    const diagnostics = buildDiagnostics(items, snapshot.size, rejectedDocs);

    return NextResponse.json({
      items,
      source: diagnostics.source,
      message: items.length ? undefined : "No curated videos have been published yet.",
      ...(includeDebug ? { diagnostics, adminDiagnostics } : {})
    });
  } catch (error) {
    const diagnostics = buildDiagnostics([], 0, [], error instanceof Error ? error.message : "Unable to read curated videos.");
    console.error("[api/curated-videos] admin read failed", {
      ...(adminDiagnostics ?? getFirebaseAdminDiagnostics()),
      error: diagnostics.error
    });

    return NextResponse.json(
      {
        items: [],
        source: "error",
        message: "Unable to load curated videos right now.",
        ...(includeDebug ? { diagnostics, adminDiagnostics } : {})
      },
      { status: 200 }
    );
  }
}
