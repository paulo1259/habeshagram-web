import { NextResponse } from "next/server";
import {
  mapCuratedShortData,
  sortCuratedShorts,
  type CuratedShortDiagnostics
} from "@/lib/curated-short-utils";
import { getFirebaseAdminDb, getFirebaseAdminDiagnostics } from "@/lib/firebase-admin";
import { CuratedShortItem } from "@/types";

const CURATED_SHORTS_COLLECTION = "curatedShorts";

export const dynamic = "force-dynamic";

function buildDiagnostics(
  items: CuratedShortItem[],
  totalDocs: number,
  rejectedDocs: CuratedShortDiagnostics["rejectedDocs"],
  error?: string
): CuratedShortDiagnostics {
  return {
    source: error ? "error" : items.length ? "firestore" : "empty",
    collection: CURATED_SHORTS_COLLECTION,
    totalDocs,
    mappedDocs: items.length,
    rejectedDocs,
    items,
    returnedItems: items.map((item) => ({
      id: item.id,
      title: item.title,
      featured: Boolean(item.featured),
      createdAt: item.createdAt,
      vertical: item.vertical
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
    const snapshot = await getFirebaseAdminDb().collection(CURATED_SHORTS_COLLECTION).get();
    const rejectedDocs: CuratedShortDiagnostics["rejectedDocs"] = [];

    const items = sortCuratedShorts(
      snapshot.docs
        .map((item) => mapCuratedShortData(item.data() as Partial<CuratedShortItem>, item.id, rejectedDocs))
        .filter((item): item is CuratedShortItem => Boolean(item))
    );

    const diagnostics = buildDiagnostics(items, snapshot.size, rejectedDocs);

    return NextResponse.json({
      items,
      source: diagnostics.source,
      message: items.length ? undefined : "No curated shorts have been published yet.",
      ...(includeDebug ? { diagnostics, adminDiagnostics } : {})
    });
  } catch (error) {
    const diagnostics = buildDiagnostics(
      [],
      0,
      [],
      error instanceof Error ? error.message : "Unable to read curated shorts."
    );
    console.error("[api/curated-shorts] admin read failed", {
      ...(adminDiagnostics ?? getFirebaseAdminDiagnostics()),
      error: diagnostics.error
    });

    return NextResponse.json(
      {
        items: [],
        source: "error",
        message: "Unable to load curated shorts right now.",
        ...(includeDebug ? { diagnostics, adminDiagnostics } : {})
      },
      { status: 200 }
    );
  }
}
