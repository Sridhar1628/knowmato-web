"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { getAdminDashboard } from "@/services/v1Service";
import AdminLayout from "@/app/admin/AdminLayout";
import toast from "react-hot-toast";

// ---------- Types ----------
interface DashboardData {
  doubts: { total: number; open: number; completed: number };
  sessions: { total: number; active: number; completed: number };
  revenue: string;
}

// ---------- Animated Stat Card (dark theme) ----------
const StatCard = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.3 }}
    className="flex items-center justify-between rounded-xl bg-white/5 backdrop-blur-md p-4 border border-white/10 hover:border-white/20 transition-all"
  >
    <span className="text-sm font-medium text-white/70">{label}</span>
    <span className="text-xl font-bold" style={{ color }}>
      {value}
    </span>
  </motion.div>
);

// ---------- Quick Action Card (dark theme) ----------
const QuickAction = ({
  title,
  icon,
  path,
}: {
  title: string;
  icon: string;
  path: string;
}) => {
  const router = useRouter();
  return (
    <motion.button
      whileHover={{ scale: 1.03, borderColor: "rgba(167, 139, 250, 0.6)" }}
      whileTap={{ scale: 0.98 }}
      onClick={() => router.push(path)}
      className="flex items-center gap-2 bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10 hover:border-violet-400/40 transition-all text-left"
    >
      <span className="text-2xl">{icon}</span>
      <span className="font-semibold text-white/80 text-sm">{title}</span>
    </motion.button>
  );
};

export default function AdminDashboardPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await getAdminDashboard();
      setDashboard(res?.data || res);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load dashboard");
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

  const displayName = user?.display_name || user?.email?.split("@")[0] || "Admin";

  if (loading && !refreshing) {
    return (
      <AdminLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
            <p className="mt-4 text-white/60">Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

        {/* Content wrapper with padding to account for AdminLayout's internal padding */}
        <div className="relative z-10 p-4 sm:p-6 lg:p-8">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between mb-8"
          >
            <div>
              <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 flex items-center gap-2">
                Welcome back, {displayName} 👑
              </h1>
              <p className="text-white/70 mt-1">Here’s what’s happening today.</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-violet-300 font-medium hover:bg-white/20 hover:text-white transition disabled:opacity-50 mt-4 sm:mt-0"
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
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Doubts */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl"
            >
              <h2 className="font-semibold text-white/80 mb-4">❓ Doubts Overview</h2>
              <div className="space-y-3">
                <StatCard label="Total" value={dashboard?.doubts.total || 0} color="#818cf8" />
                <StatCard label="Open" value={dashboard?.doubts.open || 0} color="#fbbf24" />
                <StatCard label="Completed" value={dashboard?.doubts.completed || 0} color="#34d399" />
              </div>
            </motion.div>

            {/* Sessions */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl"
            >
              <h2 className="font-semibold text-white/80 mb-4">🎥 Sessions Overview</h2>
              <div className="space-y-3">
                <StatCard label="Total" value={dashboard?.sessions.total || 0} color="#818cf8" />
                <StatCard label="Active" value={dashboard?.sessions.active || 0} color="#fbbf24" />
                <StatCard label="Completed" value={dashboard?.sessions.completed || 0} color="#34d399" />
              </div>
            </motion.div>
          </div>

          {/* Revenue Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl p-6 text-white shadow-xl shadow-violet-500/25 mb-8"
          >
            <p className="text-sm opacity-80">💰 Total Revenue</p>
            <p className="text-4xl font-extrabold mt-2">₹{dashboard?.revenue || "0"}</p>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="font-semibold text-white/80 mb-4">⚡ Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <QuickAction title="View Doubts" icon="📋" path="/admin/doubts" />
              <QuickAction title="View Sessions" icon="📅" path="/admin/sessions" />
              <QuickAction title="Reports" icon="📈" path="/admin/reports" />
              <QuickAction title="Pricing" icon="💲" path="/admin/pricing" />
              <QuickAction title="Tutor Earnings" icon="💰" path="/admin/tutor-earnings" />
              <QuickAction title="Manage Users" icon="👥" path="/admin/users" />
              <QuickAction title="Current Affairs" icon="📰" path="/admin/current-affairs" />
              <QuickAction title="Tutor Applications" icon="📝" path="/admin/tutor-applications" />
              <QuickAction title="Tutor Wallet Verifications" icon="📝" path="/admin/verifications" />
            </div>
          </motion.div>

          {/* Tip Card */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 flex gap-3"
          >
            <span className="text-2xl">💡</span>
            <div>
              <h3 className="font-semibold text-violet-300">Admin Tip</h3>
              <p className="text-sm text-white/70">
                Regularly check open doubts and active sessions to ensure a smooth experience.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
}