import { NextResponse } from "next/server";
import { createAdminErrorResponse, requireAdminRequest } from "@/lib/admin-server";
import { getFirebaseAdminDb } from "@/lib/firebase-admin";
import { PostReport, PostReportStatus } from "@/types";

export const dynamic = "force-dynamic";

const allowedStatuses = new Set<PostReportStatus>([
  "open",
  "reviewed",
  "dismissed",
  "escalated"
]);

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminRequest(request);

    const payload = (await request.json()) as { status?: PostReportStatus };
    const nextStatus = payload.status;

    if (!nextStatus || !allowedStatuses.has(nextStatus)) {
      return NextResponse.json({ message: "Invalid report status." }, { status: 400 });
    }

    const ref = getFirebaseAdminDb().collection("reports").doc(params.id);
    const snapshot = await ref.get();

    if (!snapshot.exists) {
      return NextResponse.json({ message: "Report not found." }, { status: 404 });
    }

    await ref.set({ status: nextStatus }, { merge: true });

    const nextSnapshot = await ref.get();
    const report = { id: nextSnapshot.id, ...nextSnapshot.data() } as PostReport;

    return NextResponse.json({
      report,
      message: `Report marked as ${nextStatus}.`
    });
  } catch (error) {
    return createAdminErrorResponse(error);
  }
}
