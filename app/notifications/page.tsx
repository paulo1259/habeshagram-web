"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Bell, Heart, MessageCircle, UserPlus } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { formatRelativeTime } from "@/lib/utils";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AppShell } from "@/components/layout/app-shell";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { useAppData } from "@/hooks/use-app-data";
import {
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToNotifications
} from "@/services/notification-service";
import { getPostById } from "@/services/post-service";
import { NotificationItem, Post } from "@/types";

type NotificationGroup = {
  id: string;
  type: NotificationItem["type"];
  notifications: NotificationItem[];
  actors: Array<{
    userId: string;
    username: string;
    profileImageURL: string;
  }>;
  createdAt: string;
  isRead: boolean;
  targetPostId?: string;
};

const GROUP_WINDOW_MS = 18 * 60 * 60 * 1000;
const PRIORITY_BY_TYPE: Record<NotificationItem["type"], number> = {
  comment: 3,
  follow: 2,
  like: 1
};

function getNotificationHref(notification: NotificationGroup, relatedPost: Post | null | undefined) {
  if (notification.type === "follow") {
    return `/profile/${notification.actors[0]?.userId ?? notification.notifications[0]?.actorUserId ?? ""}`;
  }

  if (notification.targetPostId && relatedPost !== null) {
    return `/posts/${notification.targetPostId}`;
  }

  return `/profile/${notification.actors[0]?.userId ?? notification.notifications[0]?.actorUserId ?? ""}`;
}

function getNotificationIcon(type: NotificationItem["type"]) {
  switch (type) {
    case "comment":
      return MessageCircle;
    case "follow":
      return UserPlus;
    default:
      return Heart;
  }
}

function getNotificationBadge(type: NotificationItem["type"]) {
  switch (type) {
    case "comment":
      return "Comment";
    case "follow":
      return "Follow";
    default:
      return "Like";
  }
}

function groupNotifications(notifications: NotificationItem[]) {
  const groups: NotificationGroup[] = [];

  notifications.forEach((notification) => {
    const createdAtMs = new Date(notification.createdAt).getTime();
    const targetKey = notification.type === "follow" ? notification.actorUserId : notification.targetPostId;

    const existingGroup = groups.find((group) => {
      const groupCreatedAtMs = new Date(group.createdAt).getTime();
      const withinWindow = Math.abs(groupCreatedAtMs - createdAtMs) <= GROUP_WINDOW_MS;
      const sameTarget =
        (notification.type === "follow" && group.actors[0]?.userId === notification.actorUserId) ||
        (notification.type !== "follow" && group.targetPostId === notification.targetPostId);

      return group.type === notification.type && withinWindow && sameTarget;
    });

    if (existingGroup) {
      existingGroup.notifications.push(notification);
      existingGroup.isRead = existingGroup.isRead && notification.isRead;

      if (createdAtMs > new Date(existingGroup.createdAt).getTime()) {
        existingGroup.createdAt = notification.createdAt;
      }

      if (!existingGroup.actors.some((actor) => actor.userId === notification.actorUserId)) {
        existingGroup.actors.push({
          userId: notification.actorUserId,
          username: notification.actorUsername,
          profileImageURL: notification.actorProfileImageURL
        });
      }

      return;
    }

    groups.push({
      id: notification.id,
      type: notification.type,
      notifications: [notification],
      actors: [
        {
          userId: notification.actorUserId,
          username: notification.actorUsername,
          profileImageURL: notification.actorProfileImageURL
        }
      ],
      createdAt: notification.createdAt,
      isRead: notification.isRead,
      targetPostId: notification.targetPostId
    });
  });

  return groups.sort((left, right) => {
    if (left.isRead !== right.isRead) {
      return left.isRead ? 1 : -1;
    }

    const rightTime = new Date(right.createdAt).getTime();
    const leftTime = new Date(left.createdAt).getTime();

    if (rightTime !== leftTime) {
      return rightTime - leftTime;
    }

    return PRIORITY_BY_TYPE[right.type] - PRIORITY_BY_TYPE[left.type];
  });
}

function getActorLine(group: NotificationGroup) {
  if (group.actors.length === 1) {
    return `@${group.actors[0].username}`;
  }

  if (group.actors.length === 2) {
    return `@${group.actors[0].username} and @${group.actors[1].username}`;
  }

  return `@${group.actors[0].username} and ${group.actors.length - 1} others`;
}

function getNotificationCopy(group: NotificationGroup) {
  const actorLine = getActorLine(group);
  const count = group.notifications.length;

  if (group.type === "comment") {
    return count > 1 ? `${actorLine} commented on your post.` : `${actorLine} commented on your post.`;
  }

  if (group.type === "follow") {
    return count > 1 ? `${actorLine} followed you.` : `${actorLine} followed you.`;
  }

  return count > 1 ? `${actorLine} liked your post.` : `${actorLine} liked your post.`;
}

