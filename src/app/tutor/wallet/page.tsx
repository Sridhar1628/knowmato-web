"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

// ---------- Services ----------
import {
  getTransactionHistory,
  getMyWithdrawals,
  createWithdrawal,
  getTutorBankVerification,
  Transaction,
  Withdrawal,
  TransactionFilters,
  getMyWallet
} from "@/services/v1Service";

// ---------- Types ----------
interface WalletInfo {
  real_balance: number;
  bonus_balance: number;
  total_balance: number;
  earnings: {
    total_earnings: number;
    paid_earnings: number;
    pending_earnings: number;
    sessions_count: number;
  } | null;
}

interface VerificationStatus {
  submitted: boolean;
  verified: boolean;
  status?: string;
  rejection_reason?: string;
}

// ---------- Helpers ----------
const statusBadgeClass = (status: string) => {
  const map: Record<string, string> = {
    pending: "bg-amber-400/20 text-amber-300 border-amber-400/40",
    under_review: "bg-sky-400/20 text-sky-300 border-sky-400/40",
    approved: "bg-emerald-400/20 text-emerald-300 border-emerald-400/40",
    rejected: "bg-rose-400/20 text-rose-300 border-rose-400/40",
    processing: "bg-purple-400/20 text-purple-300 border-purple-400/40",
    completed: "bg-emerald-400/20 text-emerald-300 border-emerald-400/40",
  };
  return map[status] || "bg-gray-400/20 text-gray-300 border-gray-400/40";
};

const statusIcons: Record<string, string> = {
  pending: "⏳",
  under_review: "🔍",
  approved: "✅",
  rejected: "❌",
  processing: "🔄",
  completed: "✅",
};

