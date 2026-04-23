import { NextResponse } from "next/server";
import { ADMIN_CONTENT_COLLECTIONS, isAdminContentKind } from "@/lib/admin-content";
import { createAdminErrorResponse, requireAdminRequest } from "@/lib/admin-server";
import { getFirebaseAdminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  { params }: { params: { kind: string; id: string } }
) {
  try {
    await requireAdminRequest(request);

    if (!isAdminContentKind(params.kind)) {
      return NextResponse.json({ message: "Unknown admin collection." }, { status: 404 });
    }

    await getFirebaseAdminDb()
      .collection(ADMIN_CONTENT_COLLECTIONS[params.kind])
      .doc(params.id)
      .delete();

    return NextResponse.json({
      message: `Deleted ${params.kind === "videos" ? "video" : params.kind === "debates" ? "debate" : "editorial highlight"} successfully.`
    });
  } catch (error) {
    return createAdminErrorResponse(error);
  }
}
