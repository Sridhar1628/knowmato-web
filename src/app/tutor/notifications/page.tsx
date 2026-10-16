
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AppNotification,
  notificationService,
} from "@/services/notificationService";

type FilterType = "all" | "unread" | "read";

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getTutorNotificationRoute(
  notification: AppNotification
): string | null {
  const data = notification.data || {};
  const route = data.route;

  // Prefer a trusted same-origin internal route from the backend.
  if (
    typeof route === "string" &&
    route.startsWith("/") &&
    !route.startsWith("//") &&
    !route.includes("\\")
  ) {
    try {
      const parsed = new URL(route, window.location.origin);

      if (parsed.origin === window.location.origin) {
        return `${parsed.pathname}${parsed.search}${parsed.hash}`;
      }
    } catch {
      // Fall through to the tutor-specific routes.
    }
  }

  switch (data.event) {
    case "NEW_POOL_DOUBT":
    case "NEW_DOUBT_REQUEST":
      return "/tutor/doubts";

    case "NEW_DIRECT_REQUEST":
      return "/tutor/requests";

    case "DIRECT_ACCEPTED":
    case "SESSION_STARTED":
    case "TUTOR_ACCEPTED":
      return "/tutor/requests";

    case "CREDIT_UPDATE":
    case "PAYMENT_UPDATE":
      return "/tutor/wallet";

    default:
      return null;
  }
}

function getCategory(type: string): string {
  if (type.includes("DOUBT") || type.includes("CHAT")) {
    return "Doubts & communication";
  }

  if (type.includes("COURSE") || type.includes("ASSIGNMENT")) {
    return "Learning";
  }

  if (
    type.includes("JOB") ||
    type.includes("INTERNSHIP") ||
    type.includes("APPLICATION")
  ) {
    return "Career";
  }

  if (type.includes("CREDIT") || type.includes("PAYMENT")) {
    return "Credits & payments";
  }

  return "General";
}

