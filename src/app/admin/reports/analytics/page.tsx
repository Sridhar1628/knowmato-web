// app/admin/reports/analytics/page.tsx

"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { getReportAnalytics } from "@/services/v1Service";
import AdminLayout from "@/app/admin/AdminLayout";
import toast from "react-hot-toast";

// ---------- Types ----------
interface ReasonBreakdown {
  reason: string;
  count: number;
}

interface StatusBreakdown {
  status: string;
  count: number;
}

interface ReportAnalytics {
  total: number;
  pending: number;
  under_review: number;
  resolved: number;
  rejected: number;
  unread: number;
  reason_breakdown?: ReasonBreakdown[];
  status_breakdown?: StatusBreakdown[];
}

// ---------- Badge helpers ----------
const statusColors: Record<string, string> = {
  pending: "from-amber-400 to-amber-300",
  under_review: "from-blue-400 to-blue-300",
  resolved: "from-emerald-400 to-emerald-300",
  rejected: "from-red-400 to-red-300",
};

const statusBgClass: Record<string, string> = {
  pending: "bg-amber-400",
  under_review: "bg-sky-400",
  resolved: "bg-emerald-400",
  rejected: "bg-rose-400",
};

const reasonLabels: Record<string, string> = {
  rude: "Rude Behaviour",
  late: "Late Arrival",
  poor_explanation: "Poor Explanation",
  wrong_information: "Wrong Information",
  harassment: "Harassment",
  spam: "Spam",
  other: "Other",
};

// ---------- Animated Counter ----------
const AnimatedCounter = ({ value, duration = 1 }: { value: number; duration?: number }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const startTime = useRef(Date.now());

  useEffect(() => {
    if (value === 0) {
      setCount(0);
      return;
    }
    startTime.current = Date.now();
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime.current) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      const current = Math.floor(progress * value);
      if (current !== countRef.current) {
        countRef.current = current;
        setCount(current);
      }
      if (progress >= 1) {
        clearInterval(interval);
        setCount(value);
      }
    }, 16);
    return () => clearInterval(interval);
  }, [value, duration]);

  return <span>{count}</span>;
};

// ---------- Skeleton Loader (dark) ----------
const AnalyticsSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-8 w-1/3 bg-white/10 rounded" />
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10">
          <div className="h-4 w-20 bg-white/10 rounded mb-2" />
          <div className="h-8 w-16 bg-white/10 rounded" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
        <div className="h-5 w-24 bg-white/10 rounded mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-4 w-24 bg-white/10 rounded" />
              <div className="h-4 w-12 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
        <div className="h-5 w-24 bg-white/10 rounded mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-4 w-20 bg-white/10 rounded" />
              <div className="h-4 w-12 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default function ReportAnalyticsPage() {
  const [analytics, setAnalytics] = useState<ReportAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getReportAnalytics();
      const data = response.data || response; // adjust based on actual API shape
      setAnalytics(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load analytics");
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden p-4 sm:p-6 lg:p-8">
        {/* Background blobs */}
        <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between mb-8"
          >
            <div>
              <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 flex items-center gap-2">
                <span className="text-4xl">📊</span> Report Analytics
              </h1>
              <p className="text-white/70 mt-1 font-medium">
                Insights and statistics on user reports
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={fetchAnalytics}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white font-semibold hover:bg-white/20 transition mt-4 sm:mt-0"
            >
              <svg
                className="h-4 w-4"
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
              Refresh
            </motion.button>
          </motion.div>

          {loading ? (
            <AnalyticsSkeleton />
          ) : error ? (
            <div className="bg-rose-500/10 border border-rose-400/40 text-rose-300 rounded-2xl p-4 mb-6 flex items-center justify-between backdrop-blur-md">
              <span className="font-medium">⚠️ {error}</span>
              <button
                onClick={fetchAnalytics}
                className="px-4 py-1.5 bg-rose-400/20 hover:bg-rose-400/30 rounded-xl font-medium text-sm text-rose-200"
              >
                Retry
              </button>
            </div>
          ) : !analytics ? (
            <div className="text-center py-20 text-white/60">No data available.</div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div
                  whileHover={{ y: -4 }}
                  className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-xl hover:border-violet-400/40 transition"
                >
                  <p className="text-sm text-white/70 font-medium">Total Reports</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    <AnimatedCounter value={analytics.total} />
                  </p>
                </motion.div>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-xl hover:border-amber-400/40 transition"
                >
                  <p className="text-sm text-amber-300/80 font-medium">Pending</p>
                  <p className="text-3xl font-bold text-amber-400 mt-2">
                    <AnimatedCounter value={analytics.pending} />
                  </p>
                </motion.div>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-xl hover:border-emerald-400/40 transition"
                >
                  <p className="text-sm text-emerald-300/80 font-medium">Resolved</p>
                  <p className="text-3xl font-bold text-emerald-400 mt-2">
                    <AnimatedCounter value={analytics.resolved} />
                  </p>
                </motion.div>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-xl hover:border-rose-400/40 transition"
                >
                  <p className="text-sm text-rose-300/80 font-medium">Rejected</p>
                  <p className="text-3xl font-bold text-rose-400 mt-2">
                    <AnimatedCounter value={analytics.rejected} />
                  </p>
                </motion.div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Reasons Breakdown */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl"
                >
                  <h2 className="text-lg font-bold text-white mb-4">📌 Reasons Breakdown</h2>
                  <div className="space-y-4">
                    {analytics.reason_breakdown?.length ? (
                      analytics.reason_breakdown.map((rb) => (
                        <div key={rb.reason}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-white/80">
                              {reasonLabels[rb.reason] || rb.reason}
                            </span>
                            <span className="text-white/60 font-medium">{rb.count}</span>
                          </div>
                          <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(rb.count / analytics.total) * 100}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className={`h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400`}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-white/40 text-sm">No reason data available.</p>
                    )}
                  </div>
                </motion.div>

                {/* Status Breakdown */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl"
                >
                  <h2 className="text-lg font-bold text-white mb-4">🚦 Status Distribution</h2>
                  <div className="space-y-4">
                    {analytics.status_breakdown?.length ? (
                      analytics.status_breakdown.map((sb) => (
                        <div key={sb.status}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-white/80 capitalize">
                              {sb.status.replace("_", " ")}
                            </span>
                            <span className="text-white/60 font-medium">{sb.count}</span>
                          </div>
                          <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(sb.count / analytics.total) * 100}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className={`h-full rounded-full ${statusBgClass[sb.status] || "bg-violet-400"}`}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-white/40 text-sm">No status data available.</p>
                    )}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}