"use client";

import Link from "next/link";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AppShell } from "@/components/layout/app-shell";
import { CreatePostForm } from "@/components/posts/create-post-form";
import { useAppData } from "@/hooks/use-app-data";

export default function CreatePage() {
  const { currentUser } = useAppData();

  return (
    <AppShell>
      <AuthGuard>
        <div className="space-y-4">
          <section className="rounded-3xl border border-brand-100 bg-white/95 p-4 shadow-soft sm:p-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Create</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-ink">Start a new post</h1>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Text is required. Adding an image is optional. New posts are saved to Firebase
              Firestore, selected images are uploaded to Firebase Storage, and optional football
              team tags can send the post straight into the matching fan zone.
            </p>
            {!currentUser ? (
              <p className="mt-4 text-sm text-brand-800">
                You are not logged in.{" "}
                <Link href="/login" className="font-semibold underline">
                  Go to login
                </Link>
              </p>
            ) : null}
          </section>

          <CreatePostForm />
        </div>
      </AuthGuard>
    </AppShell>
  );
}
