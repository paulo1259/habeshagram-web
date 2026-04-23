import "server-only";

import { NextResponse } from "next/server";
import { DecodedIdToken } from "firebase-admin/auth";
import { getFirebaseAdminAuth } from "@/lib/firebase-admin";

class AdminAccessError extends Error {
  status: number;

  constructor(message: string, status = 403) {
    super(message);
    this.status = status;
  }
}

function parseAllowlist(value?: string) {
  return value
    ?.split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean) ?? [];
}

function getAdminEmailAllowlist() {
  return parseAllowlist(process.env.ADMIN_EMAIL_ALLOWLIST ?? process.env.NEXT_PUBLIC_ADMIN_EMAILS);
}

function getAdminUidAllowlist() {
  return parseAllowlist(process.env.ADMIN_UID_ALLOWLIST ?? process.env.NEXT_PUBLIC_ADMIN_UIDS);
}

function readBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";

  if (!authorization.startsWith("Bearer ")) {
    throw new AdminAccessError("Sign in is required to use the admin tools.", 401);
  }

  return authorization.slice("Bearer ".length).trim();
}

function assertAdmin(decodedToken: DecodedIdToken) {
  const emailAllowlist = getAdminEmailAllowlist();
  const uidAllowlist = getAdminUidAllowlist();

  if (!emailAllowlist.length && !uidAllowlist.length) {
    throw new AdminAccessError(
      "Admin access has not been configured on the server yet.",
      503
    );
  }

  const email = decodedToken.email?.toLowerCase().trim();
  const uid = decodedToken.uid.toLowerCase().trim();

  if (uidAllowlist.includes(uid) || (email ? emailAllowlist.includes(email) : false)) {
    return;
  }

  throw new AdminAccessError("You do not have access to the admin tools.", 403);
}

export async function requireAdminRequest(request: Request) {
  try {
    const token = readBearerToken(request);
    const decodedToken = await getFirebaseAdminAuth().verifyIdToken(token);
    assertAdmin(decodedToken);

    return {
      uid: decodedToken.uid,
      email: decodedToken.email ?? null
    };
  } catch (error) {
    if (error instanceof AdminAccessError) {
      throw error;
    }

    throw new AdminAccessError(
      error instanceof Error
        ? `Admin verification failed. ${error.message}`
        : "Admin verification failed.",
      503
    );
  }
}

export function createAdminErrorResponse(error: unknown) {
  if (error instanceof AdminAccessError) {
    return NextResponse.json({ message: error.message }, { status: error.status });
  }

  return NextResponse.json(
    { message: error instanceof Error ? error.message : "The admin request failed." },
    { status: 500 }
  );
}
