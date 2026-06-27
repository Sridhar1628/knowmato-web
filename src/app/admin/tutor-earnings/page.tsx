"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  getTutorEarnings,
  markTutorEarningsPaid,
  TutorEarning,
} from "@/services/v1Service";
import AdminLayout from "@/app/admin/AdminLayout";

// ---------- Skeleton (dark) ----------
const TutorCardSkeleton = () => (
  <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 animate-pulse flex flex-col gap-3">
    <div className="h-5 w-3/4 bg-white/10 rounded" />
    <div className="h-4 w-1/2 bg-white/10 rounded" />
    <div className="h-6 w-20 bg-white/10 rounded-full" />
  </div>
);

export default function AdminEarningsPage() {
  const [earnings, setEarnings] = useState<TutorEarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter: all, unpaid, paid
  const [filter, setFilter] = useState<"all" | "unpaid" | "paid">("unpaid");
  // Search tutor name
  const [searchTerm, setSearchTerm] = useState("");

  // Modal state
  const [selectedTutor, setSelectedTutor] = useState<{
    tutor_id: number;
    tutor_name: string;
    earnings: TutorEarning[];
  } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [paying, setPaying] = useState(false);

  const fetchEarnings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const is_paid =
        filter === "unpaid" ? false : filter === "paid" ? true : undefined;
      const res = await getTutorEarnings(is_paid);
      setEarnings(res.data || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load earnings");
      toast.error("Failed to load earnings");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  // Group by tutor
  const groupedTutors = useCallback(() => {
    const map = new Map<
      number,
      { tutor_name: string; tutor_id: number; total: number; earnings: TutorEarning[] }
    >();
    for (const e of earnings) {
      if (!map.has(e.tutor_id)) {
        map.set(e.tutor_id, {
          tutor_name: e.tutor,
          tutor_id: e.tutor_id,
          total: 0,
          earnings: [],
        });
      }
      const group = map.get(e.tutor_id)!;
      group.total += e.amount;
      group.earnings.push(e);
    }
    let tutors = Array.from(map.values());
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      tutors = tutors.filter((t) => t.tutor_name.toLowerCase().includes(term));
    }
    tutors.sort((a, b) => a.tutor_name.localeCompare(b.tutor_name));
    return tutors;
  }, [earnings, searchTerm]);

  const tutors = groupedTutors();

  // Modal handlers
  const openModal = (tutor: (typeof tutors)[0]) => {
    setSelectedTutor({
      tutor_id: tutor.tutor_id,
      tutor_name: tutor.tutor_name,
      earnings: tutor.earnings,
    });
    setSelectedIds(new Set());
  };

  const closeModal = () => {
    setSelectedTutor(null);
    setSelectedIds(new Set());
  };

  const toggleId = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllInModal = () => {
    if (!selectedTutor) return;
    const allIds = selectedTutor.earnings.map((e) => e.earning_id);
    if (selectedIds.size === allIds.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allIds));
    }
  };

  const handlePayModal = async () => {
    if (selectedIds.size === 0) {
      toast.error("No earnings selected");
      return;
    }
    if (!window.confirm(`Mark ${selectedIds.size} earnings as paid?`)) return;

    setPaying(true);
    try {
      await markTutorEarningsPaid(Array.from(selectedIds));
      toast.success("Earnings marked as paid");
      closeModal();
      fetchEarnings();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Payment failed");
    } finally {
      setPaying(false);
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
            className="mb-8"
          >
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 flex items-center gap-2">
              <span className="text-4xl">💰</span> Tutor Earnings
            </h1>
            <p className="text-white/70 mt-1 font-medium">
              Manage tutor payouts grouped by tutor
            </p>
          </motion.div>

          {/* Filters */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-2xl mb-6 flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Search tutor name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-gray-900/60 border-2 border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/40 focus:ring-4 focus:ring-violet-500/50 focus:border-violet-400 outline-none transition"
            />
            <div className="flex gap-2 flex-wrap">
              {(["all", "unpaid", "paid"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold transition ${
                    filter === f
                      ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25"
                      : "bg-white/10 text-white/70 hover:bg-white/20"
                  }`}
                >
                  {f === "all" ? "All" : f === "unpaid" ? "Unpaid" : "Paid"}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-rose-500/10 border border-rose-400/40 text-rose-300 rounded-2xl p-4 mb-6 flex items-center justify-between backdrop-blur-md">
              <span className="font-medium">⚠️ {error}</span>
              <button
                onClick={fetchEarnings}
                className="px-4 py-1.5 bg-rose-400/20 hover:bg-rose-400/30 rounded-xl font-medium text-sm"
              >
                Retry
              </button>
            </div>
          )}

          {/* Tutor Cards */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <TutorCardSkeleton key={i} />
              ))}
            </div>
          ) : tutors.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-lg"
            >
              <div className="text-5xl mb-4">📋</div>
              <h2 className="text-2xl font-bold text-white">No tutors found</h2>
              <p className="text-white/70 mt-2">
                No earnings data matching your filters.
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tutors.map((tutor) => (
                <motion.div
                  key={tutor.tutor_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4, borderColor: "rgba(167, 139, 250, 0.6)" }}
                  onClick={() => openModal(tutor)}
                  className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:border-violet-400/40 transition-all shadow-xl cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold text-white">
                      {tutor.tutor_name}
                    </h3>
                    <span className="text-xs bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full font-medium border border-violet-400/30">
                      {tutor.earnings.length} earnings
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300">
                    ₹{tutor.total.toFixed(2)}
                  </p>
                  <p className="text-sm text-white/50 mt-2">
                    Total {filter === "unpaid" ? "unpaid" : filter === "paid" ? "paid" : ""} amount
                  </p>
                </motion.div>
              ))}
            </div>
          )}

          {/* Modal for selected tutor */}
          <AnimatePresence>
            {selectedTutor && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                onClick={closeModal}
              >
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.95 }}
                  className="bg-gradient-to-b from-[#1e1b4b] to-[#312e81] backdrop-blur-xl border border-white/20 rounded-3xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">
                      {selectedTutor.tutor_name} — Earnings
                    </h2>
                    <button
                      onClick={closeModal}
                      className="text-white/60 hover:text-white text-2xl leading-none transition"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Selection controls */}
                  <div className="flex items-center justify-between mb-6">
                    <button
                      onClick={handleSelectAllInModal}
                      className="text-sm text-violet-300 hover:text-violet-200 font-medium underline underline-offset-2"
                    >
                      {selectedIds.size === selectedTutor.earnings.length
                        ? "Deselect All"
                        : "Select All"}
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handlePayModal}
                      disabled={selectedIds.size === 0 || paying}
                      className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 flex items-center gap-2 transition"
                    >
                      {paying ? (
                        <>
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                          </svg>
                          Processing...
                        </>
                      ) : (
                        `Pay Selected (${selectedIds.size})`
                      )}
                    </motion.button>
                  </div>

                  {/* Earnings list */}
                  <div className="space-y-3">
                    {selectedTutor.earnings.map((earning) => {
                      const isSelected = selectedIds.has(earning.earning_id);
                      return (
                        <div
                          key={earning.earning_id}
                          className={`flex items-center justify-between p-4 rounded-xl border transition ${
                            isSelected
                              ? "border-violet-400 bg-violet-500/20"
                              : "border-white/10 bg-white/5"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleId(earning.earning_id)}
                              className="h-4 w-4 text-violet-600 bg-gray-800 border-gray-600 rounded focus:ring-violet-500"
                            />
                            <div>
                              <p className="font-medium text-white">
                                Session #{earning.session_id}
                              </p>
                              {earning.doubt_title && (
                                <p className="text-xs text-white/60">
                                  {earning.doubt_title}
                                </p>
                              )}
                              <p className="text-xs text-white/40">
                                {new Date(earning.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <p className="font-bold text-white">
                            ₹{earning.amount.toFixed(2)}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {selectedTutor.earnings.length === 0 && (
                    <p className="text-center text-white/50 py-8">
                      No earnings for this filter.
                    </p>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AdminLayout>
  );
}