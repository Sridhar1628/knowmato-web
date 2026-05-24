"use client";

import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { RootState } from "@/redux/store";
import { logout } from "@/redux/slices/authSlice";
import { clearTokens } from "@/services/storageService";
import { getAdminDashboard } from "@/services/v1Service";
import toast from "react-hot-toast";

// ---------- Types (mirroring Android) ----------
interface DashboardData {
  doubts: {
    total: number;
    open: number;
    completed: number;
  };
  sessions: {
    total: number;
    active: number;
    completed: number;
  };
  revenue: string; // e.g. "2530.00"
}

// ---------- Sub-components ----------
const StatCard = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) => (
  <div
    className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 mb-2 border-l-4"
    style={{ borderLeftColor: color }}
  >
    <span className="text-sm text-gray-700">{label}</span>
    <span className="text-lg font-bold" style={{ color }}>
      {value}
    </span>
  </div>
);

const ActionCard = ({
  title,
  onPress,
}: {
  title: string;
  onPress: () => void;
}) => (
  <button
    onClick={onPress}
    className="w-[48%] sm:w-40 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold text-sm transition"
  >
    {title}
  </button>
);

// ---------- Main Component ----------
export default function AdminDashboard() {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ---------- Fetch dashboard ----------
  const fetchDashboard = useCallback(async () => {
    try {
      const res = await getAdminDashboard();
      // Response shape: { data: { doubts: {...}, sessions: {...}, revenue: "2530.00" } }
      const data = res?.data || res;
      setDashboard(data);
    } catch (error) {
      console.error("Admin dashboard error:", error);
      toast.error("Failed to load dashboard. Pull to refresh.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  // ---------- Logout ----------
  const handleLogout = async () => {
    try {
      await clearTokens();
      dispatch(logout());
      router.push("/entry");
    } catch {
      toast.error("Logout failed.");
    }
    setSidebarOpen(false);
  };

  // ---------- Display helpers ----------
  const displayName =
    user?.display_name || user?.email?.split("@")[0] || "Admin";
  const displayEmail = user?.email || "admin@example.com";

  // ---------- Sidebar ----------
  const Sidebar = () => (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity"
        onClick={() => setSidebarOpen(false)}
      />
      {/* Sidebar panel */}
      <div className="fixed left-0 top-0 bottom-0 z-50 w-72 max-w-[75vw] bg-white shadow-xl p-6 flex flex-col animate-slideInLeft">
        {/* User info */}
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-2xl">
              👑
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

        {/* Navigation links */}
        <nav className="flex flex-col gap-2 flex-1">
          <button
            onClick={() => {
              setSidebarOpen(false);
              router.push("/admin/doubts");
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition"
          >
            📋 View Doubts
          </button>
          <button
            onClick={() => {
              setSidebarOpen(false);
              router.push("/admin/sessions");
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition"
          >
            📅 View Sessions
          </button>
          <button
            onClick={() => {
              setSidebarOpen(false);
              router.push("/admin/pricing");
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition"
          >
            💲 Pricing
          </button>
          <button
            onClick={() => {
              setSidebarOpen(false);
              router.push("/admin/reports");
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition"
          >
            📈 Reports
          </button>
          <button
            onClick={() => {
              setSidebarOpen(false);
              router.push("/admin/tutor-earnings");
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition"
          >
            💰 Tutor Earnings
          </button>
          <button
            onClick={() => {
              setSidebarOpen(false);
              router.push("/admin/users");
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition"
          >
            👥 Manage Users
          </button>
          <button
            onClick={() => {
              setSidebarOpen(false);
              toast("No new notifications.", { icon: "🔔" });
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition"
          >
            🔔 Notifications
          </button>
        </nav>

        {/* Logout at bottom */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition mt-auto"
        >
          🚪 Logout
        </button>
      </div>
    </>
  );

  // ---------- Loading State ----------
  if (loading && !refreshing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // ---------- Main UI ----------
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      {sidebarOpen && <Sidebar />}

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 pb-5 pt-10 shadow-lg text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition"
          >
            <span className="text-xl">👤</span>
          </button>
          <div className="text-center">
            <p className="text-sm opacity-80">Admin Panel</p>
            <h1 className="text-xl font-bold">{displayName}</h1>
            <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-xs">
              🛡️ Administrator
            </div>
          </div>
          <button
            onClick={() => toast("No new notifications.", { icon: "🔔" })}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition"
          >
            <span className="text-xl">🔔</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Refresh button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow hover:bg-gray-100 transition disabled:opacity-50"
          >
            <svg
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Stats Section */}
        <h2 className="text-lg font-bold text-gray-800 mb-3">
          📊 Platform Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          {/* Doubts Group */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-500 mb-3 text-center">
              ❓ Doubts
            </h3>
            <StatCard
              label="Total"
              value={dashboard?.doubts.total || 0}
              color="#4F46E5"
            />
            <StatCard
              label="Open"
              value={dashboard?.doubts.open || 0}
              color="#F59E0B"
            />
            <StatCard
              label="Completed"
              value={dashboard?.doubts.completed || 0}
              color="#10B981"
            />
          </div>

          {/* Sessions Group */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-500 mb-3 text-center">
              🎥 Sessions
            </h3>
            <StatCard
              label="Total"
              value={dashboard?.sessions.total || 0}
              color="#4F46E5"
            />
            <StatCard
              label="Active"
              value={dashboard?.sessions.active || 0}
              color="#F59E0B"
            />
            <StatCard
              label="Completed"
              value={dashboard?.sessions.completed || 0}
              color="#10B981"
            />
          </div>
        </div>

        {/* Revenue Card */}
        <div className="bg-white rounded-2xl p-6 text-center shadow-sm mb-6">
          <p className="text-sm text-gray-500 mb-1">💰 Total Revenue</p>
          <p className="text-3xl font-extrabold text-indigo-600">
            ₹{dashboard?.revenue || "0"}
          </p>
        </div>

        {/* Quick Actions */}
        <h2 className="text-lg font-bold text-gray-800 mb-3">
          ⚡ Quick Actions
        </h2>
        <div className="flex flex-wrap gap-4 mb-8">
          <ActionCard
            title="📋 View Doubts"
            onPress={() => router.push("/admin/doubts")}
          />
          <ActionCard
            title="📅 View Sessions"
            onPress={() => router.push("/admin/sessions")}
          />
          <ActionCard
            title="💲 Pricing"
            onPress={() => router.push("/admin/pricing")}
          />
          <ActionCard
            title="📈 Reports"
            onPress={() => router.push("/admin/reports")}
          />
          <ActionCard
            title="💰 Tutor Earnings"
            onPress={() => router.push("/admin/tutor-earnings")}
          />
          <ActionCard
            title="👥 Manage Users"
            onPress={() => router.push("/admin/users")}
          />
        </div>

        {/* Tip Card */}
        <div className="bg-indigo-50 rounded-2xl p-5 flex items-start gap-3 mb-8">
          <span className="text-2xl">💡</span>
          <div>
            <h3 className="font-semibold text-indigo-800">Admin Tip</h3>
            <p className="text-sm text-gray-700">
              Regularly review open doubts and active sessions to ensure smooth
              platform operation. Use the sidebar for quick navigation.
            </p>
          </div>
        </div>

        {/* Logout (alternative) */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white py-3 text-red-600 hover:bg-red-50 transition"
        >
          🚪 Sign Out
        </button>
      </div>

      {/* Slide‑in animation keyframe (add to global CSS or tailwind config) */}
      <style jsx global>{`
        @keyframes slideInLeft {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slideInLeft {
          animation: slideInLeft 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}