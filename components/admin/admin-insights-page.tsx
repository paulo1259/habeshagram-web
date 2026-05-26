"use client";

import { type ReactNode, useEffect, useState } from "react";
import { collection, getDocs, query, Timestamp, where } from "firebase/firestore";
import { BarChart2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { SectionHeader } from "@/components/ui/section-header";
import { firebaseDb } from "@/lib/firebase";

// ── Types ─────────────────────────────────────────────────────────────────────

type AnalyticsEventName =
  | "app_open" | "home_view" | "reels_open" | "reel_play" | "reel_like"
  | "radio_play" | "mma_hub_open" | "world_cup_hub_open" | "live_room_join"
  | "post_create" | "comment_create" | "follow_user" | "search_use";

type Platform = "ios" | "android" | "web";

interface AnalyticsEvent {
  event: AnalyticsEventName;
  timestamp: Timestamp;
  platform: Platform;
  userId?: string;
  metadata?: {
    reelId?: string;
    roomId?: string;
    matchId?: string;
    teamId?: string;
  };
}

interface InsightsData {
  totalEvents: number;
  windowDays: number;
  byEvent: Array<{ name: string; count: number }>;
  byPlatform: Array<{ platform: string; count: number }>;
  topReels: Array<{ reelId: string; plays: number }>;
  topRooms: Array<{ roomId: string; joins: number }>;
  topTeams: Array<{ teamId: string; count: number }>;
  uniqueUsers: number;
}

const WINDOW_DAYS = 7;

const EVENT_LABELS: Record<string, string> = {
  app_open: "App Open",
  home_view: "Home View",
  reels_open: "Reels Opened",
  reel_play: "Reel Plays",
  reel_like: "Reel Likes",
  radio_play: "Radio Plays",
  mma_hub_open: "MMA Hub Opens",
  world_cup_hub_open: "World Cup Hub Opens",
  live_room_join: "Live Room Joins",
  post_create: "Posts Created",
  comment_create: "Comments Created",
  follow_user: "Follows",
  search_use: "Searches",
};

// ── Fetcher ───────────────────────────────────────────────────────────────────

async function fetchInsights(): Promise<InsightsData> {
  if (!firebaseDb) {
    throw new Error("Firebase is not configured.");
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - WINDOW_DAYS);
  const cutoffTs = Timestamp.fromDate(cutoff);

  const q = query(
    collection(firebaseDb, "analyticsEvents"),
    where("timestamp", ">=", cutoffTs)
  );

  const snap = await getDocs(q);
  const docs = snap.docs.map((d) => d.data() as AnalyticsEvent);

  const byEventMap: Record<string, number> = {};
  const byPlatformMap: Record<string, number> = {};
  const reelPlayMap: Record<string, number> = {};
  const roomJoinMap: Record<string, number> = {};
  const teamMap: Record<string, number> = {};
  const userSet = new Set<string>();

  for (const doc of docs) {
    // by event
    byEventMap[doc.event] = (byEventMap[doc.event] ?? 0) + 1;

    // by platform
    const plat = doc.platform ?? "unknown";
    byPlatformMap[plat] = (byPlatformMap[plat] ?? 0) + 1;

    // unique users
    if (doc.userId) userSet.add(doc.userId);

    // top reels
    if (doc.event === "reel_play" && doc.metadata?.reelId) {
      reelPlayMap[doc.metadata.reelId] = (reelPlayMap[doc.metadata.reelId] ?? 0) + 1;
    }

    // top rooms
    if (doc.event === "live_room_join" && doc.metadata?.roomId) {
      roomJoinMap[doc.metadata.roomId] = (roomJoinMap[doc.metadata.roomId] ?? 0) + 1;
    }

    // top teams
    if (doc.metadata?.teamId) {
      teamMap[doc.metadata.teamId] = (teamMap[doc.metadata.teamId] ?? 0) + 1;
    }
  }

  const sortedDesc = (map: Record<string, number>) =>
    Object.entries(map).sort((a, b) => b[1] - a[1]);

  const byEvent = sortedDesc(byEventMap).map(([name, count]) => ({ name, count }));
  const byPlatform = sortedDesc(byPlatformMap).map(([platform, count]) => ({ platform, count }));
  const topReels = sortedDesc(reelPlayMap)
    .slice(0, 5)
    .map(([reelId, plays]) => ({ reelId, plays }));
  const topRooms = sortedDesc(roomJoinMap)
    .slice(0, 5)
    .map(([roomId, joins]) => ({ roomId, joins }));
  const topTeams = sortedDesc(teamMap)
    .slice(0, 5)
    .map(([teamId, count]) => ({ teamId, count }));

  return {
    totalEvents: docs.length,
    windowDays: WINDOW_DAYS,
    byEvent,
    byPlatform,
    topReels,
    topRooms,
    topTeams,
    uniqueUsers: userSet.size,
  };
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[24px] border border-brand-100 bg-white/96 p-5 shadow-soft">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">
        {label}
      </p>
      <p className="mt-2 text-4xl font-black tabular-nums tracking-tight text-ink">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </div>
  );
}

