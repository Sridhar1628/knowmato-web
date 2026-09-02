"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import AdminLayout from "@/app/admin/AdminLayout";
import AlertService from "@/services/alertService";
import {
  getAdminAssignments,
  getAdminAttempts,
  AdminAttemptSummary,
  AdminAssignment,
} from "@/services/assessmentService";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

const COLORS = ["#8b5cf6", "#d946ef", "#06b6d4", "#f59e0b", "#10b981"];

const formatPercentage = (val: number) => `${val.toFixed(0)}%`;

export default function AdminAnalyticsPage() {
  const router = useRouter();

  const [assignments, setAssignments] = useState<AdminAssignment[]>([]);
  const [attempts, setAttempts] = useState<AdminAttemptSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedAssignment, setSelectedAssignment] = useState<number | "">("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [assignRes, attemptRes] = await Promise.all([
        getAdminAssignments(),
        getAdminAttempts({
          assignment_id: selectedAssignment || undefined,
        }),
      ]);
      setAssignments(assignRes || []);

      // Apply date filter locally
      let filtered = attemptRes || [];
      if (dateRange.start) {
        const start = new Date(dateRange.start);
        filtered = filtered.filter((a) =>
          a.submitted_at ? new Date(a.submitted_at) >= start : false
        );
      }
      if (dateRange.end) {
        const end = new Date(dateRange.end);
        end.setHours(23, 59, 59, 999);
        filtered = filtered.filter((a) =>
          a.submitted_at ? new Date(a.submitted_at) <= end : false
        );
      }
      setAttempts(filtered);
    } catch (err) {
      AlertService.error(
        "Analytics Error",
        "Failed to load analytics data"
      );
    } finally {
      setLoading(false);
    }
  }, [selectedAssignment, dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Computed stats
  const avgProg =
    attempts.length > 0
      ? attempts.reduce((sum, a) => sum + a.programming_score, 0) / attempts.length
      : 0;
  const avgMCQ =
    attempts.length > 0
      ? attempts.reduce((sum, a) => sum + a.mcq_score, 0) / attempts.length
      : 0;

  const progStatusData = [
    { name: "Submitted", value: attempts.filter((a) => a.status === "submitted").length },
    { name: "Other", value: attempts.filter((a) => a.status !== "submitted").length },
  ];

  const mcqStatusData = [...progStatusData]; // same data, just for visual consistency

  // Per‑assignment average
  const assignmentAvg = assignments.map((ass) => {
    const forAss = attempts.filter((a) => a.assignment === ass.id);
    const total = forAss.reduce((s, a) => s + a.total_marks, 0);
    return {
      assignment: `#${ass.id}`,
      avgScore: forAss.length > 0 ? (total / forAss.length).toFixed(1) : 0,
    };
  });

  // Submission trend – group by date
  const trendData = (() => {
    const map = new Map<string, number>();
    attempts.forEach((a) => {
      if (a.submitted_at) {
        const date = new Date(a.submitted_at).toLocaleDateString();
        map.set(date, (map.get(date) || 0) + 1);
      }
    });
    return Array.from(map.entries())
      .map(([date, count]) => ({ date, submissions: count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  })();

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
            <p className="mt-4 text-white/60">Loading analytics...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden">
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
              <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300">
                📈 Assessment Analytics
              </h1>
              <p className="text-white/70 mt-1">Track student performance across assignments.</p>
            </div>
            <button
              type="button"
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-violet-300 font-medium hover:bg-white/20 mt-4 sm:mt-0"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </motion.div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-8">
            <select
              value={selectedAssignment}
              onChange={(e) =>
                setSelectedAssignment(e.target.value ? Number(e.target.value) : "")
              }
              className="rounded-xl bg-white/10 border border-white/20 px-4 py-2 text-white text-sm outline-none focus:border-violet-400"
            >
              <option value="">All Assignments</option>
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>
                  Assignment #{a.id} (Batch {a.batch})
                </option>
              ))}
            </select>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
              className="rounded-xl bg-white/10 border border-white/20 px-4 py-2 text-white text-sm outline-none focus:border-violet-400"
            />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
              className="rounded-xl bg-white/10 border border-white/20 px-4 py-2 text-white text-sm outline-none focus:border-violet-400"
            />
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl"
            >
              <h3 className="font-semibold text-white/80 mb-2">💻 Avg Programming Score</h3>
              <p className="text-3xl font-bold text-violet-300">{formatPercentage(avgProg)}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl"
            >
              <h3 className="font-semibold text-white/80 mb-2">📝 Avg MCQ Score</h3>
              <p className="text-3xl font-bold text-fuchsia-300">{formatPercentage(avgMCQ)}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl"
            >
              <h3 className="font-semibold text-white/80 mb-2">📊 Total Submissions</h3>
              <p className="text-3xl font-bold text-cyan-300">{attempts.length}</p>
            </motion.div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Per Assignment Bar Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl"
            >
              <h3 className="font-semibold text-white/80 mb-4">📋 Average Score per Assignment</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={assignmentAvg}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="assignment" stroke="#cbd5e1" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#cbd5e1" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15,12,41,0.9)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "12px",
                      color: "#fff",
                    }}
                  />
                  <Bar dataKey="avgScore" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Submission Trend */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl"
            >
              <h3 className="font-semibold text-white/80 mb-4">📅 Submission Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke="#cbd5e1" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#cbd5e1" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15,12,41,0.9)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "12px",
                      color: "#fff",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="submissions"
                    stroke="#06b6d4"
                    strokeWidth={3}
                    dot={{ fill: "#06b6d4", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Completion Pie (Programming & MCQ share same attempt status) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl"
            >
              <h3 className="font-semibold text-white/80 mb-4">📦 Attempt Completion</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={progStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent = 0 }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {progStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15,12,41,0.9)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "12px",
                      color: "#fff",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>

            {/* MCQ Completion (same as above, but you could differentiate later) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl"
            >
              <h3 className="font-semibold text-white/80 mb-4">📝 MCQ Completion</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={mcqStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent = 0 }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {mcqStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15,12,41,0.9)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "12px",
                      color: "#fff",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}