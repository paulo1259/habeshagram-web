import { NextResponse } from "next/server";
import {
  ADMIN_CONTENT_COLLECTIONS,
  isAdminContentKind,
  sanitizeAdminItem,
  sortAdminItems
} from "@/lib/admin-content";
import { createAdminErrorResponse, requireAdminRequest } from "@/lib/admin-server";
import { getFirebaseAdminDb } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

function getKindLabel(kind: string) {
  if (kind === "videos") {
    return "video";
  }

  if (kind === "debates") {
    return "debate";
  }

  return "editorial highlight";
}

export async function GET(
  request: Request,
  { params }: { params: { kind: string } }
) {
  try {
    await requireAdminRequest(request);

    if (!isAdminContentKind(params.kind)) {
      return NextResponse.json({ message: "Unknown admin collection." }, { status: 404 });
    }

    const snapshot = await getFirebaseAdminDb()
      .collection(ADMIN_CONTENT_COLLECTIONS[params.kind])
      .get();

    const items = sortAdminItems(
      snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Array<{
        id: string;
        createdAt?: string;
        featured?: boolean;
      }>
    );

    return NextResponse.json({
      items,
      message: items.length ? undefined : "No items have been added here yet."
    });
  } catch (error) {
    return createAdminErrorResponse(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: { kind: string } }
) {
  try {
    await requireAdminRequest(request);

    if (!isAdminContentKind(params.kind)) {
      return NextResponse.json({ message: "Unknown admin collection." }, { status: 404 });
    }

    const payload = sanitizeAdminItem(params.kind, await request.json());
    await getFirebaseAdminDb()
      .collection(ADMIN_CONTENT_COLLECTIONS[params.kind])
      .doc(payload.id)
      .set(payload, { merge: true });

    return NextResponse.json({
      item: payload,
      message: `Saved ${getKindLabel(params.kind)} successfully.`
    });
  } catch (error) {
    return createAdminErrorResponse(error);
  }
}
