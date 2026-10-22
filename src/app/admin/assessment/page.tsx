
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import AdminLayout from "@/app/admin/AdminLayout";
import AlertService from "@/services/alertService";
import {
  getAssignments,
  type Assignment,
} from "@/services/assessmentService";

const getExpiryDate = (value: string | null | undefined): Date | null => {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const isAssignmentExpired = (
  assignment: Assignment,
  now: Date,
): boolean => {
  if (assignment.status?.toLowerCase() === "expired") return true;

  const expiryDate = getExpiryDate(assignment.date_of_expiry);
  return expiryDate !== null && expiryDate < now;
};

const formatExpiryDate = (value: string | null | undefined): string => {
  const date = getExpiryDate(value);
  return date ? date.toLocaleDateString() : "Not set";
};

// ---------- Animated Stat Card ----------
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
    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md transition-all hover:border-white/20"
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
      type="button"
      whileHover={{ scale: 1.03, borderColor: "rgba(167, 139, 250, 0.6)" }}
      whileTap={{ scale: 0.98 }}
      onClick={() => router.push(path)}
      className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-4 text-left backdrop-blur-md transition-all hover:border-violet-400/40"
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-sm font-semibold text-white/80">{title}</span>
    </motion.button>
  );
};

export default function AdminAssessmentDashboard() {
  const router = useRouter();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const now = new Date();
  const total = assignments.length;
  const expired = assignments.filter((assignment) =>
    isAssignmentExpired(assignment, now),
  ).length;
  const active = total - expired;

  const fetchAssignments = useCallback(async () => {
    try {
      const data = await getAssignments();

      const sorted = [...(data || [])].sort((a, b) => {
        const dateA = getExpiryDate(a.date_of_expiry);
        const dateB = getExpiryDate(b.date_of_expiry);

        // Assignments with a known expiry date appear first.
        if (!dateA && !dateB) return a.id - b.id;
        if (!dateA) return 1;
        if (!dateB) return -1;

        return dateA.getTime() - dateB.getTime();
      });

      setAssignments(sorted);
    } catch {
      AlertService.error("Load Failed", "Failed to load assignments");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchAssignments();
  }, [fetchAssignments]);

  const handleRefresh = () => {
    if (refreshing) return;

    setRefreshing(true);
    void fetchAssignments();
  };

  if (loading && !refreshing) {
    return (
      <AdminLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
            <p className="mt-4 text-white/60">
              Loading assessment data...
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
        {/* Background blobs */}
        <div className="animate-blob absolute left-[-5rem] top-0 h-72 w-72 rounded-full bg-purple-500/20 mix-blend-multiply blur-3xl" />
        <div className="animate-blob animation-delay-2000 absolute right-[-5rem] top-0 h-72 w-72 rounded-full bg-fuchsia-500/20 mix-blend-multiply blur-3xl" />
        <div className="animate-blob animation-delay-4000 absolute -bottom-20 left-40 h-72 w-72 rounded-full bg-cyan-500/20 mix-blend-multiply blur-3xl" />

        <div className="relative z-10 p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex flex-col justify-between sm:flex-row sm:items-center"
          >
            <div>
              <h1 className="flex items-center gap-2 bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-3xl font-extrabold text-transparent">
                📚 Assessment Dashboard
              </h1>
              <p className="mt-1 text-white/70">
                Manage assignments, questions, and MCQs.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="mt-4 flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 font-medium text-violet-300 backdrop-blur-md transition hover:bg-white/20 hover:text-white disabled:opacity-50 sm:mt-0"
            >
              <svg
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
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
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl"
            >
              <h2 className="mb-4 font-semibold text-white/80">
                📊 Assignment Stats
              </h2>
              <div className="space-y-3">
                <StatCard label="Total" value={total} color="#818cf8" />
                <StatCard label="Active" value={active} color="#34d399" />
                <StatCard label="Expired" value={expired} color="#f87171" />
              </div>
            </motion.div>

            {/* Question Bank */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl"
            >
              <h2 className="mb-4 font-semibold text-white/80">
                ❓ Question Bank
              </h2>
              <div className="space-y-3 text-sm text-white/50">
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
              className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl"
            >
              <h2 className="mb-4 font-semibold text-white/80">
                ⚡ Admin Actions
              </h2>
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
                  icon="📈"
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
            <h2 className="mb-4 font-semibold text-white/80">
              📋 All Assignments
            </h2>

            {assignments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-12 text-center backdrop-blur-xl">
                <p className="text-white/50">No assignments found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map((assignment) => {
                  const isExpired = isAssignmentExpired(assignment, now);

                  return (
                    <motion.div
                      key={assignment.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg backdrop-blur-xl transition hover:border-violet-400/40 sm:flex-row sm:items-center"
                    >
                      <div className="mb-3 sm:mb-0">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-white">
                            Assignment #{assignment.id}
                          </span>

                          <span className="rounded-full border border-violet-400/30 bg-violet-400/20 px-2 py-0.5 text-[10px] font-bold text-violet-300">
                            Batch {assignment.batch}
                          </span>

                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                              isExpired
                                ? "border-red-400/30 bg-red-400/20 text-red-300"
                                : "border-emerald-400/30 bg-emerald-400/20 text-emerald-300"
                            }`}
                          >
                            {isExpired ? "Expired" : "Active"}
                          </span>
                        </div>

                        <p className="text-xs text-white/50">
                          Total Score: {assignment.total_marks || "N/A"}
                          {" • "}Expiry:{" "}
                          {formatExpiryDate(assignment.date_of_expiry)}
                          {assignment.time && ` at ${assignment.time}`}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/admin/assessment/assignments/${assignment.id}`,
                            )
                          }
                          className="rounded-lg border border-violet-400/30 bg-violet-500/20 px-3 py-1.5 text-xs font-bold text-violet-300 transition hover:bg-violet-500/30"
                        >
                          View Details
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/admin/assessment/assignments/${assignment.id}/edit`,
                            )
                          }
                          className="rounded-lg border border-fuchsia-400/30 bg-fuchsia-500/20 px-3 py-1.5 text-xs font-bold text-fuchsia-300 transition hover:bg-fuchsia-500/30"
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
