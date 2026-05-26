"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    getTransactionHistory,
} from "@/services/v1Service";
import { connectSocket, disconnectSocket } from "@/services/versionSocketService";
import { getTokens } from "@/services/storageService";
import toast from "react-hot-toast";
import { apiGet } from "@/services/apiService";

// ---------- Types ----------
interface Transaction {
  id: number;
  type: "credit" | "debit";
  amount: number;
  real_amount: number;
  bonus_amount: number;
  description: string;
  source: string; // e.g., "wallet_topup", "doubt_payment"
  created_at: string; // ISO date string
  date: string; // preformatted? assume created_at date
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
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<Summary>({
    added: 0,
    spent: 0,
    bonus: 0,
    net: 0,
  });
  const socketRef = useRef<boolean>(false);

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

  const calculateSummary = (transactions: Transaction[]) => {
    let added = 0,
      spent = 0,
      bonus = 0;
    transactions.forEach((tx) => {
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
    setSummary({
      added: Number(added.toFixed(2)),
      spent: Number(spent.toFixed(2)),
      bonus: Number(bonus.toFixed(2)),
      net: Number((added + bonus - spent).toFixed(2)),
    });
  };

  const filterTransactions = (transactions: Transaction[], filter: string) => {
    if (filter === "Added") return transactions.filter((tx) => tx.type === "credit");
    if (filter === "Spent") return transactions.filter((tx) => tx.type === "debit");
    if (filter === "Bonus")
      return transactions.filter(
        (tx) => tx.type === "credit" && Number(tx.bonus_amount || 0) > 0
      );
    return transactions; // All
  };

  // ---------- Fetch data ----------
  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await getTransactionHistory();
      const data = res.results.transactions;
      setAllTransactions(data);
      setNextPage(res.next || null);
      const filtered = filterTransactions(data, selectedFilter);
      setSections(groupByMonth(filtered));
      calculateSummary(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to load transactions.");
    } finally {
      setRefreshing(false);
    }
  }, [selectedFilter]);

  useEffect(() => {
    fetchData();
  }, [selectedFilter, fetchData]);

  // ---------- Load more ----------
  const loadMore = async () => {
    if (!nextPage || loadingMore) return;
    try {
      setLoadingMore(true);
      const res = await apiGet(nextPage);
      const more: Transaction[] = res.results.transactions;
      const updated = [...allTransactions, ...more];
      setAllTransactions(updated);
      const filtered = filterTransactions(updated, selectedFilter);
      setSections(groupByMonth(filtered));
      calculateSummary(updated);
      setNextPage(res.next || null);
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

  // ---------- Render ----------
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
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-indigo-600 rounded-b-3xl pt-8 pb-6 px-4 flex items-center justify-between text-white shadow-md">
        <button onClick={() => router.back()} className="p-1">
          <span className="text-lg">←</span>
        </button>
        <div className="text-center">
          <h1 className="text-xl font-bold">📜 Transactions</h1>
          <p className="text-indigo-200 text-xs mt-1">Wallet activity & payments</p>
        </div>
        <div className="w-8" /> {/* spacer */}
      </div>

      {/* Analytics row */}
      <div className="flex gap-2 px-4 -mt-4 mb-6">
        <div className="flex-1 bg-white rounded-2xl p-4 shadow-sm text-center">
          <p className="text-xs text-gray-500">Added</p>
          <p className="text-xl font-bold text-green-600 mt-1">₹{summary.added}</p>
        </div>
        <div className="flex-1 bg-white rounded-2xl p-4 shadow-sm text-center">
          <p className="text-xs text-gray-500">Spent</p>
          <p className="text-xl font-bold text-red-600 mt-1">₹{summary.spent}</p>
        </div>
        <div className="flex-1 bg-white rounded-2xl p-4 shadow-sm text-center">
          <p className="text-xs text-gray-500">Bonus</p>
          <p className="text-xl font-bold text-purple-600 mt-1">₹{summary.bonus}</p>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex overflow-x-auto gap-2 px-4 pb-4 scrollbar-hide">
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
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-white text-gray-700 shadow-sm hover:bg-gray-50"
              }`}
            >
              <span>{icons[f]}</span> {f}
            </button>
          );
        })}
      </div>

      {/* Transaction sections */}
      <div className="px-4 pb-24">
        {refreshing && (
          <div className="text-center py-8">
            <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {sections.length === 0 && !refreshing && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <span className="text-5xl mb-4">📭</span>
            <h3 className="text-lg font-bold">No Transactions Found</h3>
            <p className="text-sm">Your wallet activity will appear here</p>
          </div>
        )}

        {sections.map((section) => (
          <div key={section.title} className="mb-6">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">
              {section.title}
            </h2>
            <div className="space-y-3">
              {section.data.map((tx) => {
                const isCredit = tx.type === "credit";
                return (
                  <div
                    key={tx.id}
                    className="bg-white rounded-2xl p-4 shadow-sm flex justify-between items-start"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg ${
                          isCredit ? "bg-green-100" : "bg-red-100"
                        }`}
                      >
                        {isCredit ? "⬇️" : "⬆️"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 truncate">
                          {tx.description}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-lg">
                            {tx.source === "wallet_topup"
                              ? "💰 Wallet Topup"
                              : "📚 Doubt Payment"}
                          </span>
                          <span
                            className={`text-xs font-semibold ${
                              isCredit ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {isCredit ? "Credited" : "Debited"}
                          </span>
                          <span className="text-xs text-gray-400">
                            • {formatDate(tx.created_at)}
                          </span>
                        </div>
                        <div className="flex gap-4 mt-2 text-xs">
                          <span className="text-gray-600">
                            Main ₹{Number(tx.real_amount || 0).toFixed(2)}
                          </span>
                          {Number(tx.bonus_amount || 0) > 0 && (
                            <span className="text-purple-600 font-bold">
                              🎁 Bonus ₹{Number(tx.bonus_amount || 0).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-lg font-bold ${
                          isCredit ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {isCredit ? "+" : "-"} ₹
                        {Number(tx.amount).toFixed(2)}
                      </p>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                          isCredit
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {isCredit ? "Success" : "Paid"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Summary card */}
        {sections.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm mt-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              💰 Wallet Summary
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Amount Added</span>
                <span className="text-green-600 font-semibold">
                  ₹{summary.added}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Amount Spent</span>
                <span className="text-red-600 font-semibold">
                  ₹{summary.spent}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Bonus Earned</span>
                <span className="text-indigo-600 font-semibold">
                  ₹{summary.bonus}
                </span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between font-bold">
                <span>Net Balance</span>
                <span>₹{summary.net}</span>
              </div>
            </div>
          </div>
        )}

        {/* Load more */}
        {nextPage && (
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl disabled:opacity-70 transition"
          >
            {loadingMore ? "Loading..." : "↓ Load More Transactions"}
          </button>
        )}
      </div>
    </div>
  );
}