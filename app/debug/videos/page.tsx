"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/ui/empty-state";
import {
  getCuratedVideoDebugSnapshot,
  selectHomepageVideoHighlights
} from "@/services/curated-video-service";

type DebugState = Awaited<ReturnType<typeof getCuratedVideoDebugSnapshot>> | null;

export default function DebugVideosPage() {
  const [snapshot, setSnapshot] = useState<DebugState>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        const nextSnapshot = await getCuratedVideoDebugSnapshot();
        if (!isMounted) {
          return;
        }

        setSnapshot(nextSnapshot);
      } catch (nextError) {
        if (!isMounted) {
          return;
        }

        setError(nextError instanceof Error ? nextError.message : "Failed to load debug snapshot.");
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  if (error) {
    return (
      <AppShell>
        <EmptyState title="Video debug failed" description={error} />
      </AppShell>
    );
  }

  if (!snapshot) {
    return (
      <AppShell>
        <div className="rounded-[28px] border border-brand-100 bg-white/96 p-6 text-sm text-stone-500 shadow-soft">
          Loading curated video debug snapshot...
        </div>
      </AppShell>
    );
  }

  const homepageSelection = selectHomepageVideoHighlights(snapshot.items, 6);

  return (
    <AppShell>
      <div className="space-y-5">
        <section className="rounded-[30px] border border-brand-100 bg-white/96 p-5 shadow-soft">
          <h1 className="text-2xl font-black tracking-tight text-ink">Curated video debug</h1>
          <p className="mt-2 text-sm text-stone-600">
            This page shows the exact curated video payload the public app can see from Firestore.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[22px] bg-brand-50/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Source</p>
              <p className="mt-2 text-sm font-bold text-ink">{snapshot.source}</p>
            </div>
            <div className="rounded-[22px] bg-brand-50/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Total docs</p>
              <p className="mt-2 text-sm font-bold text-ink">{snapshot.totalDocs}</p>
            </div>
            <div className="rounded-[22px] bg-brand-50/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Mapped docs</p>
              <p className="mt-2 text-sm font-bold text-ink">{snapshot.mappedDocs}</p>
            </div>
            <div className="rounded-[22px] bg-brand-50/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Firebase configured</p>
              <p className="mt-2 text-sm font-bold text-ink">{String(snapshot.isFirebaseConfigured)}</p>
            </div>
          </div>
          {snapshot.error ? (
            <p className="mt-4 rounded-[20px] bg-red-50 px-4 py-3 text-sm text-red-700">{snapshot.error}</p>
          ) : null}
        </section>

        <section className="rounded-[30px] border border-brand-100 bg-white/96 p-5 shadow-soft">
          <h2 className="text-lg font-black tracking-tight text-ink">Homepage selection</h2>
          <p className="mt-2 text-sm text-stone-600">
            Hero plus supporting cards exactly as the public homepage selection logic sees them.
          </p>
          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div className="rounded-[24px] bg-brand-50/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Hero</p>
              {homepageSelection.hero ? (
                <div className="mt-3 space-y-1 text-sm text-stone-700">
                  <p className="font-bold text-ink">{homepageSelection.hero.title}</p>
                  <p>ID: {homepageSelection.hero.id}</p>
                  <p>Featured: {String(Boolean(homepageSelection.hero.featured))}</p>
                  <p>Created: {homepageSelection.hero.createdAt}</p>
                </div>
              ) : (
                <p className="mt-3 text-sm text-stone-500">No hero selected.</p>
              )}
            </div>
            <div className="rounded-[24px] bg-white p-4 ring-1 ring-brand-100">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Supporting IDs</p>
              <div className="mt-3 space-y-2 text-sm text-stone-700">
                {homepageSelection.supporting.length ? (
                  homepageSelection.supporting.map((item) => (
                    <div key={item.id} className="rounded-[18px] bg-brand-50/40 px-3 py-2">
                      <p className="font-semibold text-ink">{item.title}</p>
                      <p>{item.id}</p>
                      <p>Featured: {String(Boolean(item.featured))}</p>
                      <p>Created: {item.createdAt}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-stone-500">No supporting videos selected.</p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[30px] border border-brand-100 bg-white/96 p-5 shadow-soft">
          <h2 className="text-lg font-black tracking-tight text-ink">Rejected documents</h2>
          <div className="mt-4 space-y-3 text-sm text-stone-700">
            {snapshot.rejectedDocs.length ? (
              snapshot.rejectedDocs.map((item) => (
                <div key={item.id} className="rounded-[20px] bg-orange-50/80 px-4 py-3">
                  <p className="font-bold text-ink">{item.title ?? item.id}</p>
                  <p className="mt-1">Reasons: {item.reasons.join(", ")}</p>
                </div>
              ))
            ) : (
              <p className="text-stone-500">No curated video documents were rejected by the public mapper.</p>
            )}
          </div>
        </section>

        <section className="rounded-[30px] border border-brand-100 bg-white/96 p-5 shadow-soft">
          <h2 className="text-lg font-black tracking-tight text-ink">All public items</h2>
          <div className="mt-4 space-y-3 text-sm text-stone-700">
            {snapshot.items.length ? (
              snapshot.items.map((item) => (
                <div key={item.id} className="rounded-[20px] bg-brand-50/40 px-4 py-3">
                  <p className="font-bold text-ink">{item.title}</p>
                  <p>ID: {item.id}</p>
                  <p>Category: {item.category}</p>
                  <p>Featured: {String(Boolean(item.featured))}</p>
                  <p>Created: {item.createdAt}</p>
                  <p>Team: {item.teamTag ?? "none"}</p>
                </div>
              ))
            ) : (
              <p className="text-stone-500">No curated videos are visible to the public app.</p>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
