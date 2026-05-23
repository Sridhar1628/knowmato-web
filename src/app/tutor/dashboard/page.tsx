"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { RootState } from "@/redux/store";
import { clearTokens } from "@/services/storageService";
import { logout } from "@/redux/slices/authSlice";
import { getTutorDashboard } from "@/services/v1Service";
import { subscribeSocket } from "@/services/socketEventBus";
import { SocketEvents } from "@/services/versionSocketEvents";

// ---------- Type definitions (mirroring Android) ----------
interface DashboardStats {
  totalSessions: number;
  completedSessions: number;
  totalEarnings: number; // in rupees
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
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();
  const router = useRouter();

  // ---------- State ----------
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [stats, setStats] = useState<DashboardStats>({
    totalSessions: 0,
    completedSessions: 0,
    totalEarnings: 0,
  });

  const [wallet, setWallet] = useState({
    real_balance: 0,
    bonus_balance: 0,
  });

  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);

  // ---------- Dashboard Fetch ----------
  const fetchDashboard = useCallback(async () => {
    try {
      const response = await getTutorDashboard();
      const data = response?.data || response || {};
      const statsData = data.stats || {};
      const pending = data.pending_requests || [];
      const active = data.active_sessions || [];

      setStats({
        totalSessions: statsData.total_sessions || 0,
        completedSessions: statsData.completed_sessions || 0,
        totalEarnings: parseFloat(statsData.total_earnings) || 0,
      });

      setPendingRequests(pending);
      setActiveSessions(active);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      alert("Failed to load dashboard. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ---------- Socket Listener for Wallet Updates ----------
  useEffect(() => {
    const unsubscribe = subscribeSocket((event, data) => {
      console.log("📡 DASHBOARD SOCKET EVENT:", event, data);

      if (event === SocketEvents.NEW_DOUBT_REQUEST) {
        // Future: increment badge or refetch
      }

      if (event === "WALLET_UPDATE") {
        console.log("💰 Wallet update received:", data);
        setWallet({
          real_balance: data.real_balance || 0,
          bonus_balance: data.bonus_balance || 0,
        });
      }
    });

    return unsubscribe;
  }, []);

  // ---------- Tab visibility refetch (like AppState) ----------
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        console.log("🟢 Tab active – refreshing dashboard");
        fetchDashboard();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [fetchDashboard]);

  // ---------- Initial Load ----------
  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // ---------- Refresh Handler ----------
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboard();
  };

  // ---------- Logout ----------
  const handleLogout = async () => {
    try {
      await clearTokens();
      dispatch(logout());
      router.push("/entry");
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  // ---------- Helpers ----------
  const displayName = user?.display_name || user?.email?.split("@")[0] || "Tutor";
  const displayEmail = user?.email || "";

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
        return { emoji: "🟢", color: "bg-green-100 text-green-800", text: "Active" };
      case "scheduled":
        return { emoji: "📅", color: "bg-yellow-100 text-yellow-800", text: "Scheduled" };
      default:
        return { emoji: "⚪", color: "bg-gray-100 text-gray-700", text: status };
    }
  };

  // ---------- Loading State ----------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // ---------- Sidebar Overlay ----------
  const Sidebar = () => (
    <div className="fixed inset-0 z-40 flex">
      {/* backdrop */}
      <div
        className="fixed inset-0 bg-black opacity-50 transition-opacity"
        onClick={() => setSidebarOpen(false)}
      />
      {/* sidebar */}
      <div className="relative w-72 max-w-[75vw] bg-white shadow-xl p-6 flex flex-col animate-slideInLeft">
        {/* Close & User Info */}
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-2xl">
              👨‍🏫
            </div>
            <div>
              <div className="font-bold text-gray-800">{displayName}</div>
              <div className="text-sm text-gray-500">{displayEmail}</div>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-2 flex-1">
          <button
            onClick={() => {
              setSidebarOpen(false);
              router.push("/tutor/doubts");
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition"
          >
            <span>📚</span> Browse Doubts
          </button>
          <button
            onClick={() => {
              setSidebarOpen(false);
              router.push("/tutor/requests");
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition"
          >
            <span>📩</span> View Requests
          </button>
          <button
            onClick={() => {
              setSidebarOpen(false);
              router.push("/tutor/sessions");
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition"
          >
            <span>🎥</span> My Sessions
          </button>
          <button
            onClick={() => {
              setSidebarOpen(false);
              alert("No new notifications.");
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition"
          >
            <span>🔔</span> Notifications
          </button>
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition mt-auto"
        >
          <span>🚪</span> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar (conditional) */}
      {sidebarOpen && <Sidebar />}

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white shadow-md px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition"
        >
          <span className="text-xl">👤</span>
        </button>
        <div className="text-center">
          <div className="text-sm opacity-80">Welcome back</div>
          <div className="text-xl font-bold">{displayName}</div>
        </div>
        <button
          onClick={() => alert("No new notifications.")}
          className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition"
        >
          <span className="text-xl">🔔</span>
        </button>
      </div>

      {/* Online Status Banner */}
      <div className="bg-green-500 mx-4 mt-4 py-2 px-6 rounded-full text-center text-white font-semibold text-sm">
        🟢 You are online & accepting requests
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Stats Row */}
        <h2 className="text-lg font-bold text-gray-800 mb-3">📊 Your Stats</h2>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white p-4 rounded-2xl shadow-sm text-center">
            <div className="text-2xl font-bold text-indigo-600">₹{stats.totalEarnings}</div>
            <div className="text-xs text-gray-500 mt-1">Earnings</div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm text-center">
            <div className="text-2xl font-bold text-indigo-600">{stats.totalSessions}</div>
            <div className="text-xs text-gray-500 mt-1">Total Sessions</div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm text-center">
            <div className="text-2xl font-bold text-indigo-600">{stats.completedSessions}</div>
            <div className="text-xs text-gray-500 mt-1">Completed</div>
          </div>
        </div>

        {/* Wallet Card (real/bonus) */}
        <div className="bg-white p-5 rounded-2xl shadow-sm mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-3">💰 Wallet</h3>
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Real Balance</span>
            <span className="font-bold text-indigo-600">₹{wallet.real_balance.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Bonus Balance</span>
            <span className="font-bold text-indigo-600">₹{wallet.bonus_balance}</span>
          </div>
        </div>

        {/* Pending Requests Highlight */}
        {pendingRequests.length > 0 && (
          <button
            onClick={() => router.push("/tutor/requests")}
            className="w-full bg-yellow-50 border border-yellow-200 p-4 rounded-2xl mb-6 text-left flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">📨</span>
              <div>
                <div className="font-bold text-yellow-800">
                  {pendingRequests.length} pending request{pendingRequests.length !== 1 ? "s" : ""}
                </div>
                <div className="text-sm text-yellow-700">Tap to review →</div>
              </div>
            </div>
          </button>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <button
            onClick={() => router.push("/tutor/requests")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-2xl shadow-md transition transform hover:-translate-y-1 text-center font-semibold"
          >
            📩 View Requests
          </button>
          <button
            onClick={() => router.push("/tutor/doubts")}
            className="border-2 border-indigo-600 text-indigo-600 p-4 rounded-2xl hover:bg-indigo-50 transition transform hover:-translate-y-1 text-center font-semibold"
          >
            📚 Browse Pool Doubts
          </button>
          <button
            onClick={() => router.push("/tutor/sessions")}
            className="border-2 border-indigo-600 text-indigo-600 p-4 rounded-2xl hover:bg-indigo-50 transition transform hover:-translate-y-1 text-center font-semibold"
          >
            🎥 My Sessions
          </button>
        </div>

        {/* Active / Scheduled Sessions */}
        <h2 className="text-lg font-bold text-gray-800 mb-3">📅 Active & Scheduled Sessions</h2>
        {activeSessions.length === 0 ? (
          <div className="bg-white p-4 rounded-2xl text-center text-gray-500">
            No active or scheduled sessions
          </div>
        ) : (
          <div className="space-y-4 mb-8">
            {activeSessions.map((session) => {
              const statusStyle = getSessionStatusStyle(session.status);
              return (
                <button
                  key={session.session_id}
                  onClick={() => {
                    if (session.status === "active") {
                      router.push(`/chat?sessionId=${session.session_id}`);
                    } else {
                      alert(
                        `Upcoming Session: ${session.title}\nScheduled on ${formatDate(session.started_at) || "TBD"}`
                      );
                    }
                  }}
                  className="w-full bg-white p-4 rounded-2xl shadow-sm text-left hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <span className="font-semibold text-gray-800 flex-1">{session.title}</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyle.color}`}
                    >
                      {statusStyle.emoji} {statusStyle.text}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    👩‍🎓 Student: {session.student_name || "Unknown"}
                  </div>
                  <div className="text-sm text-gray-500">💬 Type: {session.session_type}</div>
                  {session.started_at && (
                    <div className="text-sm text-gray-400">🕒 Started: {formatDate(session.started_at)}</div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Pro Tip */}
        <div className="bg-white p-4 rounded-2xl shadow-sm flex items-start gap-4 mb-8">
          <div className="text-3xl">💡</div>
          <div>
            <h3 className="font-semibold text-gray-800">Pro Tip</h3>
            <p className="text-sm text-gray-600">
              Respond within 5 minutes to increase your acceptance rate and earn the “Top Tutor” badge!
            </p>
          </div>
        </div>

        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-full shadow-md transition mx-auto block mb-4"
        >
          {refreshing ? "Refreshing..." : "🔄 Refresh"}
        </button>

        {/* Logout (for quick access) */}
        <button
          onClick={handleLogout}
          className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-8 rounded-full shadow-md transition mx-auto block"
        >
          🚪 Sign Out
        </button>
      </div>
    </div>
  );
}