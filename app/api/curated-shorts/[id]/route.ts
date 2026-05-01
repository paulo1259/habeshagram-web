import { NextResponse } from "next/server";
import { mapCuratedShortData } from "@/lib/curated-short-utils";
import { getFirebaseAdminDb, getFirebaseAdminDiagnostics } from "@/lib/firebase-admin";
import { CuratedShortItem } from "@/types";

const CURATED_SHORTS_COLLECTION = "curatedShorts";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const snapshot = await getFirebaseAdminDb()
      .collection(CURATED_SHORTS_COLLECTION)
      .doc(params.id)
      .get();

    if (!snapshot.exists) {
      return NextResponse.json(
        {
          items: [],
          source: "empty",
          message: "This curated short could not be found."
        },
        { status: 404 }
      );
    }

    const item = mapCuratedShortData(snapshot.data() as Partial<CuratedShortItem>, snapshot.id);

    return NextResponse.json({
      items: item ? [item] : [],
      source: item ? "firestore" : "empty",
      message: item ? undefined : "This curated short document is missing required fields."
    });
  } catch (error) {
    console.error("[api/curated-shorts/:id] admin read failed", {
      ...getFirebaseAdminDiagnostics(),
      id: params.id,
      error: error instanceof Error ? error.message : "Unknown error"
    });

    return NextResponse.json(
      {
        items: [],
        source: "error",
        message: "Unable to load this curated short right now."
      },
      { status: 200 }
    );
  }
}