export default function NotificationsPage() {
  const { currentUser, refreshUnreadNotificationCount } = useAppData();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [relatedPosts, setRelatedPosts] = useState<Record<string, Post | null>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      setRelatedPosts({});
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const unsubscribe = subscribeToNotifications(
      currentUser.id,
      (items) => {
        setNotifications(items);
        setErrorMessage("");
        setIsLoading(false);
      },
      (message) => {
        setErrorMessage(message);
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, [currentUser, refreshUnreadNotificationCount]);

  useEffect(() => {
    if (!currentUser || !notifications.some((item) => !item.isRead)) {
      return;
    }

    let isMounted = true;

    void (async () => {
      try {
        await markAllNotificationsRead(currentUser.id);
        await refreshUnreadNotificationCount();
        if (isMounted) {
          setNotifications((currentItems) => currentItems.map((item) => ({ ...item, isRead: true })));
        }
      } catch {
        // Keep notifications visible even if read-state sync fails.
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [currentUser, notifications, refreshUnreadNotificationCount]);

  useEffect(() => {
    const postNotificationIds = notifications
      .filter((item) => item.targetPostId)
      .map((item) => item.targetPostId as string);

    if (!postNotificationIds.length) {
      setRelatedPosts({});
      return;
    }

    let isMounted = true;

    void (async () => {
      const uniquePostIds = [...new Set(postNotificationIds)];
      const entries = await Promise.all(
        uniquePostIds.map(async (postId) => [postId, await getPostById(postId)] as const)
      );

      if (!isMounted) {
        return;
      }

      setRelatedPosts(Object.fromEntries(entries));
    })();

    return () => {
      isMounted = false;
    };
  }, [notifications]);

  const groupedNotifications = useMemo(() => groupNotifications(notifications), [notifications]);

  async function handleNotificationClick(group: NotificationGroup) {
    trackEvent("notification_click", {
      notification_group_id: group.id,
      notification_type: group.type,
      target_post_id: group.targetPostId ?? null,
      actor_count: group.actors.length
    });

    if (!currentUser || group.isRead) {
      return;
    }

    try {
      await Promise.all(
        group.notifications
          .filter((notification) => !notification.isRead)
          .map((notification) => markNotificationRead(currentUser.id, notification.id))
      );
      await refreshUnreadNotificationCount();
      setNotifications((currentItems) =>
        currentItems.map((item) =>
          group.notifications.some((notification) => notification.id === item.id)
            ? { ...item, isRead: true }
            : item
        )
      );
    } catch {
      // Keep the page usable even if the read-state update fails.
    }
  }

  return (
    <AppShell>
      <AuthGuard>
        <div className="page-stack">
          <section className="surface-panel p-4 sm:p-5">
            <div className="flex items-center gap-2 meta-label text-brand-700">
              <Bell className="h-3.5 w-3.5" />
              Notifications
            </div>
            <h1 className="page-title mt-1 text-[2rem]">Your social activity</h1>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Likes, comments, and follows are grouped more cleanly here so the app feels more useful and less noisy.
            </p>
          </section>

          {errorMessage ? (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>
          ) : null}

          {isLoading ? (
            <div className="surface-panel p-5">
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="surface-card flex items-start gap-3 bg-brand-50/45 px-4 py-4">
                    <div className="h-11 w-11 animate-pulse rounded-full bg-brand-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/5 animate-pulse rounded-full bg-brand-100" />
                      <div className="h-3.5 w-1/4 animate-pulse rounded-full bg-brand-100" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : groupedNotifications.length ? (
            <section className="overflow-hidden rounded-[30px] border border-brand-100/80 bg-card/96 shadow-soft">
              {groupedNotifications.map((group) => {
                const Icon = getNotificationIcon(group.type);
                const relatedPost = group.targetPostId ? relatedPosts[group.targetPostId] : undefined;
                const leadActor = group.actors[0];

                return (
                  <Link
                    key={group.id}
                    href={getNotificationHref(group, relatedPost)}
                    className={`flex items-start gap-3 border-b border-brand-100/70 px-4 py-4 transition duration-200 last:border-b-0 hover:bg-brand-50/35 ${
                      group.isRead ? "bg-card" : "bg-brand-50/30"
                    }`}
                    onClick={() => void handleNotificationClick(group)}
                  >
                    <div className="relative shrink-0">
                      <Avatar
                        username={leadActor?.username ?? "habesha_user"}
                        imageURL={leadActor?.profileImageURL ?? ""}
                        className="h-11 w-11"
                      />
                      {group.actors.length > 1 ? (
                        <span className="absolute -bottom-1 -right-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-brand-950 shadow-sm">
                          +{group.actors.length - 1}
                        </span>
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-800">
                            <Icon className="h-3.5 w-3.5" />
                            {getNotificationBadge(group.type)}
                          </div>
                          <p className="mt-2 text-sm leading-6 text-stone-700">{getNotificationCopy(group)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="meta-text shrink-0">{formatRelativeTime(group.createdAt)}</span>
                          {!group.isRead ? <span className="h-2.5 w-2.5 rounded-full bg-brand-500" /> : null}
                        </div>
                      </div>

                      {group.type !== "follow" ? (
                        <div className="mt-2 rounded-[18px] border border-brand-100 bg-brand-50/35 px-3 py-2.5">
                          <p className="line-clamp-2 text-sm text-stone-600">
                            {relatedPost
                              ? relatedPost.text || "Open the post to see the full conversation."
                              : relatedPost === null
                                ? "Original post unavailable"
                                : "Loading post preview..."}
                          </p>
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-stone-500">
                          Open profile
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
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
