"use client";

import React, { useEffect, useState, useCallback, memo } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { RootState } from "@/redux/store";
import {
  getMyCreditBalances,
  getPlans,
  purchasePlan,
  getMyCreditTransactions,
  CreditBalance,
  CreditPlan,
  CreditTransaction,
} from "@/services/v1Service";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

// ---------- Sub-components ----------
const BalanceCard = memo(({ category, balance }: { category: string; balance: number }) => (
  <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col items-center transition hover:border-violet-400/40 hover:shadow-xl">
    <span className="text-sm text-white/70">{category}</span>
    <span className="text-2xl font-bold text-white">{balance}</span>
  </div>
));
BalanceCard.displayName = "BalanceCard";

const PlanCard = memo(
  ({
    plan,
    onBuy,
  }: {
    plan: CreditPlan;
    onBuy: (plan: CreditPlan) => void;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 hover:border-violet-400/40 transition-all hover:shadow-xl"
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
          <p className="text-sm text-white/60">{plan.description}</p>
        </div>
        <span className="text-xl font-bold text-violet-400">₹{plan.price}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1">
        {plan.items.map((item) => (
          <span
            key={item.id}
            className="text-xs bg-white/10 px-2 py-1 rounded-full text-white/80"
          >
            {item.category_name}: {item.quantity}
          </span>
        ))}
      </div>
      <button
        onClick={() => onBuy(plan)}
        className="mt-4 w-full py-2.5 bg-violet-600 hover:bg-violet-700 rounded-xl font-semibold text-white transition"
      >
        Buy Now
      </button>
    </motion.div>
  )
);
PlanCard.displayName = "PlanCard";

const TransactionItem = memo(({ txn }: { txn: CreditTransaction }) => {
  const isCredit = txn.amount > 0;
  const { t } = useTranslation();
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="flex justify-between items-center bg-white/5 rounded-xl p-3 border border-white/10 transition hover:border-violet-400/30">
      <div>
        <p className="text-sm font-medium text-white">{txn.category_name}</p>
        <p className="text-xs text-white/60">{txn.description}</p>
        <p className="text-xs text-white/40">{formatDate(txn.created_at)}</p>
      </div>
      <span className={`font-bold ${isCredit ? "text-emerald-400" : "text-rose-400"}`}>
        {isCredit ? "+" : ""}{txn.amount}
      </span>
    </div>
  );
});
TransactionItem.displayName = "TransactionItem";

// ---------- Purchase Modal ----------
const PurchaseModal = memo(
  ({
    isOpen,
    onClose,
    onConfirm,
    plan,
    purchasing,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    plan: CreditPlan | null;
    purchasing: boolean;
  }) => {
    const { t } = useTranslation();
    if (!isOpen || !plan) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-[#1f1b3a] rounded-2xl p-6 max-w-md w-full mx-4 border border-white/10 shadow-2xl"
        >
          <h2 className="text-2xl font-bold text-white mb-2">Confirm Purchase</h2>
          <p className="text-white/70 mb-4">You are about to purchase the following plan:</p>
          <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-white">{plan.name}</span>
              <span className="text-xl font-bold text-violet-400">₹{plan.price}</span>
            </div>
            <p className="text-sm text-white/60 mt-1">{plan.description}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {plan.items.map((item) => (
                <span
                  key={item.id}
                  className="text-xs bg-white/10 px-2 py-1 rounded-full text-white/80"
                >
                  {item.category_name}: {item.quantity}
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={purchasing}
              className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={purchasing}
              className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 rounded-xl text-white font-semibold transition disabled:opacity-50"
            >
              {purchasing ? "Processing..." : "Confirm"}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }
);
PurchaseModal.displayName = "PurchaseModal";

// ---------- Main Page ----------
export default function StudentCreditsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);

  // ---------- State ----------
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [balances, setBalances] = useState<CreditBalance[]>([]);
  const [plans, setPlans] = useState<CreditPlan[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);

  const [selectedPlan, setSelectedPlan] = useState<CreditPlan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  // ---------- Data Fetching ----------
  const fetchData = useCallback(async () => {
    try {
      const [balancesRes, plansRes, txnRes] = await Promise.all([
        getMyCreditBalances(),
        getPlans(),
        getMyCreditTransactions(),
      ]);
      setBalances(balancesRes?.data || []);
      setPlans(plansRes?.data || []);
      setTransactions(txnRes?.data || []);
    } catch (error) {
      console.error("Fetch credits error:", error);
      toast.error(t("credits.fetchError") || "Failed to load credits data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  // ---------- Purchase Flow ----------
  const handleBuy = useCallback((plan: CreditPlan) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
  }, []);

  const confirmPurchase = useCallback(async () => {
    if (!selectedPlan) return;
    setPurchasing(true);
    try {
      await purchasePlan(selectedPlan.id);
      toast.success(t("credits.purchaseSuccess") || "Plan purchased successfully!");
      setIsModalOpen(false);
      await fetchData(); // refresh balances & transactions
    } catch (error: any) {
      toast.error(error?.message || t("credits.purchaseError") || "Purchase failed.");
    } finally {
      setPurchasing(false);
    }
  }, [selectedPlan, fetchData, t]);

  // ---------- Render ----------
  if (loading && !refreshing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
          <p className="mt-4 text-white/60">{t("common.loading") || "Loading..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden">
      {/* Animated background blobs */}
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
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300">
              💳 {t("credits.title") || "My Credits"}
            </h1>
            <p className="text-white/70 mt-1">
              {t("credits.subtitle") || "Manage your credit balances and purchase plans."}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-violet-300 font-medium hover:bg-white/20 hover:text-white transition disabled:opacity-50 mt-4 sm:mt-0"
          >
            <svg
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {refreshing ? t("common.refreshing") || "Refreshing..." : t("common.refresh") || "Refresh"}
          </button>
        </motion.div>

        {/* Balances Section */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white/80 mb-4">
            📊 {t("credits.balances") || "Your Balances"}
          </h2>
          {balances.length === 0 ? (
            <p className="text-white/50">{t("credits.noBalances") || "You don't have any credits yet. Purchase a plan below."}</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {balances.map((b) => (
                <BalanceCard key={b.category} category={b.category_name} balance={b.balance} />
              ))}
            </div>
          )}
        </section>

        {/* Plans Section */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold text-white/80 mb-4">
            🛒 {t("credits.plans") || "Purchase Plans"}
          </h2>
          {plans.length === 0 ? (
            <p className="text-white/50">{t("credits.noPlans") || "No plans available at the moment."}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} onBuy={handleBuy} />
              ))}
            </div>
          )}
        </section>

        {/* Transaction History */}
        <section>
          <h2 className="text-xl font-semibold text-white/80 mb-4">
            📜 {t("credits.transactions") || "Recent Transactions"}
          </h2>
          {transactions.length === 0 ? (
            <p className="text-white/50">{t("credits.noTransactions") || "No transactions yet."}</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
              {transactions.slice(0, 10).map((txn) => (
                <TransactionItem key={txn.id} txn={txn} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Purchase Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <PurchaseModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onConfirm={confirmPurchase}
            plan={selectedPlan}
            purchasing={purchasing}
          />
        )}
      </AnimatePresence>
    </div>
  );
}