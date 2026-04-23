"use client";

import { PostReport, PostReportStatus } from "@/types";
import { getAdminIdToken } from "@/services/admin-auth-client";

type ReportsResponse = {
  reports: PostReport[];
  message?: string;
};

type ReportUpdateResponse = {
  report: PostReport;
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
    throw new Error(payload.message || "The moderation request failed.");
  }

  return payload;
}

export async function listAdminReports() {
  return requestAdmin<ReportsResponse>("/api/admin/reports", { method: "GET" });
}

export async function updateAdminReportStatus(id: string, status: PostReportStatus) {
  return requestAdmin<ReportUpdateResponse>(`/api/admin/reports/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
}
