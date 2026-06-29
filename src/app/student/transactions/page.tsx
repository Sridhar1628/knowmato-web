"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getTransactionHistory } from "@/services/v1Service";
import { connectSocket, disconnectSocket } from "@/services/versionSocketService";
import { getTokens } from "@/services/storageService";
import toast from "react-hot-toast";
import { apiGet } from "@/services/apiService";
import { motion } from "framer-motion";

import { transactionCache } from "@/store/transactionCache";
import {
  subscribeTransactions,
  setTransactionCache,
  clearTransactionCache,
} from "@/store/transactionRealtime";

// ---------- Types ----------
interface Transaction {
  id: number;
  type: "credit" | "debit";
  amount: number;
  real_amount: number;
  bonus_amount: number;
  description: string;
  source: string; // e.g., "wallet_topup", "doubt_payment"
  created_at: string;
  date: string;
}

interface Summary {
  added: number;
  spent: number;
  bonus: number;
  net: number;
}

interface Section {
  title: string;
  data: Transaction[];
}

const filters = ["All", "Added", "Spent", "Bonus"];

export default function TransactionHistoryPage() {
  const router = useRouter();
  const [, forceUpdate] = useState({});

  const [selectedFilter, setSelectedFilter] = useState("All");
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeTransactions(() => {
      forceUpdate({});
    });
    return unsubscribe;
  }, []);

  // ---------- Helpers ----------
  const groupByMonth = (transactions: Transaction[]): Section[] => {
    const grouped: Record<string, Transaction[]> = {};
    transactions.forEach((tx) => {
      const date = new Date(tx.created_at);
      const month = date.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
      if (!grouped[month]) grouped[month] = [];
      grouped[month].push(tx);
    });
    return Object.keys(grouped).map((month) => ({
      title: month,
      data: grouped[month],
    }));
  };

  const filterTransactions = (transactions: Transaction[], filter: string) => {
    if (filter === "Added") return transactions.filter((tx) => tx.type === "credit");
    if (filter === "Spent") return transactions.filter((tx) => tx.type === "debit");
    if (filter === "Bonus")
      return transactions.filter(
        (tx) => tx.type === "credit" && Number(tx.bonus_amount || 0) > 0
      );
    return transactions;
  };

  // ---------- Fetch data ----------
  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await getTransactionHistory();
      const data: Transaction[] = res.results.transactions;
      const filtered = filterTransactions(data, selectedFilter);
      const grouped = groupByMonth(filtered);

      let added = 0;
      let spent = 0;
      let bonus = 0;

      data.forEach((tx) => {
        const real = Number(tx.real_amount || 0);
        const bonusAmount = Number(tx.bonus_amount || 0);
        const amount = Number(tx.amount || 0);

        if (tx.type === "credit") {
          added += real;
          bonus += bonusAmount;
        }
        if (tx.type === "debit") {
          spent += Math.abs(amount);
        }
      });

      setTransactionCache(data, grouped, {
        added,
        spent,
        bonus,
        net: added + bonus - spent,
      }, res.next || null);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to load transactions.");
    } finally {
      setRefreshing(false);
    }
  }, [selectedFilter]);

  useEffect(() => {
    if (transactionCache.initialized) {
      forceUpdate({});
      return;
    }
    clearTransactionCache();
    fetchData();
  }, []);

  // ---------- Load more ----------
  const loadMore = async () => {
    if (!transactionCache.nextPage || loadingMore) return;
    try {
      setLoadingMore(true);
      const res = await apiGet(transactionCache.nextPage);
      const more: Transaction[] = res.results.transactions;
      const updated = [...transactionCache.transactions, ...more];
      const filtered = filterTransactions(updated, selectedFilter);
      const grouped = groupByMonth(filtered);

      let added = 0;
      let spent = 0;
      let bonus = 0;

      updated.forEach((tx) => {
        const real = Number(tx.real_amount || 0);
        const bonusAmount = Number(tx.bonus_amount || 0);
        const amount = Number(tx.amount || 0);

        if (tx.type === "credit") {
          added += real;
          bonus += bonusAmount;
        }
        if (tx.type === "debit") {
          spent += Math.abs(amount);
        }
      });

      setTransactionCache(updated, grouped, {
        added,
        spent,
        bonus,
        net: added + bonus - spent,
      }, res.next || null);
    } catch (err) {
      console.error("Load more error:", err);
      toast.error("Failed to load more transactions.");
    } finally {
      setLoadingMore(false);
    }
  };

  // ---------- WebSocket real-time ----------
  useEffect(() => {
    let mounted = true;
    const initSocket = async () => {
      const tokens = await getTokens();
      if (!tokens?.access) return;
      connectSocket(tokens.access, (event) => {
        if (event === "TRANSACTION_CREATED" && mounted) {
          clearTransactionCache();
          fetchData();
        }
      });
    };
    initSocket();
    return () => {
      mounted = false;
      disconnectSocket();
    };
  }, [fetchData]);

  // ---------- Helpers ----------
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
      <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6 sm:px-6">
        {/* Header */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-4 flex items-center justify-between mb-6 shadow-2xl">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl hover:bg-white/10 transition text-white/80 hover:text-white"
          >
            ←
          </button>
          <div className="text-center">
            <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300">
              📜 Transactions
            </h1>
            <p className="text-white/50 text-xs">Wallet activity & payments</p>
          </div>
          <div className="w-8" />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Added", value: transactionCache.summary.added, color: "text-emerald-300", bg: "bg-emerald-400/10 border-emerald-400/30" },
            { label: "Spent", value: transactionCache.summary.spent, color: "text-rose-300", bg: "bg-rose-400/10 border-rose-400/30" },
            { label: "Bonus", value: transactionCache.summary.bonus, color: "text-violet-300", bg: "bg-violet-400/10 border-violet-400/30" },
          ].map((card, idx) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`rounded-2xl p-4 backdrop-blur-md border shadow-lg text-center ${card.bg}`}
            >
              <p className="text-xs text-white/50">{card.label}</p>
              <p className={`text-lg font-bold mt-1 ${card.color}`}>₹{card.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Filter pills */}
        <div className="flex overflow-x-auto gap-2 pb-4 mb-6 scrollbar-hide">
          {filters.map((f) => {
            const active = selectedFilter === f;
            const icons: Record<string, string> = {
              All: "📱",
              Added: "⬇️",
              Spent: "⬆️",
              Bonus: "🎁",
            };
            return (
              <button
                key={f}
                onClick={() => setSelectedFilter(f)}
                className={`flex items-center gap-1 px-4 py-2 rounded-2xl font-semibold text-sm transition whitespace-nowrap ${
                  active
                    ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25"
                    : "bg-white/10 backdrop-blur-md border border-white/20 text-white/70 hover:bg-white/20"
                }`}
              >
                <span>{icons[f]}</span> {f}
              </button>
            );
          })}
        </div>

        {/* Refreshing spinner */}
        {refreshing && (
          <div className="text-center py-8">
            <div className="inline-block w-8 h-8 border-4 border-violet-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {transactionCache.sections.length === 0 && !refreshing && (
          <div className="flex flex-col items-center justify-center py-20 text-white/50">
            <span className="text-5xl mb-4">📭</span>
            <h3 className="text-lg font-bold">No Transactions Found</h3>
            <p className="text-sm">Your wallet activity will appear here</p>
          </div>
        )}

        {/* Transaction sections */}
        {transactionCache.sections.map((section) => (
          <div key={section.title} className="mb-6">
            <h2 className="text-sm font-bold text-white/50 uppercase tracking-wide mb-3">
              {section.title}
            </h2>
            <div className="space-y-3">
              {section.data.map((tx) => {
                const isCredit = tx.type === "credit";
                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                          isCredit ? "bg-emerald-400/20" : "bg-rose-400/20"
                        }`}
                      >
                        {isCredit ? "⬇️" : "⬆️"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">
                          {tx.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="bg-violet-400/20 text-violet-300 text-xs font-semibold px-2 py-0.5 rounded-lg border border-violet-400/30">
                            {tx.source === "wallet_topup" ? "💰 Wallet Topup" : "📚 Doubt Payment"}
                          </span>
                          <span
                            className={`text-xs font-semibold ${
                              isCredit ? "text-emerald-300" : "text-rose-300"
                            }`}
                          >
                            {isCredit ? "Credited" : "Debited"}
                          </span>
                          <span className="text-xs text-white/40">
                            • {formatDate(tx.created_at)}
                          </span>
                        </div>
                        <div className="flex gap-4 mt-2 text-xs">
                          <span className="text-white/50">
                            Main ₹{Number(tx.real_amount || 0).toFixed(2)}
                          </span>
                          {Number(tx.bonus_amount || 0) > 0 && (
                            <span className="text-amber-300 font-bold">
                              🎁 Bonus ₹{Number(tx.bonus_amount || 0).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end sm:items-center sm:ml-4">
                      <p
                        className={`text-lg font-bold ${
                          isCredit ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {isCredit ? "+" : "-"} ₹{Number(tx.amount).toFixed(2)}
                      </p>
                      <span
                        className={`mt-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                          isCredit
                            ? "bg-emerald-400/20 text-emerald-300 border border-emerald-400/30"
                            : "bg-rose-400/20 text-rose-300 border border-rose-400/30"
                        }`}
                      >
                        {isCredit ? "Success" : "Paid"}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Summary card */}
        {transactionCache.sections.length > 0 && (
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-xl mt-6">
            <h3 className="text-lg font-bold text-white mb-4">💰 Wallet Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-white/70">
                <span>Amount Added</span>
                <span className="text-emerald-300 font-semibold">₹{transactionCache.summary.added}</span>
              </div>
              <div className="flex justify-between text-sm text-white/70">
                <span>Amount Spent</span>
                <span className="text-rose-300 font-semibold">₹{transactionCache.summary.spent}</span>
              </div>
              <div className="flex justify-between text-sm text-white/70">
                <span>Bonus Earned</span>
                <span className="text-violet-300 font-semibold">₹{transactionCache.summary.bonus}</span>
              </div>
              <hr className="my-2 border-white/10" />
              <div className="flex justify-between font-bold text-white">
                <span>Net Balance</span>
                <span>₹{transactionCache.summary.net}</span>
              </div>
            </div>
          </div>
        )}

        {/* Load more */}
        {transactionCache.nextPage && (
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="w-full mt-6 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white font-bold py-3 rounded-xl disabled:opacity-70 transition shadow-lg shadow-violet-500/25"
          >
            {loadingMore ? "Loading..." : "↓ Load More Transactions"}
          </button>
        )}
      </div>
    </div>
  );
}