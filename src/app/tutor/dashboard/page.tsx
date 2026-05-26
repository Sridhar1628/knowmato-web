"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSelector} from "react-redux";
import { useRouter } from "next/navigation";
import { RootState } from "@/redux/store";
import { getTutorDashboard } from "@/services/v1Service";
import { subscribeSocket } from "@/services/socketEventBus";


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
  const router = useRouter();

  // ---------- State ----------
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [stats, setStats] = useState<DashboardStats>({
    totalSessions: 0,
    completedSessions: 0,
    totalEarnings: 0,
  });

  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);

  useEffect(() => {

    const unsubscribe =
      subscribeSocket(
        (event, data) => {

          console.log(
            '📡 WEB EVENT:',
            event,
            data
          );

          if (
            event ===
            'PRESENCE_UPDATE'
          ) {

            console.log(
              '🟢 PRESENCE:',
              data
            );

            // UPDATE UI HERE
          }

        }
      );

    return unsubscribe;

  }, []);

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

    // ---------- Initial Load ----------
  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // ---------- Refresh Handler ----------
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboard();
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

  return (
    <div className="min-h-screen bg-gray-50">

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
      </div>
    </div>
  );
}