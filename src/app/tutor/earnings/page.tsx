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

// ---------- Skeleton ----------
const CardSkeleton = () => (
  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-pulse flex flex-col gap-3">
    <div className="h-4 w-1/2 bg-gray-200 rounded" />
    <div className="h-6 w-3/4 bg-gray-100 rounded" />
  </div>
);

const EarningRowSkeleton = () => (
  <div className="flex items-center justify-between p-4 border-b border-gray-100 animate-pulse">
    <div className="space-y-2 flex-1">
      <div className="h-4 w-1/3 bg-gray-200 rounded" />
      <div className="h-3 w-1/4 bg-gray-100 rounded" />
    </div>
    <div className="h-6 w-16 bg-gray-200 rounded-full" />
    <div className="h-5 w-20 bg-gray-100 rounded ml-4" />
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
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
            <span className="text-4xl">💰</span> My Earnings
          </h1>
          <p className="text-gray-600 mt-1">
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
            <div className="bg-white rounded-2xl p-4 shadow-sm border">
              {[...Array(5)].map((_, i) => (
                <EarningRowSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 text-center">
            <p className="font-bold text-lg mb-2">⚠️ {error}</p>
            <button
              onClick={fetchEarnings}
              className="px-4 py-2 bg-red-100 hover:bg-red-200 rounded-xl font-medium"
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
                  className="bg-white rounded-2xl p-5 shadow-sm border"
                >
                  <p className="text-sm text-gray-500">Total Earnings</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    ₹{summary.total_earnings.toFixed(2)}
                  </p>
                </motion.div>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-2xl p-5 shadow-sm border"
                >
                  <p className="text-sm text-gray-500">Paid</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">
                    ₹{summary.paid_earnings.toFixed(2)}
                  </p>
                </motion.div>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-2xl p-5 shadow-sm border"
                >
                  <p className="text-sm text-gray-500">Pending</p>
                  <p className="text-2xl font-bold text-amber-600 mt-1">
                    ₹{summary.pending_earnings.toFixed(2)}
                  </p>
                </motion.div>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-2xl p-5 shadow-sm border"
                >
                  <p className="text-sm text-gray-500">Sessions</p>
                  <p className="text-2xl font-bold text-indigo-600 mt-1">
                    {summary.total_sessions}
                  </p>
                </motion.div>
              </div>
            )}

            {/* Earnings List */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                📋 Earning Details
              </h2>
              {earnings.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
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
                      className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition"
                    >
                      <div>
                        <p className="font-medium text-gray-800">
                          Session #{earning.session_id}
                        </p>
                        <p className="text-xs text-gray-400">
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
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : "bg-amber-100 text-amber-800 border-amber-200"
                          }`}
                        >
                          {earning.is_paid ? "✅ Paid" : "⏳ Pending"}
                        </span>
                        <p className="font-bold text-gray-700 w-20 text-right">
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