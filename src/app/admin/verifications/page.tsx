// app/admin/verifications/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  getAdminVerifications,
  updateAdminVerification,
  AdminVerificationFilters,
} from "@/services/v1Service";

// ---------- Types ----------
interface VerificationItem {
  verification_id: number;
  tutor: {
    id: number;
    name: string;
    email: string;
  };
  bank_name: string;
  account_holder_name: string;
  status: string; // 'pending' | 'under_review' | 'approved' | 'rejected'
  created_at: string;
}

// ---------- Badge ----------
const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    under_review: "bg-blue-100 text-blue-800 border-blue-200",
    approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
  };
  return map[status] || "bg-gray-100 text-gray-800 border-gray-200";
};

const statusIcons: Record<string, string> = {
  pending: "⏳",
  under_review: "🔍",
  approved: "✅",
  rejected: "❌",
};

// ---------- Skeleton ----------
const VerificationCardSkeleton = () => (
  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-pulse flex flex-col gap-3">
    <div className="h-5 w-3/4 bg-gray-200 rounded" />
    <div className="h-4 w-full bg-gray-100 rounded" />
    <div className="flex gap-2 mt-2">
      <div className="h-6 w-20 bg-gray-200 rounded-full" />
      <div className="h-6 w-16 bg-gray-200 rounded-full" />
    </div>
    <div className="flex justify-between items-center mt-4">
      <div className="h-4 w-24 bg-gray-200 rounded" />
      <div className="h-8 w-28 bg-gray-200 rounded-lg" />
    </div>
  </div>
);

export default function AdminVerificationsPage() {
  const [verifications, setVerifications] = useState<VerificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Action states
  const [actionLoading, setActionLoading] = useState<number | null>(null); // track which verification is being updated

  const fetchVerifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: AdminVerificationFilters = {
        page,
        page_size: 9,
      };
      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.status = statusFilter as any;

      const res = await getAdminVerifications(params);
      // adapt response shape – the service returns paginated data inside .data or .results
      const data = res?.data?.data ?? res?.data ?? [];
      const count = res?.data?.count ?? 0;
      setVerifications(data);
      setTotalPages(Math.ceil(count / 9) || 1);
    } catch (err: any) {
      setError(err?.message || "Failed to load verifications");
      toast.error("Failed to load verifications");
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, statusFilter]);

  useEffect(() => {
    fetchVerifications();
  }, [fetchVerifications]);

  // ---------- Quick Approve / Reject ----------
  const handleStatusUpdate = async (
    verificationId: number,
    newStatus: "approved" | "rejected",
    rejectionReason?: string
  ) => {
    const confirmMsg =
      newStatus === "approved"
        ? "Approve this verification?"
        : "Reject this verification?";
    if (!window.confirm(confirmMsg)) return;

    setActionLoading(verificationId);
    try {
      await updateAdminVerification(verificationId, {
        status: newStatus,
        rejection_reason: rejectionReason || "",
      });
      toast.success(`Verification ${newStatus}`);
      // optimistic update – remove from list or update status
      setVerifications((prev) =>
        prev.map((v) =>
          v.verification_id === verificationId ? { ...v, status: newStatus } : v
        )
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  // ---------- Render ----------
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50/30 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
              <span className="text-4xl">🏦</span> Bank Verifications
            </h1>
            <p className="text-gray-700 mt-1 font-medium">
              Review and manage tutor bank details
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 mb-8 flex flex-wrap gap-4">
          <input
            type="text"
            placeholder="Search tutor, bank, account holder..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[200px] border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-indigo-400 outline-none"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-indigo-400 outline-none"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <button
            onClick={() => {
              setPage(1);
              fetchVerifications();
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition"
          >
            Apply Filters
          </button>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 mb-6 flex items-center justify-between">
            <span className="font-medium">⚠️ {error}</span>
            <button
              onClick={fetchVerifications}
              className="px-4 py-1.5 bg-red-100 hover:bg-red-200 rounded-xl font-medium text-sm text-red-800"
            >
              Retry
            </button>
          </div>
        )}

        {/* Verifications Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <VerificationCardSkeleton key={i} />
            ))}
          </div>
        ) : verifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 bg-white/50 rounded-2xl border border-white/60 shadow-sm"
          >
            <div className="text-5xl mb-4">📋</div>
            <h2 className="text-2xl font-bold text-gray-900">No verifications found</h2>
            <p className="text-gray-700 mt-2">
              There are no bank verifications matching your filters.
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {verifications.map((item) => (
              <motion.div
                key={item.verification_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-indigo-200 transition-all flex flex-col"
              >
                {/* Tutor Info */}
                <div className="mb-3">
                  <h3 className="font-bold text-gray-900 text-lg">
                    {item.tutor.name}
                  </h3>
                  <p className="text-sm text-gray-600 truncate">{item.tutor.email}</p>
                </div>

                {/* Bank Info */}
                <div className="text-sm text-gray-700 space-y-1 mb-3 flex-1">
                  <p>
                    🏦 {item.bank_name}
                  </p>
                  <p>
                    👤 {item.account_holder_name}
                  </p>
                </div>

                {/* Status & Date */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusBadge(
                      item.status
                    )}`}
                  >
                    {statusIcons[item.status]} {item.status.replace("_", " ")}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-auto">
                  <Link
                    href={`/admin/verifications/${item.verification_id}`}
                    className="flex-1 text-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition"
                  >
                    View Details
                  </Link>
                  {item.status !== "approved" && item.status !== "rejected" && (
                    <>
                      <button
                        onClick={() =>
                          handleStatusUpdate(item.verification_id, "approved")
                        }
                        disabled={actionLoading === item.verification_id}
                        className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          const reason = window.prompt(
                            "Rejection reason (optional):"
                          );
                          handleStatusUpdate(
                            item.verification_id,
                            "rejected",
                            reason || undefined
                          );
                        }}
                        disabled={actionLoading === item.verification_id}
                        className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl disabled:opacity-50 hover:bg-gray-50 transition text-gray-800 font-medium"
            >
              Previous
            </button>
            <span className="text-sm text-gray-800 font-medium">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl disabled:opacity-50 hover:bg-gray-50 transition text-gray-800 font-medium"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}