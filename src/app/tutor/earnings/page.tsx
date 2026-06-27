// app/tutor/earnings/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { getMyTutorEarnings, MyTutorEarning } from "@/services/v1Service";

// ---------- Types ----------
interface EarningsSummary {
  total_earnings: number;
  paid_earnings: number;
  pending_earnings: number;
  total_sessions: number;
}

// ---------- Skeleton (dark) ----------
const CardSkeleton = () => (
  <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 animate-pulse flex flex-col gap-3">
    <div className="h-4 w-1/2 bg-white/10 rounded" />
    <div className="h-6 w-3/4 bg-white/10 rounded" />
  </div>
);

const EarningRowSkeleton = () => (
  <div className="flex items-center justify-between p-4 border-b border-white/10 animate-pulse">
    <div className="space-y-2 flex-1">
      <div className="h-4 w-1/3 bg-white/10 rounded" />
      <div className="h-3 w-1/4 bg-white/10 rounded" />
    </div>
    <div className="h-6 w-16 bg-white/10 rounded-full" />
    <div className="h-5 w-20 bg-white/10 rounded ml-4" />
  </div>
);

export default function TutorEarningsPage() {
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [earnings, setEarnings] = useState<MyTutorEarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEarnings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyTutorEarnings();
      const data = (res as any)?.data ?? res;
      const summaryData = Array.isArray(data) ? null : data.summary;
      const earningsData = Array.isArray(data) ? data : data.data ?? [];
      setSummary(summaryData);
      setEarnings(earningsData);
    } catch (err: any) {
      setError(err?.message || "Failed to load earnings");
      toast.error("Failed to load earnings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden p-4 sm:p-6 lg:p-8">
      {/* Animated blobs */}
      <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
      <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300 flex items-center gap-2">
            <span className="text-4xl">💰</span> My Earnings
          </h1>
          <p className="text-white/70 mt-1">
            Track your session earnings and payouts
          </p>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
              {[...Array(5)].map((_, i) => (
                <EarningRowSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="bg-rose-500/10 border border-rose-400/40 text-rose-300 rounded-2xl p-6 text-center backdrop-blur-md">
            <p className="font-bold text-lg mb-2">⚠️ {error}</p>
            <button
              onClick={fetchEarnings}
              className="px-4 py-2 bg-rose-400/20 hover:bg-rose-400/30 rounded-xl font-medium"
            >
              Retry
            </button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Summary Cards */}
            {summary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div
                  whileHover={{ y: -4 }}
                  className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-xl"
                >
                  <p className="text-sm text-white/60">Total Earnings</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent mt-1">
                    ₹{summary.total_earnings.toFixed(2)}
                  </p>
                </motion.div>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-xl"
                >
                  <p className="text-sm text-white/60">Paid</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">
                    ₹{summary.paid_earnings.toFixed(2)}
                  </p>
                </motion.div>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-xl"
                >
                  <p className="text-sm text-white/60">Pending</p>
                  <p className="text-2xl font-bold text-amber-400 mt-1">
                    ₹{summary.pending_earnings.toFixed(2)}
                  </p>
                </motion.div>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-xl"
                >
                  <p className="text-sm text-white/60">Sessions</p>
                  <p className="text-2xl font-bold text-violet-400 mt-1">
                    {summary.total_sessions}
                  </p>
                </motion.div>
              </div>
            )}

            {/* Earnings List */}
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl">
              <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300 mb-4">
                📋 Earning Details
              </h2>
              {earnings.length === 0 ? (
                <div className="text-center py-10 text-white/50">
                  <span className="text-4xl block mb-2">💰</span>
                  <p>No earnings yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {earnings.map((earning) => (
                    <motion.div
                      key={earning.earning_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition backdrop-blur-md"
                    >
                      <div>
                        <p className="font-medium text-white">
                          Session #{earning.session_id}
                        </p>
                        <p className="text-xs text-white/50">
                          {new Date(earning.created_at).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            earning.is_paid
                              ? "bg-emerald-400/20 text-emerald-300 border-emerald-400/40"
                              : "bg-amber-400/20 text-amber-300 border-amber-400/40"
                          }`}
                        >
                          {earning.is_paid ? "✅ Paid" : "⏳ Pending"}
                        </span>
                        <p className="font-bold text-white w-20 text-right">
                          ₹{earning.amount.toFixed(2)}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}