export default function TutorNotificationsPage() {
  const router = useRouter();

  const [notifications, setNotifications] = useState<
    AppNotification[]
  >([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState("");

  const loadNotifications = useCallback(
    async (showLoader = true) => {
      if (showLoader) setLoading(true);

      setError("");

      try {
        const [items, count] = await Promise.all([
          notificationService.getMyNotifications(),
          notificationService.getUnreadCount(),
        ]);

        setNotifications(items);
        setUnreadCount(count);
      } catch (err) {
        console.error("Failed to load tutor notifications:", err);
        setError("Unable to load notifications. Please try again.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const visibleNotifications = useMemo(
    () =>
      notifications.filter((item) => {
        if (filter === "unread") return !item.is_read;
        if (filter === "read") return item.is_read;
        return true;
      }),
    [notifications, filter]
  );

  const markAsRead = async (notification: AppNotification) => {
    if (notification.is_read || busyId === notification.id) return;

    setBusyId(notification.id);
    setError("");

    try {
      const updated = await notificationService.markAsRead(
        notification.id
      );

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? updated : item
        )
      );

      setUnreadCount(await notificationService.getUnreadCount());
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
      setError("Unable to update the notification. Please retry.");
    } finally {
      setBusyId(null);
    }
  };

  const markAllAsRead = async () => {
    if (markingAll || unreadCount === 0) return;

    setMarkingAll(true);
    setError("");

    try {
      await notificationService.markAllAsRead();

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          is_read: true,
          read_at: item.read_at || new Date().toISOString(),
        }))
      );

      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
      setError("Unable to mark all notifications as read.");
    } finally {
      setMarkingAll(false);
    }
  };

  const dismissNotification = async (id: number) => {
    if (busyId === id) return;

    setBusyId(id);
    setError("");

    try {
      await notificationService.dismiss(id);

      setNotifications((current) =>
        current.filter((item) => item.id !== id)
      );

      setUnreadCount(await notificationService.getUnreadCount());
    } catch (err) {
      console.error("Failed to dismiss notification:", err);
      setError("Unable to dismiss the notification. Please retry.");
    } finally {
      setBusyId(null);
    }
  };

  const openNotification = async (
    notification: AppNotification
  ) => {
    if (!notification.is_read) {
      await markAsRead(notification);
    }

    const route = getTutorNotificationRoute(notification);

    if (route) {
      router.push(route);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 text-white">
      {/* Heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-violet-300">
            TUTOR UPDATES
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Notifications
          </h1>

          <p className="mt-2 text-sm text-white/60">
            Stay up to date with doubt requests, sessions, and account activity.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={refreshing}
            onClick={() => {
              setRefreshing(true);
              void loadNotifications(false);
            }}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium transition hover:bg-white/10 disabled:opacity-50"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          <button
            type="button"
            disabled={markingAll || unreadCount === 0}
            onClick={() => void markAllAsRead()}
            className="rounded-xl bg-violet-500 px-4 py-2.5 text-sm font-semibold transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {markingAll ? "Updating..." : "Mark all as read"}
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
          <p className="text-sm text-white/60">Total loaded</p>
          <p className="mt-2 text-3xl font-bold">
            {notifications.length}
          </p>
        </div>

        <div className="rounded-2xl border border-violet-400/20 bg-violet-500/10 p-5">
          <p className="text-sm text-violet-200">Unread</p>
          <p className="mt-2 text-3xl font-bold">{unreadCount}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
          <p className="text-sm text-white/60">Read</p>
          <p className="mt-2 text-3xl font-bold">
            {notifications.filter((item) => item.is_read).length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "All notifications"],
            ["unread", "Unread"],
            ["read", "Read"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            aria-pressed={filter === value}
            className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
              filter === value
                ? "border-violet-400/40 bg-violet-500/20 text-violet-100"
                : "border-white/10 bg-white/[0.04] text-white/65 hover:bg-white/10 hover:text-white"
            }`}
          >
            {label}
            {value === "unread" && unreadCount > 0 && (
              <span className="ml-2 rounded-full bg-violet-400 px-2 py-0.5 text-xs font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Errors */}
      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void loadNotifications()}
            className="font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* List */}
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#17152f]/80 shadow-xl shadow-black/10">
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="font-semibold">
            {filter === "all"
              ? "All notifications"
              : filter === "unread"
                ? "Unread notifications"
                : "Read notifications"}
          </h2>

          <p className="mt-1 text-xs text-white/50">
            {visibleNotifications.length} notification
            {visibleNotifications.length === 1 ? "" : "s"}
          </p>
        </div>

        {loading ? (
          <div className="space-y-3 p-5" aria-live="polite">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-24 animate-pulse rounded-xl bg-white/[0.05]"
              />
            ))}
          </div>
        ) : visibleNotifications.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-white/50">
              <span className="text-2xl" aria-hidden="true">♧</span>
            </div>

            <h3 className="mt-4 font-semibold">
              {filter === "unread"
                ? "You're all caught up"
                : filter === "read"
                  ? "No read notifications yet"
                  : "No notifications yet"}
            </h3>

            <p className="mt-2 text-sm text-white/50">
              Updates about your tutoring activity will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.07]">
            {visibleNotifications.map((notification) => {
              const isBusy = busyId === notification.id;
              const route = getTutorNotificationRoute(notification);

              return (
                <article
                  key={notification.id}
                  className={`p-4 transition hover:bg-white/[0.035] sm:p-5 ${
                    notification.is_read
                      ? ""
                      : "bg-violet-500/[0.045]"
                  }`}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <span
                      className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${
                        notification.is_read
                          ? "bg-white/15"
                          : "bg-violet-400"
                      }`}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="break-words font-semibold text-white">
                          {notification.title}
                        </h3>

                        {!notification.is_read && (
                          <span className="rounded-full bg-violet-400/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-200">
                            Unread
                          </span>
                        )}
                      </div>

                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-white/70">
                        {notification.message}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/45">
                        <span>{formatDate(notification.created_at)}</span>
                        <span aria-hidden="true">·</span>
                        <span>{getCategory(notification.notification_type)}</span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-3">
                        {route && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              void openNotification(notification)
                            }
                            className="text-sm font-semibold text-violet-300 hover:text-violet-200 disabled:opacity-50"
                          >
                            Open notification
                          </button>
                        )}

                        {!notification.is_read && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void markAsRead(notification)}
                            className="text-sm text-white/60 hover:text-white disabled:opacity-50"
                          >
                            Mark as read
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() =>
                            void dismissNotification(notification.id)
                          }
                          className="text-sm text-white/60 hover:text-rose-300 disabled:opacity-50"
                        >
                          {isBusy ? "Updating..." : "Dismiss"}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
