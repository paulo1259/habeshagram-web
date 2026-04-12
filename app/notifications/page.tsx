"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AppShell } from "@/components/layout/app-shell";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { useAppData } from "@/hooks/use-app-data";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead
} from "@/services/notification-service";
import { formatDate } from "@/lib/utils";
import { NotificationItem } from "@/types";

function getNotificationHref(notification: NotificationItem) {
  if (notification.type === "follow") {
    return `/profile/${notification.actorUserId}`;
  }

  return "/";
}

export default function NotificationsPage() {
  const { currentUser, isReady, refreshUnreadNotificationCount } = useAppData();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    void (async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");
        const items = await getNotifications(currentUser.id);
        if (!isMounted) {
          return;
        }

        setNotifications(items);
        await markAllNotificationsRead(currentUser.id);
        await refreshUnreadNotificationCount();
        if (isMounted) {
          setNotifications((currentItems) =>
            currentItems.map((item) => ({ ...item, isRead: true }))
          );
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error ? error.message : "Unable to load notifications right now."
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
  }, [currentUser, refreshUnreadNotificationCount]);

  async function handleNotificationClick(notification: NotificationItem) {
    if (!currentUser || notification.isRead) {
      return;
    }

    try {
      await markNotificationRead(currentUser.id, notification.id);
      await refreshUnreadNotificationCount();
      setNotifications((currentItems) =>
        currentItems.map((item) =>
          item.id === notification.id ? { ...item, isRead: true } : item
        )
      );
    } catch {
      // Keep the page usable even if the read-state update fails.
    }
  }

  return (
    <AppShell>
      <AuthGuard>
        <div className="space-y-4">
          <section className="glass-card rounded-[30px] border border-brand-100/80 p-4 shadow-soft sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-700">
              Notifications
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-ink">Your social activity</h1>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Likes, comments, and follows show up here so HabeshaGram feels more alive.
            </p>
          </section>

          {errorMessage ? (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>
          ) : null}

          {isLoading ? (
            <div className="glass-card rounded-[30px] border border-brand-100/80 p-5 shadow-soft">
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-[24px] bg-brand-50/45 px-3 py-3">
                    <div className="h-11 w-11 animate-pulse rounded-full bg-brand-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/5 animate-pulse rounded-full bg-brand-100" />
                      <div className="h-3.5 w-1/4 animate-pulse rounded-full bg-brand-100" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : notifications.length ? (
            <section className="overflow-hidden rounded-[30px] border border-brand-100/80 bg-white/96 shadow-soft">
              {notifications.map((notification) => (
                <Link
                  key={notification.id}
                  href={getNotificationHref(notification)}
                  className={`flex items-start gap-3 border-b border-brand-100/70 px-4 py-4 transition duration-200 last:border-b-0 hover:bg-brand-50/40 ${
                    notification.isRead ? "bg-white" : "bg-brand-50/25"
                  }`}
                  onClick={() => void handleNotificationClick(notification)}
                >
                  <Avatar
                    username={notification.actorUsername}
                    imageURL={notification.actorProfileImageURL}
                    className="h-11 w-11"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-6 text-stone-700">
                      <span className="font-semibold text-ink">@{notification.actorUsername}</span>{" "}
                      {notification.message}
                    </p>
                    <p className="mt-1 text-xs text-stone-500">{formatDate(notification.createdAt)}</p>
                  </div>
                  {!notification.isRead ? (
                    <span className="mt-2 h-2.5 w-2.5 rounded-full bg-brand-500" />
                  ) : null}
                </Link>
              ))}
            </section>
          ) : (
            <EmptyState
              title="No notifications yet"
              description="When people like, comment, or follow, their activity will show up here."
            />
          )}
        </div>
      </AuthGuard>
    </AppShell>
  );
}
