
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { RootState } from "@/redux/store";
import { getTokens } from "@/services/storageService";
import {
  connectSocket,
  disconnectSocket,
} from "@/services/versionSocketService";
import { emitSocketEvent } from "@/services/socketEventBus";
import { getTutorDashboard } from "@/services/v1Service";
import TutorSidebar from "@/components/TutorSidebar";
import { tutorDashboardCache } from "@/store/tutorDashboardCache";
import {
  subscribeTutorDashboard,
  updateTutorWallet,
} from "@/store/tutorDashboardRealtime";
import NotificationBell from "@/components/notifications/NotificationBell";
import {
  toggleOnline,
  sendHeartbeat,
} from "@/services/v1Service";

interface NotificationState {
  title: string;
  message: string;
  type: string;
  data?: any;
}

export default function TutorLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const user = useSelector(
    (state: RootState) => state.auth.user
  );

  const sidebarCollapsed = useSelector(
    (state: any) => Boolean(state.ui?.sidebarCollapsed)
  );

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notification, setNotification] =
    useState<NotificationState | null>(null);

  const displayName =
    user?.display_name ||
    user?.first_name ||
    user?.email?.split("@")[0] ||
    "Mentor";

  const contentOffset = sidebarCollapsed
    ? "lg:ml-16"
    : "lg:ml-72";

  // =========================================
  // DASHBOARD FETCH (wallet)
  // =========================================

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await getTutorDashboard();
      const data = res.data || res;

      if (data.wallet) {
        updateTutorWallet(
          parseFloat(data.wallet.real_balance || "0") +
            parseFloat(data.wallet.bonus_balance || "0")
        );
      }
    } catch (err) {
      console.log("Dashboard error:", err);
    }
  }, []);

  // =========================================
  // GLOBAL SOCKET EVENT HANDLER
  // =========================================

  const handleSocketEvent = useCallback(
    (event: string, data: any) => {
      emitSocketEvent(event, data);
      console.log("🔥 TUTOR WS:", event, data);

      switch (event) {
        case "NEW_DOUBT_REQUEST":
          setNotification({
            title: "📬 New Doubt Request",
            message: data?.title || "A new doubt request arrived",
            type: event,
            data,
          });
          setNotificationCount((prev) => prev + 1);
          break;

        case "NEW_DIRECT_REQUEST":
          setNotification({
            title: "📩 Direct Request",
            message: data?.title || "A direct request arrived",
            type: event,
            data,
          });
          setNotificationCount((prev) => prev + 1);
          break;

        case "WALLET_UPDATE":
          updateTutorWallet(
            Number(data.real_balance) + Number(data.bonus_balance)
          );
          break;

        case "SESSION_STARTED":
        case "DIRECT_ACCEPTED":
        case "TUTOR_ACCEPTED": {
          if (!data?.session_id) return;

          const type = (data.session_type || "").toLowerCase();

          if (type === "live_video") {
            router.push(`/videocall/${data.session_id}`);
          } else {
            router.push(`/chat/${data.session_id}`);
          }
          break;
        }

        case "PRESENCE_UPDATE":
          console.log("🟢 PRESENCE UPDATE:", data);
          break;

        default:
          break;
      }
    },
    [router]
  );

  // =========================================
  // REDUX CACHE SUBSCRIPTION
  // =========================================

  const [, forceUpdate] = useState({});

  useEffect(() => {
    const unsubscribe = subscribeTutorDashboard(() => {
      forceUpdate({});
    });

    return unsubscribe;
  }, []);

  // =========================================
  // TUTOR PRESENCE / HEARTBEAT
  // =========================================

  useEffect(() => {
    let active = true;
    let heartbeatTimer: ReturnType<typeof setInterval> | undefined;

    const activateTutor = async () => {
      try {
        await toggleOnline(true);

        if (!active) return;

        console.log("[TUTOR PRESENCE] Tutor is online");

        heartbeatTimer = setInterval(() => {
          void sendHeartbeat().catch((error) => {
            console.error(
              "[TUTOR PRESENCE] Heartbeat failed:",
              error
            );
          });
        }, 30_000);
      } catch (error) {
        console.error(
          "[TUTOR PRESENCE] Could not activate tutor:",
          error
        );
      }
    };

    void activateTutor();

    return () => {
      active = false;

      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
      }
    };
  }, []);

  // =========================================
  // INITIAL SOCKET CONNECTION
  // =========================================

  useEffect(() => {
    let mounted = true;

    const initSocket = async () => {
      try {
        const tokens = await getTokens();

        if (!tokens?.access) return;

        console.log("🌐 CONNECTING GLOBAL TUTOR SOCKET");

        connectSocket(tokens.access, (event, data) => {
          if (!mounted) return;
          handleSocketEvent(event, data);
        });
      } catch (err) {
        console.log("Socket init error:", err);
      }
    };

    void initSocket();

    return () => {
      mounted = false;
      disconnectSocket();
    };
  }, [handleSocketEvent]);

  // =========================================
  // TAB VISIBILITY RECONNECT
  // =========================================

  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

    const handleVisibility = async () => {
      if (document.visibilityState === "visible") {
        console.log("🌐 TAB ACTIVE AGAIN");

        try {
          const tokens = await getTokens();

          if (!tokens?.access) return;

          disconnectSocket();

          reconnectTimer = setTimeout(() => {
            connectSocket(tokens.access, handleSocketEvent);
          }, 500);
        } catch (err) {
          console.log("Reconnect error:", err);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );

      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
    };
  }, [handleSocketEvent]);

  // =========================================
  // INITIAL DASHBOARD LOAD
  // =========================================

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // =========================================
  // AUTO HIDE NOTIFICATION
  // =========================================

  useEffect(() => {
    if (!notification) return;

    const timer = setTimeout(() => {
      setNotification(null);
    }, 5000);

    return () => clearTimeout(timer);
  }, [notification]);

  // =========================================
  // RENDER
  // =========================================

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
      {/* Animated background blobs */}
      <div className="pointer-events-none absolute left-[-5rem] top-0 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl" />
      <div className="pointer-events-none absolute right-[-5rem] top-0 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-5rem] left-40 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />

      <TutorSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <div
        className={`relative z-10 min-h-screen transition-[margin] duration-300 ease-in-out ${contentOffset}`}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-white/5 px-4 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-white transition hover:bg-white/10 lg:hidden"
              aria-label="Open sidebar"
            >
              ☰
            </button>

            <div>
              <p className="text-xs text-white/60">
                Welcome back
              </p>

              <h2 className="text-lg font-bold text-transparent bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text">
                {displayName}
              </h2>
            </div>
          </div>

          {/* Notifications and wallet */}
          <div className="flex items-center gap-3">
            <NotificationBell />

            <button
              type="button"
              onClick={() => router.push("/tutor/wallet")}
              className="rounded-xl border border-violet-400/30 bg-violet-500/20 px-3 py-2 text-sm font-bold text-violet-300 backdrop-blur-md transition hover:bg-violet-500/30 hover:text-white sm:px-4"
            >
              💰 <span className="hidden sm:inline">₹</span>
              {tutorDashboardCache.stats.walletBalance}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="min-w-0 overflow-x-hidden p-4 md:p-6">
          {children}
        </main>
      </div>

      {/* Global notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed right-4 top-20 z-[60] w-[min(340px,calc(100vw-2rem))] rounded-2xl border border-violet-400/30 bg-[#211b45]/95 p-4 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-violet-300">
                  {notification.title}
                </h3>

                <p className="mt-1 text-sm text-white/70">
                  {notification.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setNotification(null)}
                className="text-white/50 transition hover:text-white"
                aria-label="Dismiss notification"
              >
                ✕
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                if (notification.type === "NEW_DIRECT_REQUEST") {
                  router.push("/tutor/requests");
                } else {
                  router.push("/tutor/doubts");
                }

                setNotification(null);
              }}
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:from-violet-600 hover:to-fuchsia-600"
            >
              Open
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