export default function TutorWalletPage() {
  const router = useRouter();

  // ===== WALLET & TRANSACTIONS =====
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(true);
  const [txFilters, setTxFilters] = useState<TransactionFilters>({});
  const [txSearch, setTxSearch] = useState("");
  const [txDateFrom, setTxDateFrom] = useState("");
  const [txDateTo, setTxDateTo] = useState("");
  const [txPage, setTxPage] = useState(1);
  const [txNext, setTxNext] = useState<string | null>(null);
  const [txPrev, setTxPrev] = useState<string | null>(null);

  // ===== WITHDRAWALS =====
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [wdLoading, setWdLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  // ===== VERIFICATION =====
  const [verification, setVerification] = useState<VerificationStatus | null>(null);
  const [verifLoading, setVerifLoading] = useState(true);

  // ===== DERIVED =====
  const pendingWithdrawalsTotal = withdrawals
    .filter((w) => w.status === "pending" || w.status === "processing")
    .reduce((sum, w) => sum + w.amount, 0);

  const lifetimeEarnings = wallet?.earnings?.total_earnings || 0;

  // ===== FETCH FUNCTIONS =====
  const fetchTransactions = useCallback(async () => {
    setTxLoading(true);
    try {
      const params: TransactionFilters = {
        ...txFilters,
        page: txPage,
        page_size: 10,
        search: txSearch || undefined,
        start_date: txDateFrom || undefined,
        end_date: txDateTo || undefined,
      };
      const res = await getTransactionHistory(params);
      const data = res?.results;
      if (data) {
        setTransactions(data.transactions || []);
        setTxNext(res?.next || null);
        setTxPrev(res?.previous || null);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Failed to load transactions";
      toast.error(msg);
    } finally {
      setTxLoading(false);
    }
  }, [txFilters, txPage, txSearch, txDateFrom, txDateTo]);

  const fetchWithdrawals = useCallback(async () => {
    setWdLoading(true);
    try {
      const res = await getMyWithdrawals();
      setWithdrawals(res?.data?.data || res?.data || []);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Failed to load withdrawals";
      toast.error(msg);
    } finally {
      setWdLoading(false);
    }
  }, []);

  const fetchVerification = useCallback(async () => {
    setVerifLoading(true);
    try {
      const res = await getTutorBankVerification();
      setVerification({
        submitted: res.submitted,
        verified: res.submitted && res.data?.status === "approved",
        status: res.data?.status,
        rejection_reason: res.data?.rejection_reason,
      });
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Failed to load verification";
      toast.error(msg);
    } finally {
      setVerifLoading(false);
    }
  }, []);

  const fetchWallet = useCallback(async () => {
    try {
      const res = await getMyWallet();
      const walletData = res?.data;
      if (walletData) {
        setWallet({
          real_balance: Number(walletData.real_balance),
          bonus_balance: Number(walletData.bonus_balance),
          total_balance: Number(walletData.total_balance),
          earnings: walletData.earnings || null,
        });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Failed to load wallet";
      toast.error(msg);
    }
  }, []);

  useEffect(() => { fetchWallet(); }, [fetchWallet]);
  useEffect(() => { fetchVerification(); }, [fetchVerification]);
  useEffect(() => { fetchWithdrawals(); }, [fetchWithdrawals]);
  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  // ===== WITHDRAW LOGIC =====
  const validateWithdraw = (): boolean => {
    const amount = parseFloat(withdrawAmount);
    if (!withdrawAmount || isNaN(amount) || amount <= 0) {
      setWithdrawError("Please enter a valid amount greater than 0.");
      return false;
    }
    if (wallet && amount > wallet.real_balance) {
      setWithdrawError(`Insufficient real balance. Available: ₹${wallet.real_balance.toFixed(2)}`);
      return false;
    }
    setWithdrawError(null);
    return true;
  };

  const handleWithdraw = async () => {
    if (!validateWithdraw()) return;
    const amount = parseFloat(withdrawAmount);
    setWithdrawing(true);
    setWithdrawError(null);
    try {
      await createWithdrawal({ amount });
      toast.success("Withdrawal request submitted!");
      setShowWithdrawModal(false);
      setWithdrawAmount("");
      setWithdrawError(null);
      await fetchWithdrawals();
      await fetchWallet();
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Withdrawal failed";
      toast.error(msg);
      setWithdrawError(msg);
    } finally {
      setWithdrawing(false);
    }
  };

  const handleCloseModal = () => {
    setShowWithdrawModal(false);
    setWithdrawAmount("");
    setWithdrawError(null);
  };

  // ===== RENDER =====
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden p-4 sm:p-6 lg:p-8">
      {/* Animated blobs */}
      <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
      <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300 flex items-center gap-2">
              <span className="text-4xl">💰</span> My Wallet
            </h1>
            <p className="text-white/70 mt-1 font-medium">
              Manage your earnings, withdrawals & verification
            </p>
          </div>
        </div>

        {/* VERIFICATION CARD */}
        {!verifLoading && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`backdrop-blur-xl rounded-2xl p-5 border shadow-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                verification?.verified
                  ? "bg-emerald-500/10 border-emerald-400/30"
                  : verification?.status === "rejected"
                  ? "bg-rose-500/10 border-rose-400/30"
                  : verification?.submitted
                  ? "bg-sky-500/10 border-sky-400/30"
                  : "bg-amber-500/10 border-amber-400/30"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {verification?.verified
                    ? "✅"
                    : verification?.status === "rejected"
                    ? "❌"
                    : verification?.submitted
                    ? "🔍"
                    : "⚪"}
                </span>
                <div>
                  <p className="font-bold text-white">
                    {verification?.verified
                      ? "Bank Verified"
                      : verification?.status === "rejected"
                      ? "Verification Rejected"
                      : verification?.submitted
                      ? "Under Review"
                      : "Bank Verification Required"}
                  </p>
                  {verification?.rejection_reason && (
                    <p className="text-sm text-rose-300 mt-1 font-medium">
                      Reason: {verification.rejection_reason}
                    </p>
                  )}
                </div>
              </div>
              <div>
                {verification?.verified ? (
                  <button
                    onClick={() => setShowWithdrawModal(true)}
                    className="px-6 py-2.5 bg-gradient-to-r from-teal-400 to-emerald-400 text-white font-bold rounded-xl shadow-lg hover:from-teal-500 hover:to-emerald-500 transition"
                  >
                    Withdraw ₹
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (verification?.status === "rejected") {
                        router.push("/tutor/verification");
                      } else {
                        router.push("/tutor/verification/view");
                      }
                    }}
                    className={`px-6 py-2.5 text-white font-bold rounded-xl shadow-lg transition ${
                      verification?.status === "rejected"
                        ? "bg-gradient-to-r from-rose-400 to-pink-400 hover:from-rose-500 hover:to-pink-500"
                        : verification?.submitted
                        ? "bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500"
                        : "bg-gradient-to-r from-violet-400 to-purple-400 hover:from-violet-500 hover:to-purple-500"
                    }`}
                  >
                    {verification?.status === "rejected"
                      ? "Update Verification"
                      : verification?.submitted
                      ? "View Verification"
                      : "Go to Verification"}
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* WALLET SUMMARY */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { label: "Real Balance", value: wallet?.real_balance?.toFixed(2) ?? "0.00", gradient: "from-teal-400 to-emerald-400", border: "border-teal-400/30" },
            { label: "Total Balance", value: wallet?.total_balance?.toFixed(2) ?? "0.00", gradient: "from-emerald-400 to-green-400", border: "border-emerald-400/30" },
            { label: "Pending Withdrawals", value: pendingWithdrawalsTotal.toFixed(2), gradient: "from-amber-400 to-yellow-400", border: "border-amber-400/30" },
            { label: "Lifetime Earnings", value: lifetimeEarnings.toFixed(2), gradient: "from-violet-400 to-purple-400", border: "border-violet-400/30" },
            { label: "Pending Earnings", value: wallet?.earnings?.pending_earnings?.toFixed(2) ?? "0.00", gradient: "from-sky-400 to-cyan-400", border: "border-sky-400/30" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -4 }}
              className={`bg-white/5 backdrop-blur-xl rounded-2xl p-4 shadow-xl border ${stat.border}`}
            >
              <p className="text-sm text-white/60 font-medium">{stat.label}</p>
              <p className={`text-2xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent mt-1`}>
                ₹{stat.value}
              </p>
            </motion.div>
          ))}
        </div>

        {/* TRANSACTIONS & WITHDRAWALS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* TRANSACTIONS */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              📊 Transaction History
            </h2>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <input
                type="text"
                placeholder="Search..."
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                className="flex-1 bg-gray-900/60 border-2 border-white/20 rounded-xl px-4 py-2.5 text-sm font-medium text-white placeholder-white/40 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/50 transition"
              />
              <input
                type="date"
                value={txDateFrom}
                onChange={(e) => setTxDateFrom(e.target.value)}
                className="bg-gray-900/60 border-2 border-white/20 rounded-xl px-4 py-2.5 text-sm font-medium text-white outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/50 transition"
              />
              <input
                type="date"
                value={txDateTo}
                onChange={(e) => setTxDateTo(e.target.value)}
                className="bg-gray-900/60 border-2 border-white/20 rounded-xl px-4 py-2.5 text-sm font-medium text-white outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/50 transition"
              />
              <select
                value={txFilters.type || ""}
                onChange={(e) =>
                  setTxFilters((prev) => ({ ...prev, type: e.target.value as TransactionFilters["type"] }))
                }
                className="bg-gray-900/60 border-2 border-white/20 rounded-xl px-4 py-2.5 text-sm font-medium text-white outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/50 transition"
              >
                <option value="" className="bg-gray-900">All</option>
                <option value="credit" className="bg-gray-900">Credit</option>
                <option value="debit" className="bg-gray-900">Debit</option>
              </select>
            </div>

            {txLoading ? (
              <div className="animate-pulse space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-6 bg-white/10 rounded" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <EmptyState icon="📊" title="No transactions yet" description="Once you start earning or spending, your transactions will appear here." />
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex justify-between items-center border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      {tx.type === "credit" ? (
                        <span className="text-emerald-400 text-xl">↑</span>
                      ) : (
                        <span className="text-rose-400 text-xl">↓</span>
                      )}
                      <div>
                        <p className="font-semibold text-white">{tx.description}</p>
                        <p className="text-xs text-white/50">{new Date(tx.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <p className={`font-bold ${tx.type === "credit" ? "text-emerald-400" : "text-rose-400"}`}>
                      {tx.type === "credit" ? "+" : "-"}₹{tx.amount}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-center gap-2 mt-4">
              <button
                disabled={!txPrev}
                onClick={() => setTxPage((p) => p - 1)}
                className="px-3 py-1 bg-white/10 text-white/80 rounded-lg font-medium hover:bg-white/20 disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-sm self-center font-medium text-white/60">Page {txPage}</span>
              <button
                disabled={!txNext}
                onClick={() => setTxPage((p) => p + 1)}
                className="px-3 py-1 bg-white/10 text-white/80 rounded-lg font-medium hover:bg-white/20 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>

          {/* WITHDRAWALS */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              🏦 Withdrawal Requests
            </h2>

            {wdLoading ? (
              <div className="animate-pulse space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-white/10 rounded" />
                ))}
              </div>
            ) : withdrawals.length === 0 ? (
              <EmptyState icon="🏦" title="No withdrawal requests" description="Once you request a withdrawal, it will show up here." />
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {withdrawals.map((wd) => (
                  <div
                    key={wd.withdrawal_id}
                    className="border border-white/10 rounded-xl p-3 flex flex-col sm:flex-row justify-between gap-2 bg-white/5"
                  >
                    <div>
                      <p className="font-bold text-white">₹{wd.amount.toFixed(2)}</p>
                      <p className="text-xs text-white/50">
                        Requested: {new Date(wd.created_at).toLocaleString()}
                      </p>
                      {wd.processed_at && (
                        <p className="text-xs text-white/50">
                          Processed: {new Date(wd.processed_at).toLocaleString()}
                        </p>
                      )}
                      {wd.status === "rejected" && wd.admin_notes && (
                        <p className="text-xs text-rose-400 mt-1 font-medium">
                          Reason: {wd.admin_notes}
                        </p>
                      )}
                    </div>
                    <span className={`self-start px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusBadgeClass(wd.status)}`}>
                      {statusIcons[wd.status]} {wd.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* WITHDRAW MODAL */}
      <AnimatePresence>
        {showWithdrawModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-gradient-to-br from-[#1a1535] to-[#0f0c29] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl"
            >
              <h2 className="text-2xl font-bold text-white mb-1">Withdraw Funds</h2>
              <p className="text-sm text-white/70 mb-4">
                Available (Real Balance):{" "}
                <span className="font-bold text-teal-400">
                  ₹{wallet?.real_balance?.toFixed(2) ?? "0.00"}
                </span>
              </p>

              <label className="block text-sm font-semibold text-white/80 mb-1">
                Amount to withdraw
              </label>
              <input
                type="number"
                placeholder="Enter amount"
                value={withdrawAmount}
                onChange={(e) => {
                  setWithdrawAmount(e.target.value);
                  setWithdrawError(null);
                }}
                className="w-full bg-gray-900/60 border-2 border-white/20 rounded-xl px-4 py-3 text-lg font-medium text-white placeholder-white/40 focus:outline-none focus:border-teal-400 focus:ring-4 focus:ring-teal-500/50 transition"
                min={1}
                max={wallet?.real_balance}
              />

              {withdrawError && (
                <p className="mt-2 text-sm text-rose-400 font-medium">{withdrawError}</p>
              )}

              <div className="flex gap-3 mt-5">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 py-3 bg-white/10 border border-white/20 text-white/80 rounded-xl font-bold hover:bg-white/20 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleWithdraw}
                  disabled={withdrawing}
                  className="flex-1 py-3 bg-gradient-to-r from-teal-400 to-emerald-400 text-white rounded-xl font-bold shadow-lg hover:from-teal-500 hover:to-emerald-500 disabled:opacity-70 disabled:cursor-not-allowed transition"
                >
                  {withdrawing ? "Submitting..." : "Withdraw"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------- Empty State ----------
const EmptyState = ({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) => (
  <div className="flex flex-col items-center justify-center py-10 text-center">
    <span className="text-4xl mb-3">{icon}</span>
    <h3 className="text-lg font-bold text-white">{title}</h3>
    <p className="text-sm text-white/50 mt-1 max-w-xs">{description}</p>
  </div>
);