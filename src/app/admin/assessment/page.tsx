"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import AdminLayout from "@/app/admin/AdminLayout";
import AlertService from "@/services/alertService";
import {
  getAssignments,
  Assignment,
  updateAssignmentExpiry,
} from "@/services/assessmentService";

// ---------- Animated Stat Card (reused from admin dashboard) ----------
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

// ---------- Quick Action Card ----------
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

export default function AdminAssessmentDashboard() {
  const router = useRouter();

  // ─── state ──────────────────────────────────────
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ─── computed stats ─────────────────────────────
  const now = new Date();
  const total = assignments.length;
  const active = assignments.filter((a) => {
    const expired =
      a.status?.toLowerCase() === "expired" ||
      new Date(a.date_of_expiry) < now;
    return !expired;
  }).length;
  const expired = total - active;

  // ─── fetch assignments ──────────────────────────
  const fetchAssignments = useCallback(async () => {
    try {
      const data = await getAssignments();
      // sort by expiry soonest first
      const sorted = (data || []).sort(
        (a, b) =>
          new Date(a.date_of_expiry).getTime() -
          new Date(b.date_of_expiry).getTime()
      );
      setAssignments(sorted);
    } catch (error) {
      AlertService.error("Load Failed", "Failed to load assignments");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // ─── handle refresh ─────────────────────────────
  const handleRefresh = () => {
    setRefreshing(true);
    fetchAssignments();
  };

  // ─── loading skeleton ───────────────────────────
  if (loading && !refreshing) {
    return (
      <AdminLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
            <p className="mt-4 text-white/60">Loading assessment data...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

        <div className="relative z-10 p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between mb-8"
          >
            <div>
              <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 flex items-center gap-2">
                📚 Assessment Dashboard
              </h1>
              <p className="text-white/70 mt-1">
                Manage assignments, questions, and MCQs.
              </p>
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

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl"
            >
              <h2 className="font-semibold text-white/80 mb-4">📊 Assignment Stats</h2>
              <div className="space-y-3">
                <StatCard label="Total" value={total} color="#818cf8" />
                <StatCard label="Active" value={active} color="#34d399" />
                <StatCard label="Expired" value={expired} color="#f87171" />
              </div>
            </motion.div>

            {/* Placeholder for further stats (e.g., total questions) - you can add API calls for those */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl"
            >
              <h2 className="font-semibold text-white/80 mb-4">❓ Question Bank</h2>
              <div className="space-y-3 text-white/50 text-sm">
                <p>📝 Programming questions</p>
                <p>📋 MCQ items</p>
                <p className="text-xs">(Coming soon with stats)</p>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl"
            >
              <h2 className="font-semibold text-white/80 mb-4">⚡ Admin Actions</h2>
              <div className="grid grid-cols-2 gap-2">
                <QuickAction
                  title="Manage Assignments"
                  icon="➕"
                  path="/admin/assessment/assignments"
                />
                <QuickAction
                  title="Manage Questions"
                  icon="💻"
                  path="/admin/assessment/questions"
                />
                <QuickAction
                  title="Manage MCQs"
                  icon="📝"
                  path="/admin/assessment/mcq"
                />
                <QuickAction
                  title="Results"
                  icon="📝"
                  path="/admin/assessment/results"
                />
                <QuickAction
                  title="Analytics"
                  icon="📝"
                  path="/admin/assessment/analytics"
                />
              </div>
            </motion.div>
          </div>

          {/* Assignments List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="font-semibold text-white/80 mb-4">📋 All Assignments</h2>
            {assignments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 backdrop-blur-xl p-12 text-center">
                <p className="text-white/50">No assignments found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map((assignment) => {
                  const isExpired =
                    assignment.status?.toLowerCase() === "expired" ||
                    new Date(assignment.date_of_expiry) < now;
                  return (
                    <motion.div
                      key={assignment.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-lg transition hover:border-violet-400/40"
                    >
                      <div className="mb-3 sm:mb-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-white">
                            Assignment #{assignment.id}
                          </span>
                          <span className="rounded-full bg-violet-400/20 px-2 py-0.5 text-[10px] font-bold text-violet-300 border border-violet-400/30">
                            Batch {assignment.batch}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              isExpired
                                ? "bg-red-400/20 text-red-300 border border-red-400/30"
                                : "bg-emerald-400/20 text-emerald-300 border border-emerald-400/30"
                            }`}
                          >
                            {isExpired ? "Expired" : "Active"}
                          </span>
                        </div>
                        <p className="text-xs text-white/50">
                          Total Score: {assignment.total_marks || "N/A"} • Expiry:{" "}
                          {new Date(assignment.date_of_expiry).toLocaleDateString()}
                          {assignment.time && ` at ${assignment.time}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            router.push(
                              `/admin/assessment/assignments/${assignment.id}`
                            )
                          }
                          className="rounded-lg bg-violet-500/20 px-3 py-1.5 text-xs font-bold text-violet-300 border border-violet-400/30 hover:bg-violet-500/30 transition"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() =>
                            router.push(
                              `/admin/assessment/assignments/${assignment.id}/edit`
                            )
                          }
                          className="rounded-lg bg-fuchsia-500/20 px-3 py-1.5 text-xs font-bold text-fuchsia-300 border border-fuchsia-400/30 hover:bg-fuchsia-500/30 transition"
                        >
                          Edit Expiry
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
}