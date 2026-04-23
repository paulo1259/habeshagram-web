"use client";

import { AdminContentItemMap, AdminContentKind } from "@/lib/admin-content";
import { getAdminIdToken } from "@/services/admin-auth-client";

type AdminSessionPayload = {
  uid: string;
  email: string | null;
};

type ListResponse<K extends AdminContentKind> = {
  items: AdminContentItemMap[K][];
  message?: string;
};

type SaveResponse<K extends AdminContentKind> = {
  item: AdminContentItemMap[K];
  message?: string;
};

async function requestAdmin<T>(path: string, init?: RequestInit) {
  const token = await getAdminIdToken();
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  const payload = (await response.json().catch(() => ({}))) as { message?: string } & T;

  if (!response.ok) {
    throw new Error(payload.message || "The admin request failed.");
  }

  return payload;
}

export async function verifyAdminSession() {
  return requestAdmin<AdminSessionPayload>("/api/admin/session", { method: "GET" });
}

export async function listAdminItems<K extends AdminContentKind>(kind: K) {
  return requestAdmin<ListResponse<K>>(`/api/admin/${kind}`, {
    method: "GET"
  });
}

export async function saveAdminItem<K extends AdminContentKind>(
  kind: K,
  item: Partial<AdminContentItemMap[K]>
) {
  return requestAdmin<SaveResponse<K>>(`/api/admin/${kind}`, {
    method: "POST",
    body: JSON.stringify(item)
  });
}

export async function deleteAdminItem(kind: AdminContentKind, id: string) {
  return requestAdmin<{ message: string }>(`/api/admin/${kind}/${id}`, {
    method: "DELETE"
  });
}
