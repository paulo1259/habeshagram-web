import { NextResponse } from "next/server";
import { createAdminErrorResponse, requireAdminRequest } from "@/lib/admin-server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const admin = await requireAdminRequest(request);
    return NextResponse.json(admin);
  } catch (error) {
    return createAdminErrorResponse(error);
  }
}
