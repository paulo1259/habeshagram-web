"use client";

import { AdminLayout } from "@/components/admin/admin-layout";
import { AdminShortsManager } from "@/components/admin/admin-shorts-manager";

export default function AdminShortsPage() {
  return (
    <AdminLayout
      title="Curated Shorts"
      description="Manage the dedicated short-form feed behind /shorts with a simpler upload-first workflow that stays separate from long-form Videos."
    >
      <AdminShortsManager />
    </AdminLayout>
  );
}
