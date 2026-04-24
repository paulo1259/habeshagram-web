import "server-only";

import { cert, getApps, initializeApp, type App, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let cachedApp: App | null = null;
let cachedServiceAccount: ServiceAccount | null = null;

function getServiceAccount(): ServiceAccount {
  if (cachedServiceAccount) {
    return cachedServiceAccount;
  }

  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64?.trim();

  if (!encoded) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 is required for server-side admin workflows."
    );
  }

  try {
    const decoded = Buffer.from(encoded, "base64").toString("utf8");
    const parsed = JSON.parse(decoded) as ServiceAccount;

    cachedServiceAccount = {
      projectId: parsed.projectId ?? (parsed as { project_id?: string }).project_id,
      clientEmail: parsed.clientEmail ?? (parsed as { client_email?: string }).client_email,
      privateKey: (
        parsed.privateKey ?? (parsed as { private_key?: string }).private_key ?? ""
      ).replace(/\\n/g, "\n")
    };

    return cachedServiceAccount;
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `Could not decode FIREBASE_SERVICE_ACCOUNT_KEY_BASE64. ${error.message}`
        : "Could not decode FIREBASE_SERVICE_ACCOUNT_KEY_BASE64."
    );
  }
}

export function getFirebaseAdminDiagnostics() {
  const serviceAccount = getServiceAccount();
  const envProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  const projectId = serviceAccount.projectId ?? envProjectId ?? null;

  return {
    projectId,
    envProjectId: envProjectId ?? null,
    clientEmail: serviceAccount.clientEmail ?? null,
    appCount: getApps().length
  };
}

export function getFirebaseAdminApp() {
  if (cachedApp) {
    return cachedApp;
  }

  const serviceAccount = getServiceAccount();
  const projectId = serviceAccount.projectId ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();

  cachedApp =
    getApps()[0] ??
    initializeApp({
      credential: cert(serviceAccount),
      ...(projectId ? { projectId } : {})
    });

  return cachedApp;
}

export function getFirebaseAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}

export function getFirebaseAdminDb() {
  return getFirestore(getFirebaseAdminApp());
}
