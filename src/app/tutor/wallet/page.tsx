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
const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 border-amber-300",
    under_review: "bg-blue-100 text-blue-800 border-blue-300",
    approved: "bg-emerald-100 text-emerald-800 border-emerald-300",
    rejected: "bg-red-100 text-red-800 border-red-300",
    processing: "bg-purple-100 text-purple-800 border-purple-300",
    completed: "bg-emerald-100 text-emerald-800 border-emerald-300",
  };
  return map[status] || "bg-gray-100 text-gray-800 border-gray-300";
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

  const lifetimeEarnings =
    wallet?.earnings?.total_earnings || 0;

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

      console.log("Transaction RESPONSE:", res);

      const data = res?.results;

      if (data) {

        setTransactions(
          data.transactions || []
        );

        setTxNext(
          res?.next || null
        );

        setTxPrev(
          res?.previous || null
        );

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

        console.log("WALLET RESPONSE:", res);

        console.log("RES.DATA:", res?.data);

        console.log("RES.DATA.DATA:", res?.data?.data);

      const walletData =
        res?.data;

      if (walletData) {

        setWallet({

          real_balance:
            Number(walletData.real_balance),

          bonus_balance:
            Number(walletData.bonus_balance),

          total_balance:
            Number(walletData.total_balance),

          earnings:
            walletData.earnings || null,

        });

      }

    } catch (err: any) {

      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to load wallet";

      toast.error(msg);

    }

  }, []);

  useEffect(() => {

    fetchWallet();

  }, [fetchWallet]);

  useEffect(() => {
    fetchVerification();
  }, [fetchVerification]);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

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
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-amber-50 to-orange-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ===== HEADER ===== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
              <span className="text-4xl">💰</span> My Wallet
            </h1>
            <p className="text-gray-600 mt-1 font-medium">
              Manage your earnings, withdrawals & verification
            </p>
          </div>
        </div>

        {/* ===== VERIFICATION CARD ===== */}
        {!verifLoading && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl p-5 border shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                verification?.verified
                  ? "bg-emerald-50 border-emerald-300"
                  : verification?.status === "rejected"
                  ? "bg-red-50 border-red-300"
                  : verification?.submitted
                  ? "bg-blue-50 border-blue-300"
                  : "bg-amber-50 border-amber-300"
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
                  <p className="font-bold text-gray-900">
                    {verification?.verified
                      ? "Bank Verified"
                      : verification?.status === "rejected"
                      ? "Verification Rejected"
                      : verification?.submitted
                      ? "Under Review"
                      : "Bank Verification Required"}
                  </p>
                  {verification?.rejection_reason && (
                    <p className="text-sm text-red-700 mt-1 font-medium">
                      Reason: {verification.rejection_reason}
                    </p>
                  )}
                </div>
              </div>
              <div>
                {verification?.verified ? (
                  <button
                    onClick={() => setShowWithdrawModal(true)}
                    className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold rounded-xl shadow-md hover:from-teal-600 hover:to-emerald-600 transition"
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
                    className={`px-6 py-2.5 text-white font-bold rounded-xl shadow-md transition ${
                      verification?.status === "rejected"
                        ? "bg-red-600 hover:bg-red-700"
                        : verification?.submitted
                        ? "bg-amber-600 hover:bg-amber-700"
                        : "bg-teal-600 hover:bg-teal-700"
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

        {/* ===== WALLET SUMMARY ===== */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <motion.div whileHover={{ y: -4 }} className="bg-white rounded-2xl p-4 shadow-md border border-amber-100">
            <p className="text-sm text-gray-600 font-medium">Real Balance</p>
            <p className="text-2xl font-bold text-teal-700 mt-1">
              ₹{wallet?.real_balance?.toFixed(2) ?? "0.00"}
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -4 }}
            className="bg-white rounded-2xl p-4 shadow-md border border-emerald-100"
          >
            <p className="text-sm text-gray-600 font-medium">
              Total Balance
            </p>

            <p className="text-2xl font-bold text-emerald-700 mt-1">
              ₹{wallet?.total_balance?.toFixed(2) ?? "0.00"}
            </p>
          </motion.div>
          <motion.div whileHover={{ y: -4 }} className="bg-white rounded-2xl p-4 shadow-md border border-amber-100">
            <p className="text-sm text-gray-600 font-medium">Pending Withdrawals</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              ₹{pendingWithdrawalsTotal.toFixed(2)}
            </p>
          </motion.div>
          <motion.div whileHover={{ y: -4 }} className="bg-white rounded-2xl p-4 shadow-md border border-emerald-100">
            <p className="text-sm text-gray-600 font-medium">Lifetime Earnings</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              ₹{lifetimeEarnings.toFixed(2)}
            </p>
          </motion.div>
          <motion.div
            whileHover={{ y: -4 }}
            className="bg-white rounded-2xl p-4 shadow-md border border-purple-100"
          >
            <p className="text-sm text-gray-600 font-medium">
              Pending Earnings
            </p>

            <p className="text-2xl font-bold text-purple-600 mt-1">
              ₹{
                wallet?.earnings?.pending_earnings?.toFixed(2)
                ?? "0.00"
              }
            </p>
          </motion.div>
        </div>

        {/* ===== TRANSACTIONS & WITHDRAWALS (desktop 2-col) ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ----- TRANSACTIONS ----- */}
          <div className="bg-white rounded-2xl p-5 shadow-md border border-teal-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              📊 Transaction History
            </h2>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <input
                type="text"
                placeholder="Search..."
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                className="
                  flex-1 rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900
                  placeholder:text-gray-400 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100
                "
              />
              <input
                type="date"
                value={txDateFrom}
                onChange={(e) => setTxDateFrom(e.target.value)}
                className="
                  rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900
                  outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100
                "
              />
              <input
                type="date"
                value={txDateTo}
                onChange={(e) => setTxDateTo(e.target.value)}
                className="
                  rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900
                  outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100
                "
              />
              <select
                value={txFilters.type || ""}
                onChange={(e) =>
                  setTxFilters((prev) => ({
                    ...prev,
                    type: e.target.value as TransactionFilters["type"],
                  }))
                }
                className="
                  rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900
                  outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100
                "
              >
                <option value="">All</option>
                <option value="credit">Credit</option>
                <option value="debit">Debit</option>
              </select>
            </div>

            {/* Transaction list */}
            {txLoading ? (
              <div className="animate-pulse space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-6 bg-gray-100 rounded" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <EmptyState
                icon="📊"
                title="No transactions yet"
                description="Once you start earning or spending, your transactions will appear here."
              />
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex justify-between items-center border-b border-gray-100 pb-2"
                  >
                    <div className="flex items-center gap-2">
                      {tx.type === "credit" ? (
                        <span className="text-emerald-500 text-xl">↑</span>
                      ) : (
                        <span className="text-red-500 text-xl">↓</span>
                      )}
                      <div>
                        <p className="font-semibold text-gray-800">{tx.description}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(tx.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <p
                      className={`font-bold ${
                        tx.type === "credit" ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {tx.type === "credit" ? "+" : "-"}₹{tx.amount}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            <div className="flex justify-center gap-2 mt-4">
              <button
                disabled={!txPrev}
                onClick={() => setTxPage((p) => p - 1)}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-sm self-center font-medium text-gray-600">Page {txPage}</span>
              <button
                disabled={!txNext}
                onClick={() => setTxPage((p) => p + 1)}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>

          {/* ----- WITHDRAWALS ----- */}
          <div className="bg-white rounded-2xl p-5 shadow-md border border-amber-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              🏦 Withdrawal Requests
            </h2>

            {wdLoading ? (
              <div className="animate-pulse space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded" />
                ))}
              </div>
            ) : withdrawals.length === 0 ? (
              <EmptyState
                icon="🏦"
                title="No withdrawal requests"
                description="Once you request a withdrawal, it will show up here."
              />
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {withdrawals.map((wd) => (
                  <div
                    key={wd.withdrawal_id}
                    className="border border-gray-200 rounded-xl p-3 flex flex-col sm:flex-row justify-between gap-2 bg-gray-50/50"
                  >
                    <div>
                      <p className="font-bold text-gray-800">₹{wd.amount.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">
                        Requested: {new Date(wd.created_at).toLocaleString()}
                      </p>
                      {wd.processed_at && (
                        <p className="text-xs text-gray-500">
                          Processed: {new Date(wd.processed_at).toLocaleString()}
                        </p>
                      )}
                      {wd.status === "rejected" && wd.admin_notes && (
                        <p className="text-xs text-red-600 mt-1 font-medium">
                          Reason: {wd.admin_notes}
                        </p>
                      )}
                    </div>
                    <span
                      className={`self-start px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusBadge(
                        wd.status
                      )}`}
                    >
                      {statusIcons[wd.status]} {wd.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== WITHDRAW MODAL ===== */}
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
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-teal-100"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Withdraw Funds</h2>
              <p className="text-sm text-gray-600 mb-4">
                Available (Real Balance):{" "}
                <span className="font-bold text-teal-700">
                  ₹{wallet?.real_balance?.toFixed(2) ?? "0.00"}
                </span>
              </p>

              <label className="block text-sm font-semibold text-gray-700 mb-1">
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
                className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-lg font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100 transition"
                min={1}
                max={wallet?.real_balance}
              />

              {/* Error message */}
              {withdrawError && (
                <p className="mt-2 text-sm text-red-600 font-medium">{withdrawError}</p>
              )}

              <div className="flex gap-3 mt-5">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 py-3 bg-gray-200 rounded-xl font-bold text-gray-700 hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleWithdraw}
                  disabled={withdrawing}
                  className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-xl font-bold shadow-md hover:from-teal-600 hover:to-emerald-600 transition disabled:opacity-70 disabled:cursor-not-allowed"
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

// ---------- Reusable Empty State ----------
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
    <h3 className="text-lg font-bold text-gray-800">{title}</h3>
    <p className="text-sm text-gray-500 mt-1 max-w-xs">{description}</p>
  </div>
);