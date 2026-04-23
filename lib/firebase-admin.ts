import "server-only";

import { cert, getApps, initializeApp, type App, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let cachedApp: App | null = null;

function getServiceAccount(): ServiceAccount {
  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64?.trim();

  if (!encoded) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 is required for server-side admin workflows."
    );
  }

  try {
    const decoded = Buffer.from(encoded, "base64").toString("utf8");
    const parsed = JSON.parse(decoded) as ServiceAccount;

    return {
      projectId: parsed.projectId ?? (parsed as { project_id?: string }).project_id,
      clientEmail: parsed.clientEmail ?? (parsed as { client_email?: string }).client_email,
      privateKey: (
        parsed.privateKey ?? (parsed as { private_key?: string }).private_key ?? ""
      ).replace(/\\n/g, "\n")
    };
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Could not decode FIREBASE_SERVICE_ACCOUNT_KEY_BASE64. ${error.message}`
        : "Could not decode FIREBASE_SERVICE_ACCOUNT_KEY_BASE64."
    );
  }
}

export function getFirebaseAdminApp() {
  if (cachedApp) {
    return cachedApp;
  }

  cachedApp =
    getApps()[0] ??
    initializeApp({
      credential: cert(getServiceAccount())
    });

  return cachedApp;
}

export function getFirebaseAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}

export function getFirebaseAdminDb() {
  return getFirestore(getFirebaseAdminApp());
}