function BarRow({
  label,
  count,
  max,
}: {
  label: string;
  count: number;
  max: number;
}) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;

  return (
    <div className="flex items-center gap-3">
      <span className="w-40 shrink-0 text-sm text-stone-600 truncate">{label}</span>
      <div className="flex-1 overflow-hidden rounded-full bg-brand-50">
        <div
          className="h-2.5 rounded-full bg-gradient-to-r from-brand-500 to-orange-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-12 shrink-0 text-right text-sm font-semibold tabular-nums text-ink">
        {count.toLocaleString()}
      </span>
    </div>
  );
}

function InsightCard({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-brand-100 bg-white/96 p-5 shadow-soft">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">
        {eyebrow}
      </p>
      <h2 className="mt-1 text-xl font-black tracking-tight text-ink">{title}</h2>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function AdminInsightsPage() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      try {
        setIsLoading(true);
        setError(null);
        const insights = await fetchInsights();
        if (isMounted) {
          setData(insights);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not load analytics insights right now."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <AdminLayout
      title="Product Insights"
      description={`Live usage signals from the last 7 days — no message content, audio, or location data collected. Events are written to Firestore analyticsEvents by the app and mobile clients.`}
    >
      {isLoading ? (
        <section className="rounded-[28px] border border-brand-100 bg-white/96 p-6 shadow-soft">
          <p className="text-sm text-stone-500">Loading analytics data…</p>
        </section>
      ) : error ? (
        <section className="rounded-[28px] border border-red-100 bg-red-50 p-6 shadow-soft">
          <p className="text-sm font-semibold text-red-700">{error}</p>
          <p className="mt-1 text-sm text-red-600">
            Make sure Firestore is configured and you have read access to the analyticsEvents
            collection.
          </p>
        </section>
      ) : data ? (
        <div className="space-y-5">
          {/* Top-line stats */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label={`Events (${data.windowDays}d)`} value={data.totalEvents} />
            <StatCard label="Unique Users" value={data.uniqueUsers} />
            <StatCard
              label="Event Types"
              value={data.byEvent.length}
            />
            <StatCard
              label="Platforms"
              value={data.byPlatform.map((p) => p.platform).join(" · ") || "—"}
            />
          </div>

          {/* Event breakdown */}
          {data.byEvent.length > 0 && (
            <InsightCard eyebrow="Usage" title="Events by type">
              {data.byEvent.map(({ name, count }) => (
                <BarRow
                  key={name}
                  label={EVENT_LABELS[name] ?? name}
                  count={count}
                  max={data.byEvent[0].count}
                />
              ))}
            </InsightCard>
          )}

          {/* Platform split */}
          {data.byPlatform.length > 0 && (
            <InsightCard eyebrow="Reach" title="Events by platform">
              {data.byPlatform.map(({ platform, count }) => (
                <BarRow
                  key={platform}
                  label={platform.charAt(0).toUpperCase() + platform.slice(1)}
                  count={count}
                  max={data.byPlatform[0].count}
                />
              ))}
            </InsightCard>
          )}

          {/* Top reels */}
          {data.topReels.length > 0 && (
            <InsightCard eyebrow="Content" title="Top reels by plays">
              {data.topReels.map(({ reelId, plays }) => (
                <BarRow
                  key={reelId}
                  label={reelId}
                  count={plays}
                  max={data.topReels[0].plays}
                />
              ))}
            </InsightCard>
          )}

          {/* Top live rooms */}
          {data.topRooms.length > 0 && (
            <InsightCard eyebrow="Community" title="Top live rooms by joins">
              {data.topRooms.map(({ roomId, joins }) => (
                <BarRow
                  key={roomId}
                  label={roomId}
                  count={joins}
                  max={data.topRooms[0].joins}
                />
              ))}
            </InsightCard>
          )}

          {/* Top World Cup teams */}
          {data.topTeams.length > 0 && (
            <InsightCard eyebrow="World Cup" title="Top teams by fan activity">
              {data.topTeams.map(({ teamId, count }) => (
                <BarRow
                  key={teamId}
                  label={teamId}
                  count={count}
                  max={data.topTeams[0].count}
                />
              ))}
            </InsightCard>
          )}

          {data.totalEvents === 0 && (
            <section className="rounded-[28px] border border-brand-100 bg-white/96 p-6 shadow-soft">
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <BarChart2 className="h-8 w-8 text-brand-300" />
                <p className="text-lg font-black tracking-tight text-ink">No events yet</p>
                <p className="max-w-sm text-sm leading-6 text-stone-500">
                  Analytics events will appear here once the app and web clients start writing to
                  the Firestore analyticsEvents collection.
                </p>
              </div>
            </section>
          )}
        </div>
      ) : null}
    </AdminLayout>
  );
}
