"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { getTransactionHistory, getAvailableWalletOffers } from "@/services/v1Service";
import { connectSocket, disconnectSocket } from "@/services/versionSocketService";
import { getTokens } from "@/services/storageService";
import { apiGet } from "@/services/versionApiService";

import {
  walletCache
} from '@/store/walletCache';

import {
  subscribeWallet,
  updateWalletBalance,
  addTransaction
} from '@/store/walletRealtime';

/* ---------- Types ---------- */
interface Wallet {
  real: number;
  bonus: number;
  total: number;
}

interface Transaction {
  id: number;
  description: string;
  amount: number;
  real_amount?: number;
  bonus_amount?: number;
  source?: string;
  type: "credit" | "debit";
  date: string;
  time: string;
}

interface Offer {
  name: string;
  bonus_percentage: number;
  max_bonus: number;
}

const StudentWalletScreen = () => {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);

  // State
  const [, forceUpdate] = useState({});
  const [loading, setLoading] = useState(true);
  const [highlightTxId, setHighlightTxId] = useState<number | null>(null);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // Animation for balance change
  const prevTotalRef = useRef(walletCache.wallet.total);
  const balanceRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeWallet(() => {
      forceUpdate({});
    });
    return unsubscribe;
  }, []);

  // ---------------------------------------------------------------------------
  // Fetch data (wallet, transactions, offers)
  // ---------------------------------------------------------------------------
  const fetchData = useCallback(async () => {
    try {
      const res = await getTransactionHistory();
      const data = res.results;

      const offerRes = await getAvailableWalletOffers();

      const mapped = data.transactions.map((tx: any) => ({
        id: tx.id,
        description: tx.description,
        amount: tx.amount,
        real_amount: tx.real_amount,
        bonus_amount: tx.bonus_amount,
        source: tx.source,
        type: tx.type,
        date: tx.date,
        time: tx.time,
      }));

      setNextPage(res.next || null);

      walletCache.wallet = {
        real: data.wallet.real_balance,
        bonus: data.wallet.bonus_balance,
        total: data.wallet.total_balance,
      };

      walletCache.transactions = mapped;
      walletCache.offer = offerRes.data?.[0] || null;
      walletCache.nextPage = res.next || null;
      walletCache.initialized = true;
    } catch (err) {
      console.log("Wallet Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load more transactions (pagination)
  const loadMoreTransactions = async () => {
    if (!nextPage || loadingMore) return;
    try {
      setLoadingMore(true);
      const res = await apiGet(nextPage);
      const data = res.results;
      const mapped = data.transactions.map((tx: any) => ({
        id: tx.id,
        description: tx.description,
        amount: tx.amount,
        real_amount: tx.real_amount,
        bonus_amount: tx.bonus_amount,
        source: tx.source,
        type: tx.type,
        date: tx.date,
        time: tx.time,
      }));
      walletCache.transactions = [...walletCache.transactions, ...mapped];
      setNextPage(res.next || null);
    } catch (err) {
      console.log("Load More Error:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Socket connection for real‑time wallet updates
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let mounted = true;
    const initSocket = async () => {
      const tokens = await getTokens();
      if (!tokens?.access) return;

      connectSocket(tokens.access, (event, data) => {
        if (!mounted) return;
        console.log("💰 WALLET WS EVENT:", event, data);

        switch (event) {
          case "WALLET_UPDATE":
            const newTotal = (data.real_balance || 0) + (data.bonus_balance || 0);
            walletCache.wallet = {
              real: data.real_balance || 0,
              bonus: data.bonus_balance || 0,
              total: newTotal,
            };
            break;

          case "TRANSACTION_CREATED":
            const newTx: Transaction = {
              id: data.id,
              description: data.description,
              amount: data.amount,
              type: data.transaction_type || data.type,
              date: data.date,
              time: data.time,
            };
            walletCache.transactions = [newTx, ...walletCache.transactions];
            setHighlightTxId(data.id);
            setTimeout(() => setHighlightTxId(null), 2000);
            break;
        }
      });
    };

    initSocket();
    return () => {
      mounted = false;
      disconnectSocket();
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Initial fetch
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (walletCache.initialized) {
      setLoading(false);
      return;
    }
    fetchData();
  }, [fetchData]);

  // ---------------------------------------------------------------------------
  // Animate balance change on total update
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (balanceRef.current && prevTotalRef.current !== walletCache.wallet.total) {
      balanceRef.current.style.transition = "none";
      balanceRef.current.style.transform = "scale(1.1)";
      setTimeout(() => {
        if (balanceRef.current) {
          balanceRef.current.style.transition = "transform 0.3s ease-out";
          balanceRef.current.style.transform = "scale(1)";
        }
      }, 50);
    }
    prevTotalRef.current = walletCache.wallet.total;
  }, [walletCache.wallet.total]);

  // ---------------------------------------------------------------------------
  // Refresh handler
  // ---------------------------------------------------------------------------
  const handleRefresh = () => {
    setLoading(true);
    fetchData();
  };

  // ---------------------------------------------------------------------------
  // Render transaction item
  // ---------------------------------------------------------------------------
  const renderTransaction = (tx: Transaction) => {
    const isCredit = tx.type === "credit";
    return (
      <div
        key={tx.id}
        className={`flex items-center justify-between p-3 sm:p-4 rounded-2xl border transition-all duration-300 ${
          highlightTxId === tx.id
            ? "border-emerald-400 bg-emerald-400/10 shadow-lg shadow-emerald-500/20 scale-[1.02]"
            : "border-white/10 bg-white/5 hover:border-white/20"
        }`}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div
            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm"
            style={{
              backgroundColor: isCredit ? "rgba(52, 211, 153, 0.2)" : "rgba(248, 113, 113, 0.2)",
            }}
          >
            <span>{isCredit ? "⬇️" : "⬆️"}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {tx.description}
            </p>
            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 bg-white/10 text-white/70">
              {tx.source === "wallet_topup" ? "💰 Wallet Topup" : "📚 Doubt Payment"}
            </span>
            <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1">
              <span className="text-[11px] text-white/50">
                Main: ₹{(tx.real_amount || 0).toFixed(2)}
              </span>
              {tx.bonus_amount && tx.bonus_amount > 0 && (
                <span className="text-[11px] text-amber-300">
                  Bonus: ₹{tx.bonus_amount.toFixed(2)}
                </span>
              )}
            </div>
            <span className="text-[11px] text-white/40 block mt-1">
              {tx.date} • {tx.time}
            </span>
          </div>
        </div>
        <div className="flex-shrink-0 ml-3">
          <span
            className={`text-base font-bold whitespace-nowrap ${
              isCredit ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {isCredit ? "+" : "-"} ₹{Math.abs(tx.amount).toFixed(2)}
          </span>
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex items-center justify-center">
        <div className="w-10 h-10 animate-spin rounded-full border-4 border-violet-400 border-t-transparent" />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
      <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

      <div className="relative z-10 max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-5 sm:space-y-6">
        {/* Balance Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-4 sm:p-6 shadow-2xl text-center">
          <p className="text-xs sm:text-sm text-white/50 font-medium uppercase tracking-wide">
            Total Balance
          </p>
          <h2
            ref={balanceRef}
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold mt-2 text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300"
          >
            ₹{walletCache.wallet.total.toFixed(2)}
          </h2>
          <button
            className="mt-4 px-5 py-3 sm:px-6 sm:py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-bold shadow-lg shadow-violet-500/25 hover:from-violet-600 hover:to-fuchsia-600 active:scale-95 transition"
            onClick={() => router.push("/add-money")}
          >
            + Add Money
          </button>
          {walletCache.offer && (
            <div className="mt-3 inline-block rounded-full bg-amber-400/20 border border-amber-400/30 px-4 py-1.5 text-sm font-semibold text-amber-300">
              🎁 {walletCache.offer.bonus_percentage}% Bonus · Max ₹{walletCache.offer.max_bonus}
            </div>
          )}
        </div>

        {/* Split Balances */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-lg">
            <span className="text-xs text-white/50">💵 Available Balance</span>
            <span className="block text-lg sm:text-xl font-bold text-white mt-1">
              ₹{walletCache.wallet.real.toFixed(2)}
            </span>
          </div>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-lg">
            <span className="text-xs text-white/50">🎁 Bonus Balance</span>
            <span className="block text-lg sm:text-xl font-bold text-white mt-1">
              ₹{walletCache.wallet.bonus.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <h3 className="text-base sm:text-lg font-bold text-white">Quick Actions</h3>
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/add-money")}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/20 active:scale-95 transition"
          >
            <span className="text-lg">💰</span> Add Money
          </button>
          <button
            onClick={() => router.push("/student/transactions")}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/20 active:scale-95 transition"
          >
            <span className="text-lg">📜</span> History
          </button>
        </div>

        {/* Transactions Header */}
        <div className="flex items-center justify-between">
          <h4 className="text-base sm:text-lg font-bold text-white">Recent Transactions</h4>
          <button
            onClick={handleRefresh}
            className="text-sm font-medium text-violet-300 hover:text-violet-200 transition"
          >
            Refresh
          </button>
        </div>

        {/* Transactions List */}
        <div className="space-y-3">
          {walletCache.transactions.map(renderTransaction)}
        </div>

        {/* Load More Button */}
        {nextPage && (
          <button
            onClick={loadMoreTransactions}
            disabled={loadingMore}
            className="w-full py-3 rounded-2xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/20 disabled:opacity-50 active:scale-95 transition"
          >
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        )}
      </div>
    </div>
  );
};

export default StudentWalletScreen;