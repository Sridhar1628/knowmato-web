// app/admin/withdrawals/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  getAdminWithdrawals,
  updateAdminWithdrawal,
  AdminWithdrawalFilters,
} from "@/services/v1Service";
import AdminLayout from "@/app/admin/AdminLayout";

// ---------- Types ----------
interface WithdrawalItem {
  withdrawal_id: number;
  tutor: {
    id: number;
    name: string;
    email: string;
  };
  amount: number;
  status: string; // pending, processing, completed, rejected
  created_at: string;
}

// ---------- Badge (dark) ----------
const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    pending: "bg-amber-400/20 text-amber-300 border-amber-400/40",
    processing: "bg-purple-400/20 text-purple-300 border-purple-400/40",
    completed: "bg-emerald-400/20 text-emerald-300 border-emerald-400/40",
    rejected: "bg-rose-400/20 text-rose-300 border-rose-400/40",
  };
  return map[status] || "bg-gray-400/20 text-gray-300 border-gray-400/40";
};

const statusIcons: Record<string, string> = {
  pending: "⏳",
  processing: "🔄",
  completed: "✅",
  rejected: "❌",
};

// ---------- Skeleton (dark) ----------
const WithdrawalCardSkeleton = () => (
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

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Action loading
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchWithdrawals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: AdminWithdrawalFilters = {
        page,
        page_size: 9,
      };
      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.status = statusFilter as any;

      const res = await getAdminWithdrawals(params);
      const data = res?.results?.data ?? [];
      const count = res?.count ?? 0;
      setWithdrawals(data);
      setTotalPages(Math.ceil(count / 9) || 1);
    } catch (err: any) {
      setError(err?.message || "Failed to load withdrawals");
      toast.error("Failed to load withdrawals");
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, statusFilter]);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  // ---------- Handle status update ----------
  const handleStatusUpdate = async (
    withdrawalId: number,
    newStatus: "processing" | "completed" | "rejected",
    adminNotes?: string
  ) => {
    setActionLoading(withdrawalId);
    try {
      await updateAdminWithdrawal(withdrawalId, {
        status: newStatus,
        admin_notes: adminNotes || "",
      });
      toast.success(`Withdrawal ${newStatus}`);
      // Optimistic update
      setWithdrawals((prev) =>
        prev.map((w) =>
          w.withdrawal_id === withdrawalId ? { ...w, status: newStatus } : w
        )
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 relative">
        {/* Background blobs */}
        <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob pointer-events-none" />
        <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000 pointer-events-none" />
        <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000 pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between mb-8"
          >
            <div>
              <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 flex items-center gap-2">
                <span className="text-4xl">💸</span> Withdrawal Requests
              </h1>
              <p className="text-white/70 mt-1 font-medium">
                Process tutor payout requests
              </p>
            </div>
          </motion.div>

          {/* Filters */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-2xl mb-8 flex flex-wrap gap-4">
            <input
              type="text"
              placeholder="Search tutor name, bank..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[200px] bg-gray-900/60 border-2 border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/40 focus:ring-4 focus:ring-violet-500/50 focus:border-violet-400 outline-none transition-all"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-900/60 border-2 border-white/20 rounded-xl px-3 py-2.5 text-sm text-white focus:ring-4 focus:ring-violet-500/50 focus:border-violet-400 outline-none appearance-none cursor-pointer"
            >
              <option value="" className="bg-gray-900">All Statuses</option>
              <option value="pending" className="bg-gray-900">Pending</option>
              <option value="processing" className="bg-gray-900">Processing</option>
              <option value="completed" className="bg-gray-900">Completed</option>
              <option value="rejected" className="bg-gray-900">Rejected</option>
            </select>
            <button
              onClick={() => {
                setPage(1);
                fetchWithdrawals();
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl font-bold hover:from-violet-600 hover:to-fuchsia-600 transition shadow-lg shadow-violet-500/25"
            >
              Apply Filters
            </button>
          </div>

          {/* Error state */}
          {error && (
            <div className="bg-rose-500/10 border border-rose-400/40 text-rose-300 rounded-2xl p-4 mb-6 flex items-center justify-between backdrop-blur-md">
              <span className="font-medium">⚠️ {error}</span>
              <button
                onClick={fetchWithdrawals}
                className="px-4 py-1.5 bg-rose-400/20 hover:bg-rose-400/30 rounded-xl font-medium text-sm text-rose-200"
              >
                Retry
              </button>
            </div>
          )}

          {/* Withdrawals Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <WithdrawalCardSkeleton key={i} />
              ))}
            </div>
          ) : withdrawals.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg"
            >
              <div className="text-5xl mb-4">📋</div>
              <h2 className="text-2xl font-bold text-white">No withdrawals found</h2>
              <p className="text-white/70 mt-2">
                There are no withdrawal requests matching your filters.
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {withdrawals.map((item) => (
                <motion.div
                  key={item.withdrawal_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4, borderColor: "rgba(167, 139, 250, 0.6)" }}
                  transition={{ duration: 0.2 }}
                  className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-violet-400/40 transition-all flex flex-col shadow-xl"
                >
                  {/* Tutor info */}
                  <div className="mb-3">
                    <h3 className="font-bold text-white text-lg">
                      {item.tutor.name}
                    </h3>
                    <p className="text-sm text-white/60 truncate">{item.tutor.email}</p>
                  </div>

                  {/* Amount */}
                  <p className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300 mb-3">
                    ₹{item.amount.toFixed(2)}
                  </p>

                  {/* Status & Date */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusBadge(
                        item.status
                      )}`}
                    >
                      {statusIcons[item.status]} {item.status}
                    </span>
                    <span className="text-xs text-white/50">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 mt-auto">
                    {item.status === "pending" && (
                      <>
                        
                      </>
                    )}

                    {item.status === "processing" && (
                      <>
                        <button
                          onClick={() =>
                            handleStatusUpdate(item.withdrawal_id, "completed")
                          }
                          disabled={actionLoading === item.withdrawal_id}
                          className="flex-1 px-3 py-2 bg-emerald-500/20 text-emerald-300 rounded-lg text-sm font-semibold border border-emerald-400/30 hover:bg-emerald-500/30 hover:text-white transition disabled:opacity-50"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => {
                            const reason = window.prompt("Rejection reason (optional):");
                            handleStatusUpdate(
                              item.withdrawal_id,
                              "rejected",
                              reason || undefined
                            );
                          }}
                          disabled={actionLoading === item.withdrawal_id}
                          className="flex-1 px-3 py-2 bg-rose-500/20 text-rose-300 rounded-lg text-sm font-semibold border border-rose-400/30 hover:bg-rose-500/30 hover:text-white transition disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    <Link
                      href={`/admin/withdrawals/${item.withdrawal_id}`}
                      className="w-full text-center px-3 py-2 bg-white/10 text-white/80 rounded-lg text-sm font-medium hover:bg-white/20 transition"
                    >
                      View Details
                    </Link>
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
      </div>
    </AdminLayout>
  );
}