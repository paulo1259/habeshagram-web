import { NextResponse } from "next/server";
import { createAdminErrorResponse, requireAdminRequest } from "@/lib/admin-server";
import { getFirebaseAdminDb } from "@/lib/firebase-admin";
import { PostReport } from "@/types";

export const dynamic = "force-dynamic";

function sortReports(items: PostReport[]) {
  return [...items].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export async function GET(request: Request) {
  try {
    await requireAdminRequest(request);

    const snapshot = await getFirebaseAdminDb().collection("reports").get();
    const reports = sortReports(
      snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as PostReport[]
    );

    return NextResponse.json({
      reports,
      message: reports.length ? undefined : "No moderation reports are waiting right now."
    });
  } catch (error) {
    return createAdminErrorResponse(error);
  }
}
