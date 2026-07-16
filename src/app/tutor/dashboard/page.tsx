"use client";

import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { RootState } from "@/redux/store";
import { getTutorDashboard } from "@/services/v1Service";
import { subscribeSocket } from "@/services/socketEventBus";
import {
  tutorDashboardCache,
} from "@/store/tutorDashboardCache";
import {
  subscribeTutorDashboard,
  setTutorDashboard,
  clearTutorDashboard,
} from "@/store/tutorDashboardRealtime";
import { useTranslation } from "react-i18next"; // ✅

// ---------- Type definitions ----------
interface DashboardStats {
  totalSessions: number;
  completedSessions: number;
  totalEarnings: number;
  walletBalance: number;
}

interface ActiveSession {
  session_id: number;
  doubt_id: number;
  title: string;
  student_name: string | null;
  session_type: string;
  status: string; // 'scheduled' or 'active'
  started_at: string | null;
}

interface PendingRequest {
  request_id: number;
  doubt_id: number;
  title: string;
  student_name: string;
  price: string;
}

export default function TutorDashboard() {
  const { t } = useTranslation(); // ✅
  const user = useSelector((state: RootState) => state.auth.user);
  const router = useRouter();
  const [, forceUpdate] = useState({});

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Subscribe to dashboard cache updates
  useEffect(() => {
    const unsubscribe = subscribeTutorDashboard(() => {
      forceUpdate({});
    });
    return unsubscribe;
  }, []);

  // Subscribe to socket events (presence etc.)
  useEffect(() => {
    const unsubscribe = subscribeSocket((event, data) => {
      console.log('📡 WEB EVENT:', event, data);
      if (event === 'PRESENCE_UPDATE') {
        console.log('🟢 PRESENCE:', data);
      }
    });
    return unsubscribe;
  }, []);

  // Fetch dashboard data
  const fetchDashboard = useCallback(async () => {
    try {
      const response = await getTutorDashboard();
      const data = response?.data || response || {};
      const statsData = data.stats || {};
      const pending = data.pending_requests || [];
      const active = data.active_sessions || [];

      const dashboardStats = {
        totalSessions: statsData.total_sessions || 0,
        completedSessions: statsData.completed_sessions || 0,
        totalEarnings: parseFloat(statsData.total_earnings) || 0,
        walletBalance:
          parseFloat(
            statsData.wallet_balance ??
            data.wallet_balance ??
            data.wallet?.balance ??
            0
          ) || 0,
      };

      setTutorDashboard(dashboardStats, pending, active);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      alert(t("tutorDashboard.loadError"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  // Initial load
  useEffect(() => {
    if (tutorDashboardCache.initialized) {
      forceUpdate({});
      setLoading(false);
      return;
    }
    fetchDashboard();
  }, []);

  // Refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    clearTutorDashboard();
    await fetchDashboard();
  };

  // ---------- Helpers ----------
  const formatDate = (dateString: string | null) => {
    if (!dateString || dateString === "None") return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSessionStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return { emoji: "🟢", color: "bg-emerald-400/20 text-emerald-300 border-emerald-400/40" };
      case "scheduled":
        return { emoji: "📅", color: "bg-amber-400/20 text-amber-300 border-amber-400/40" };
      default:
        return { emoji: "⚪", color: "bg-gray-400/20 text-gray-300 border-gray-400/40" };
    }
  };

  const translateSessionStatus = (status: string) => {
    const key = status.toLowerCase() === "active" ? "tutorDashboard.sessionActive" : "tutorDashboard.sessionScheduled";
    return t(key);
  };

  const translateSessionType = (type: string) => {
    if (type === "live_video") return t("myDoubts.liveVideo");
    if (type === "text_chat") return t("myDoubts.textChat");
    return type; // fallback
  };

  // ---------- Loading State ----------
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-violet-400 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-white/70">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
      <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Online Status Banner */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 mx-4 mt-4 py-3 px-6 rounded-full text-center text-white font-bold text-sm shadow-lg shadow-emerald-500/25">
          {t("tutorDashboard.onlineBanner")}
        </div>

        {/* Stats Row */}
        <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300 mt-8 mb-4">
          📊 {t("tutorDashboard.statsTitle")}
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Wallet Balance */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-2xl text-center">
            <div className="text-3xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              ₹{tutorDashboardCache.stats.walletBalance}
            </div>
            <div className="text-xs text-white/60 mt-1 font-medium">
              {t("tutorDashboard.walletBalance")}
            </div>
          </div>

          {/* Total Earnings */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-2xl text-center">
            <div className="text-3xl font-black bg-gradient-to-r from-sky-400 to-cyan-400 bg-clip-text text-transparent">
              ₹{tutorDashboardCache.stats.totalEarnings}
            </div>
            <div className="text-xs text-white/60 mt-1 font-medium">
              {t("tutorDashboard.totalEarnings")}
            </div>
          </div>

          {/* Total Sessions */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-2xl text-center">
            <div className="text-3xl font-black bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              {tutorDashboardCache.stats.totalSessions}
            </div>
            <div className="text-xs text-white/60 mt-1 font-medium">
              {t("tutorDashboard.totalSessions")}
            </div>
          </div>

          {/* Completed */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-2xl text-center">
            <div className="text-3xl font-black bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              {tutorDashboardCache.stats.completedSessions}
            </div>
            <div className="text-xs text-white/60 mt-1 font-medium">
              {t("tutorDashboard.completed")}
            </div>
          </div>
        </div>

        {/* Pending Requests Highlight */}
        {tutorDashboardCache.pendingRequests.length > 0 && (
          <button
            onClick={() => router.push("/tutor/requests")}
            className="w-full bg-amber-400/10 border border-amber-400/30 backdrop-blur-md p-5 rounded-2xl mb-6 text-left flex items-center justify-between hover:bg-amber-400/20 transition"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">📨</span>
              <div>
                <div className="font-bold text-amber-300">
                  {t("tutorDashboard.pendingRequestsCount", { count: tutorDashboardCache.pendingRequests.length })}
                </div>
                <div className="text-sm text-amber-200/80">{t("tutorDashboard.tapToReview")}</div>
              </div>
            </div>
          </button>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => router.push("/tutor/requests")}
            className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white p-4 rounded-2xl shadow-lg shadow-violet-500/25 transition transform hover:-translate-y-1 text-center font-bold"
          >
            📩 {t("tutorDashboard.viewRequests")}
          </button>
          <button
            onClick={() => router.push("/tutor/doubts")}
            className="border-2 border-violet-400/50 text-violet-300 p-4 rounded-2xl backdrop-blur-md bg-white/5 hover:bg-violet-400/10 transition transform hover:-translate-y-1 text-center font-bold"
          >
            📚 {t("tutorDashboard.browsePoolDoubts")}
          </button>
        </div>

        {/* Active / Scheduled Sessions */}
        <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300 mb-4">
          📅 {t("tutorDashboard.activeSessionsTitle")}
        </h2>
        {tutorDashboardCache.activeSessions.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 text-center border border-white/10 shadow-lg">
            <p className="text-white/50">{t("tutorDashboard.noActiveSessions")}</p>
          </div>
        ) : (
          <div className="space-y-4 mb-8">
            {tutorDashboardCache.activeSessions.map((session) => {
              const statusStyle = getSessionStatusStyle(session.status);
              return (
                <button
                  key={session.session_id}
                  onClick={() => {
                    if (session.status === "active") {
                      router.push(`/chat?sessionId=${session.session_id}`);
                    } else {
                      alert(
                        t("tutorDashboard.upcomingSessionAlert", {
                          title: session.title,
                          time: formatDate(session.started_at) || "TBD",
                        })
                      );
                    }
                  }}
                  className="w-full bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-lg text-left hover:border-violet-400/40 transition transform hover:scale-[1.02]"
                >
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <span className="font-semibold text-white flex-1">{session.title}</span>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${statusStyle.color}`}>
                      {statusStyle.emoji} {translateSessionStatus(session.status)}
                    </span>
                  </div>
                  <div className="text-sm text-white/70 mt-1">
                    {t("tutorDashboard.studentLabel")} {session.student_name || t("tutorDashboard.unknownStudent")}
                  </div>
                  <div className="text-sm text-white/60">
                    {t("tutorDashboard.typeLabel")} {translateSessionType(session.session_type)}
                  </div>
                  {session.started_at && (
                    <div className="text-sm text-white/50">
                      {t("tutorDashboard.startedLabel")} {formatDate(session.started_at)}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Pro Tip */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl shadow-lg flex items-start gap-4 mb-8">
          <div className="text-3xl">💡</div>
          <div>
            <h3 className="font-semibold text-violet-300">{t("tutorDashboard.proTipTitle")}</h3>
            <p className="text-sm text-white/70">{t("tutorDashboard.proTipDesc")}</p>
          </div>
        </div>

        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="w-full sm:w-auto bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white font-bold py-3 px-8 rounded-full shadow-xl shadow-violet-500/25 transition mx-auto block mb-4 disabled:opacity-60"
        >
          {refreshing ? t("common.refreshing") : t("common.refresh")}
        </button>
      </div>
    </div>
  );
}