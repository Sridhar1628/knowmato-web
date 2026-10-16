
"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { getTokens } from "@/services/storageService";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import {
  AppNotification,
  notificationService,
} from "@/services/notificationService";

type NotificationSocketMessage = {
  type?: string;
  notification?: AppNotification;
  message?: string;
};

function getWebSocketUrl(): string {
  const configuredApiUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://127.0.0.1:8000/api/";

  const apiUrl = new URL(configuredApiUrl);
  const protocol =
    apiUrl.protocol === "https:" ? "wss:" : "ws:";

  return `${protocol}//${apiUrl.host}/ws/notifications/`;
}



function safeNotificationRoute(
  notification: AppNotification,
  role?: string
): string | null {
  const data = notification.data || {};
  const normalizedRole = role?.toLowerCase();

  // Prefer an explicitly supplied internal route.
  const route = data.route;

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
      // Use the role-specific fallback below.
    }
  }

  const event = data.event;

  // Tutor destinations.
  if (normalizedRole === "tutor") {
    switch (event) {
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

  // Student destinations.
  if (normalizedRole === "student") {
    switch (event) {
      case "NEW_POOL_DOUBT":
      case "NEW_DIRECT_REQUEST":
      case "DIRECT_ACCEPTED":
        return "/student/my-doubts";

      case "NEW_JOB_POSTED":
      case "JOB_UPDATE":
        return "/student/knowmato-plus/jobs";

      case "NEW_INTERNSHIP_POSTED":
      case "INTERNSHIP_UPDATE":
        return "/student/knowmato-plus/internships";

      case "COURSE_CREATED":
      case "NEW_COURSE":
      case "COURSE_UPDATE":
        return "/student/knowmato-plus/courses";

      case "CURRENT_AFFAIR_CREATED":
      case "CURRENT_AFFAIRS":
        return "/student/current-affairs";

      case "CREDIT_PLAN_CREATED":
      case "CREDIT_UPDATE":
      case "PAYMENT_UPDATE":
        return "/student/credits";

      case "NEW_ASSIGNMENT":
      case "ASSIGNMENT_UPDATE":
        return "/student/knowmato-plus/assignments";

      case "ASSESSMENT":
      case "RESULT":
        return "/student/knowmato-plus/assessments";

      default:
        return null;
    }
  }

  // Do not guess destinations for unknown roles or events.
  return null;
}



function formatNotificationDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function NotificationBell() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useSelector(
    (state: RootState) => state.auth.user
    );

    const role = user?.role?.toLowerCase();
  const [notifications, setNotifications] = useState<
    AppNotification[]
  >([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState("");

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<
    ReturnType<typeof setTimeout> | null
  >(null);
  const pingTimerRef = useRef<
    ReturnType<typeof setInterval> | null
  >(null);
  const reconnectAttemptRef = useRef(0);
  const stoppedRef = useRef(false);
  const connectRef = useRef<(() => Promise<void>) | null>(
    null
  );
  const openingRef = useRef(false);
  const openRef = useRef(false);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const refreshNotifications = useCallback(async () => {
    try {
      setError("");

      const [items, count] = await Promise.all([
        notificationService.getMyNotifications(),
        notificationService.getUnreadCount(),
      ]);

      setNotifications(items);
      setUnreadCount(count);
    } catch (err) {
      console.error("Failed to load notifications:", err);
      setError("Couldn't load notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUnreadCount = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error("Failed to refresh unread count:", err);
    }
  }, []);

  useEffect(() => {
    void refreshNotifications();
  }, [refreshNotifications]);

  // Notification WebSocket: separate from the dashboard socket.
  useEffect(() => {
    stoppedRef.current = false;

    const clearSocketTimers = () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      if (pingTimerRef.current) {
        clearInterval(pingTimerRef.current);
        pingTimerRef.current = null;
      }
    };

    const scheduleReconnect = () => {
      if (
        stoppedRef.current ||
        document.visibilityState === "hidden" ||
        reconnectTimerRef.current
      ) {
        return;
      }

      const attempt = reconnectAttemptRef.current++;
      const delay = Math.min(1000 * 2 ** attempt, 30000);

      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null;
        void connectRef.current?.();
      }, delay);
    };

    const connect = async () => {
      if (
        stoppedRef.current ||
        openingRef.current ||
        document.visibilityState === "hidden"
      ) {
        return;
      }

      const currentSocket = socketRef.current;

      if (
        currentSocket?.readyState === WebSocket.OPEN ||
        currentSocket?.readyState === WebSocket.CONNECTING
      ) {
        return;
      }

      openingRef.current = true;

      try {
        const tokens = await getTokens();

        if (stoppedRef.current) return;

        if (!tokens?.access) {
          // Wait for the authenticated layout to mount again.
          scheduleReconnect();
          return;
        }

        const url = new URL(getWebSocketUrl());
        url.searchParams.set("token", tokens.access);

        const socket = new WebSocket(url.toString());
        socketRef.current = socket;

        socket.onopen = () => {
          reconnectAttemptRef.current = 0;

          if (pingTimerRef.current) {
            clearInterval(pingTimerRef.current);
          }

          pingTimerRef.current = setInterval(() => {
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({ type: "PING" }));
            }
          }, 25000);
        };

        socket.onmessage = (event) => {
          let payload: NotificationSocketMessage;

          try {
            payload = JSON.parse(event.data);
          } catch {
            return;
          }

          if (payload.type !== "NOTIFICATION") return;
          if (!payload.notification) return;

          const incoming = payload.notification;

          setNotifications((current) => {
            const existing = current.some(
              (item) => item.id === incoming.id
            );

            if (existing) {
              return current.map((item) =>
                item.id === incoming.id ? incoming : item
              );
            }

            return [incoming, ...current];
          });

          // The backend event may contain the latest read state.
          // Re-fetch the authoritative count to avoid count drift.
          void updateUnreadCount();
        };

        socket.onerror = () => {
          // onclose handles reconnect scheduling.
        };

        socket.onclose = () => {
          clearSocketTimers();

          if (socketRef.current === socket) {
            socketRef.current = null;
          }

          scheduleReconnect();
        };
      } catch (err) {
        console.error("Notification WebSocket error:", err);
        scheduleReconnect();
      } finally {
        openingRef.current = false;
      }
    };

    connectRef.current = connect;
    void connect();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshNotifications();

        const socket = socketRef.current;

        if (
          !socket ||
          socket.readyState === WebSocket.CLOSED
        ) {
          void connectRef.current?.();
        }
      } else {
        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      stoppedRef.current = true;
      connectRef.current = null;
      clearSocketTimers();

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      const socket = socketRef.current;
      socketRef.current = null;

      if (socket) {
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;

        if (
          socket.readyState === WebSocket.OPEN ||
          socket.readyState === WebSocket.CONNECTING
        ) {
          socket.close();
        }
      }
    };
  }, [refreshNotifications, updateUnreadCount]);

  const handleMarkRead = async (
    notification: AppNotification
  ) => {
    if (notification.is_read || busyId === notification.id) {
      return;
    }

    setBusyId(notification.id);

    try {
      const updated = await notificationService.markAsRead(
        notification.id
      );

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? updated : item
        )
      );

      await updateUnreadCount();
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
      setError("Couldn't update this notification.");
    } finally {
      setBusyId(null);
    }
  };

  const handleMarkAllRead = async () => {
    if (markingAll || unreadCount === 0) return;

    setMarkingAll(true);

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
      setError("Couldn't mark all notifications as read.");
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDismiss = async (id: number) => {
    setBusyId(id);

    try {
      await notificationService.dismiss(id);

      setNotifications((current) =>
        current.filter((item) => item.id !== id)
      );

      await updateUnreadCount();
    } catch (err) {
      console.error("Failed to dismiss notification:", err);
      setError("Couldn't dismiss this notification.");
    } finally {
      setBusyId(null);
    }
  };

  const handleNotificationClick = async (
    notification: AppNotification
  ) => {
    if (!notification.is_read) {
      await handleMarkRead(notification);
    }

    const route = safeNotificationRoute(notification, role);

    setOpen(false);

    if (route) {
      router.push(route);
    }
  };

  const unreadVisibleCount = Math.min(unreadCount, 99);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={`Notifications, ${unreadCount} unread`}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:border-violet-400/50 hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-violet-400"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="h-6 w-6"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10 21h4"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-[#302b63] bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadVisibleCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close notifications"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />

          <section
            role="dialog"
            aria-label="Notifications"
            className="absolute right-0 z-50 mt-3 flex max-h-[min(75vh,36rem)] w-[min(92vw,24rem)] flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#17152f] shadow-2xl shadow-black/40"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div>
                <h2 className="font-semibold text-white">
                  Notifications
                </h2>
                <p className="text-xs text-white/55">
                  {unreadCount} unread
                </p>
              </div>

              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={markingAll || unreadCount === 0}
                className="text-xs font-medium text-violet-300 hover:text-violet-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {markingAll ? "Updating..." : "Mark all read"}
              </button>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-center justify-between gap-3 border-b border-rose-400/20 bg-rose-500/10 px-4 py-2 text-xs text-rose-200"
              >
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => void refreshNotifications()}
                  className="shrink-0 underline"
                >
                  Retry
                </button>
              </div>
            )}

            <div className="overflow-y-auto">
              {loading ? (
                <p className="p-6 text-center text-sm text-white/60">
                  Loading notifications...
                </p>
              ) : notifications.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white/50">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-6 w-6"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-white">
                    You're all caught up
                  </p>
                  <p className="mt-1 text-xs text-white/50">
                    New notifications will appear here.
                  </p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <article
                    key={notification.id}
                    className={`border-b border-white/5 transition hover:bg-white/[0.04] ${
                      notification.is_read ? "" : "bg-violet-500/[0.08]"
                    }`}
                  >
                    <div className="flex gap-3 px-4 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          void handleNotificationClick(notification)
                        }
                        className="min-w-0 flex-1 text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-violet-400"
                      >
                        <div className="flex items-start gap-2">
                          <span
                            className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                              notification.is_read
                                ? "bg-transparent"
                                : "bg-violet-400"
                            }`}
                          />

                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-white">
                              {notification.title}
                            </p>
                            <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-white/70">
                              {notification.message}
                            </p>
                            <p className="mt-2 text-[10px] text-white/40">
                              {formatNotificationDate(
                                notification.created_at
                              )}
                            </p>
                          </div>
                        </div>
                      </button>

                      <div className="flex shrink-0 flex-col items-end gap-2">
                        {!notification.is_read && (
                          <span className="rounded-full bg-violet-400/15 px-2 py-0.5 text-[9px] font-semibold text-violet-200">
                            NEW
                          </span>
                        )}

                        <button
                          type="button"
                          disabled={busyId === notification.id}
                          onClick={() =>
                            void handleDismiss(notification.id)
                          }
                          aria-label={`Dismiss ${notification.title}`}
                          className="rounded-md px-1.5 py-1 text-lg leading-none text-white/40 hover:bg-white/10 hover:text-white disabled:opacity-40"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>

            
            <div className="border-t border-white/10 px-4 py-3">
            
            <button
                type="button"
                onClick={() => {
                    setOpen(false);

                    if (pathname.startsWith("/student")) {
                    router.push("/student/notifications");
                    } else if (pathname.startsWith("/tutor")) {
                    router.push("/tutor/notifications");
                    } else {
                    console.error(
                        "Cannot determine notification history route:",
                        pathname
                    );
                    }
                }}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                >
                View all notifications
            </button>

            </div>

          </section>
        </>
      )}
    </div>
  );
}
