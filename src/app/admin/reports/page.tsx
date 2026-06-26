"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  getAdminReports,
  AdminReportFilters,
} from "@/services/v1Service";
import AdminLayout from "@/app/admin/AdminLayout";
import toast from "react-hot-toast";

// ---------- Types ----------
interface AdminReport {
  report_id: number;
  session_id: number;
  reason: string;
  status: string;
  is_read: boolean;
  created_at: string;
  student: {
    id: number;
    name: string;
  };
  tutor: {
    id: number;
    name: string;
  };
  doubt: {
    id: number;
    title: string;
  };
}

// ---------- Badge styling (dark theme) ----------
const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    pending: "bg-amber-400/20 text-amber-300 border-amber-400/40",
    under_review: "bg-sky-400/20 text-sky-300 border-sky-400/40",
    resolved: "bg-emerald-400/20 text-emerald-300 border-emerald-400/40",
    rejected: "bg-rose-400/20 text-rose-300 border-rose-400/40",
  };
  return map[status] || "bg-gray-400/20 text-gray-300 border-gray-400/40";
};

const statusIcons: Record<string, string> = {
  pending: "⏳",
  under_review: "🔍",
  resolved: "✅",
  rejected: "❌",
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

// ---------- Skeleton Loader (dark) ----------
const ReportCardSkeleton = () => (
  <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 animate-pulse flex flex-col gap-3">
    <div className="h-5 w-3/4 bg-white/10 rounded" />
    <div className="h-4 w-full bg-white/10 rounded" />
    <div className="flex gap-2 mt-2">
      <div className="h-6 w-20 bg-white/10 rounded-full" />
      <div className="h-6 w-16 bg-white/10 rounded-full" />
    </div>
    <div className="flex justify-between items-center mt-4">
      <div className="h-4 w-24 bg-white/10 rounded" />
      <div className="h-8 w-28 bg-white/10 rounded-lg" />
    </div>
  </div>
);

export default function AdminReportsPage() {
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [reasonFilter, setReasonFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: AdminReportFilters = {
        page,
        page_size: 9,
      };

      if (statusFilter) {
        params.status = statusFilter as any;
      }
      if (reasonFilter) {
        params.reason = reasonFilter as any;
      }
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }

      const res = await getAdminReports(params);

      console.log("ADMIN REPORTS:", res);

      const reportList: AdminReport[] = res?.results?.data ?? [];
      setReports(reportList);

      const total = res?.count ?? 0;
      setTotalPages(Math.max(1, Math.ceil(total / 9)));
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.error ||
        err?.message ||
        "Failed to load reports"
      );
      toast.error(err?.response?.data?.error || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, reasonFilter, searchTerm]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return (
    <AdminLayout>
      <div className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 flex items-center gap-2">
              <span className="text-4xl">🚨</span> Reports Dashboard
            </h1>
            <p className="text-white/70 mt-1 font-medium">
              Manage and review all user reports
            </p>
          </div>
          <Link
            href="/admin/reports/analytics"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-violet-300 font-semibold hover:bg-white/20 hover:text-white mt-4 sm:mt-0 transition-all"
          >
            📊 Analytics
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-2xl mb-8 flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search student/tutor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[200px] bg-gray-900/60 border-2 border-white/20 rounded-xl px-4 py-2 text-sm text-white placeholder-white/40 focus:ring-4 focus:ring-violet-500/50 focus:border-violet-400 outline-none transition-all"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-900/60 border-2 border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:ring-4 focus:ring-violet-500/50 focus:border-violet-400 outline-none appearance-none cursor-pointer"
          >
            <option value="" className="bg-gray-900">All Statuses</option>
            <option value="pending" className="bg-gray-900">Pending</option>
            <option value="under_review" className="bg-gray-900">Under Review</option>
            <option value="resolved" className="bg-gray-900">Resolved</option>
            <option value="rejected" className="bg-gray-900">Rejected</option>
          </select>
          <select
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className="bg-gray-900/60 border-2 border-white/20 rounded-xl px-3 py-2 text-sm text-white focus:ring-4 focus:ring-violet-500/50 focus:border-violet-400 outline-none appearance-none cursor-pointer"
          >
            <option value="" className="bg-gray-900">All Reasons</option>
            {Object.entries(reasonLabels).map(([value, label]) => (
              <option key={value} value={value} className="bg-gray-900">
                {label}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              setPage(1);
              fetchReports();
            }}
            className="px-4 py-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl font-bold hover:from-violet-600 hover:to-fuchsia-600 transition shadow-lg shadow-violet-500/25"
          >
            Apply Filters
          </button>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-400/40 text-rose-300 rounded-2xl p-4 mb-6 flex items-center justify-between backdrop-blur-md">
            <span className="font-medium">⚠️ {error}</span>
            <button
              onClick={fetchReports}
              className="px-4 py-1.5 bg-rose-400/20 hover:bg-rose-400/30 rounded-xl font-medium text-sm text-rose-200"
            >
              Retry
            </button>
          </div>
        )}

        {/* Reports Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <ReportCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {reports.length === 0 ? (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-20 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg"
              >
                <div className="text-5xl mb-4">📋</div>
                <h2 className="text-2xl font-bold text-white">
                  No reports found
                </h2>
                <p className="text-white/70 mt-2">
                  There are no reports matching your filters.
                </p>
              </motion.div>
            ) : (
              <div
                key="report-grid"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {reports.map((report) => (
                  <motion.div
                    key={report.report_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                    whileHover={{ scale: 1.02, borderColor: "rgba(167, 139, 250, 0.6)" }}
                    className="group bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-violet-400/40 transition-all shadow-xl"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-white truncate pr-2">
                        {reasonLabels[report.reason] || report.reason}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusBadge(
                          report.status
                        )}`}
                      >
                        {statusIcons[report.status]}{" "}
                        {report.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="text-sm text-white/70 line-clamp-2 mb-3">
                      📚 {report.doubt.title}
                    </div>
                    <div className="text-xs text-white/60 flex flex-wrap gap-2 mb-4">
                      <span>👨‍🎓 {report.student.name}</span>
                      <span>👨‍🏫 {report.tutor.name}</span>
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-xs text-white/50">
                        {new Date(report.created_at).toLocaleDateString()}
                      </span>
                      <Link
                        href={`/admin/reports/${report.report_id}`}
                        className="px-4 py-2 bg-violet-500/20 text-violet-300 rounded-lg text-sm font-semibold hover:bg-violet-500/30 hover:text-white transition border border-violet-400/30"
                      >
                        View Details
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl disabled:opacity-40 hover:bg-white/20 transition text-white font-medium"
            >
              Previous
            </button>
            <span className="text-sm text-white/80 font-medium">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl disabled:opacity-40 hover:bg-white/20 transition text-white font-medium"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}