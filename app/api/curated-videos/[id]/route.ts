import { NextResponse } from "next/server";
import { mapCuratedVideoData } from "@/lib/curated-video-utils";
import { getFirebaseAdminDb, getFirebaseAdminDiagnostics } from "@/lib/firebase-admin";
import { CuratedVideoItem } from "@/types";

const CURATED_VIDEOS_COLLECTION = "curatedVideos";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const snapshot = await getFirebaseAdminDb()
      .collection(CURATED_VIDEOS_COLLECTION)
      .doc(params.id)
      .get();

    if (!snapshot.exists) {
      return NextResponse.json(
        {
          items: [],
          source: "empty",
          message: "This curated video could not be found."
        },
        { status: 404 }
      );
    }

    const item = mapCuratedVideoData(
      snapshot.data() as Partial<CuratedVideoItem>,
      snapshot.id
    );

    return NextResponse.json({
      items: item ? [item] : [],
      source: item ? "firestore" : "empty",
      message: item ? undefined : "This curated video document is missing required fields."
    });
  } catch (error) {
    console.error("[api/curated-videos/:id] admin read failed", {
      ...getFirebaseAdminDiagnostics(),
      id: params.id,
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return NextResponse.json(
      {
        items: [],
        source: "error",
        message: "Unable to load this curated video right now."
      },
      { status: 200 }
    );
  }
}
