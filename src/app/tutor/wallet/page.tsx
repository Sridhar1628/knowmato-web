// app/tutor/wallet/page.tsx
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
} from "@/services/v1Service";

// ---------- Types ----------
interface WalletInfo {
  real_balance: number;
  bonus_balance: number;
  total_balance: number;
}

interface VerificationData {
  account_holder_name: string;
  account_number: string;
  status: string;
  rejection_reason?: string;
  // ...
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
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    under_review: "bg-blue-100 text-blue-800 border-blue-200",
    approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
    processing: "bg-purple-100 text-purple-800 border-purple-200",
    completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  };
  return map[status] || "bg-gray-100 text-gray-800 border-gray-200";
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

  // ===== VERIFICATION =====
  const [verification, setVerification] = useState<VerificationStatus | null>(null);
  const [verifLoading, setVerifLoading] = useState(true);

  // ===== DERIVED =====
  const pendingWithdrawalsTotal = withdrawals
    .filter((w) => w.status === "pending" || w.status === "processing")
    .reduce((sum, w) => sum + w.amount, 0);

  const lifetimeEarnings = 0; // Replace with actual API call if available

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
      const data = res?.data;
      if (data) {
        setWallet({
          real_balance: data.wallet.real_balance,
          bonus_balance: data.wallet.bonus_balance,
          total_balance: data.wallet.total_balance,
        });
        setTransactions(data.transactions || []);
        setTxNext(data.next);
        setTxPrev(data.previous);
      }
    } catch (err) {
      toast.error("Failed to load transactions");
    } finally {
      setTxLoading(false);
    }
  }, [txFilters, txPage, txSearch, txDateFrom, txDateTo]);

  const fetchWithdrawals = useCallback(async () => {
    setWdLoading(true);
    try {
      const res = await getMyWithdrawals();
      setWithdrawals(res?.data?.data || res?.data || []);
    } catch (err) {
      toast.error("Failed to load withdrawals");
    } finally {
      setWdLoading(false);
    }
  }, []);

  const fetchVerification = useCallback(async () => {
    setVerifLoading(true);
    try {
      const res = await getTutorBankVerification();
      const data = res?.data || res;
      if (data) {
        setVerification({
          submitted: data.submitted,
          verified: data.submitted && data.data?.status === "approved",
          status: data.data?.status,
          rejection_reason: data.data?.rejection_reason,
        });
      }
    } catch {
      // ignore
    } finally {
      setVerifLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVerification();
  }, [fetchVerification]);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // ===== WITHDRAW =====
  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setWithdrawing(true);
    try {
      await createWithdrawal({ amount });
      toast.success("Withdrawal request submitted!");
      setShowWithdrawModal(false);
      setWithdrawAmount("");
      fetchWithdrawals();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Withdrawal failed");
    } finally {
      setWithdrawing(false);
    }
  };

  // ===== RENDER =====
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ===== HEADER ===== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
              <span className="text-4xl">💰</span> My Wallet
            </h1>
            <p className="text-gray-600 mt-1">Manage your earnings, withdrawals & verification</p>
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
                  ? "bg-emerald-50 border-emerald-200"
                  : verification?.status === "rejected"
                  ? "bg-red-50 border-red-200"
                  : verification?.submitted
                  ? "bg-blue-50 border-blue-200"
                  : "bg-gray-100 border-gray-200"
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
                  <p className="font-bold text-gray-800">
                    {verification?.verified
                      ? "Bank Verified"
                      : verification?.status === "rejected"
                      ? "Verification Rejected"
                      : verification?.submitted
                      ? "Under Review"
                      : "Not Submitted"}
                  </p>
                  {verification?.rejection_reason && (
                    <p className="text-sm text-red-600 mt-1">
                      Reason: {verification.rejection_reason}
                    </p>
                  )}
                </div>
              </div>
              <div>
                {verification?.verified ? (
                    <button
                        onClick={() => setShowWithdrawModal(true)}
                        className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition"
                    >
                        Withdraw ₹
                    </button>
                    ) : (
                    <button
                        onClick={() => router.push("/tutor/verification")}
                        className={`px-6 py-2.5 text-white font-semibold rounded-xl transition ${
                        verification?.status === "rejected"
                            ? "bg-red-600 hover:bg-red-700"
                            : verification?.submitted
                            ? "bg-amber-600 hover:bg-amber-700"
                            : "bg-blue-600 hover:bg-blue-700"
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
          <motion.div whileHover={{ y: -4 }} className="bg-white rounded-2xl p-4 shadow-sm border">
            <p className="text-sm text-gray-500">Real Balance</p>
            <p className="text-2xl font-bold text-indigo-700 mt-1">
              ₹{wallet?.real_balance?.toFixed(2) ?? "0.00"}
            </p>
          </motion.div>
          <motion.div whileHover={{ y: -4 }} className="bg-white rounded-2xl p-4 shadow-sm border">
            <p className="text-sm text-gray-500">Bonus Balance</p>
            <p className="text-2xl font-bold text-purple-700 mt-1">
              ₹{wallet?.bonus_balance?.toFixed(2) ?? "0.00"}
            </p>
          </motion.div>
          <motion.div whileHover={{ y: -4 }} className="bg-white rounded-2xl p-4 shadow-sm border">
            <p className="text-sm text-gray-500">Total Balance</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              ₹{wallet?.total_balance?.toFixed(2) ?? "0.00"}
            </p>
          </motion.div>
          <motion.div whileHover={{ y: -4 }} className="bg-white rounded-2xl p-4 shadow-sm border">
            <p className="text-sm text-gray-500">Pending Withdrawals</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              ₹{pendingWithdrawalsTotal.toFixed(2)}
            </p>
          </motion.div>
          <motion.div whileHover={{ y: -4 }} className="bg-white rounded-2xl p-4 shadow-sm border">
            <p className="text-sm text-gray-500">Lifetime Earnings</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              ₹{lifetimeEarnings.toFixed(2)}
            </p>
          </motion.div>
        </div>

        {/* ===== TRANSACTIONS & WITHDRAWALS (desktop 2-col) ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ----- TRANSACTIONS ----- */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              📊 Transaction History
            </h2>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <input
                type="text"
                placeholder="Search..."
                value={txSearch}
                onChange={(e) => setTxSearch(e.target.value)}
                className="flex-1 border rounded-xl px-3 py-2 text-sm"
              />
              <input
                type="date"
                value={txDateFrom}
                onChange={(e) => setTxDateFrom(e.target.value)}
                className="border rounded-xl px-3 py-2 text-sm"
              />
              <input
                type="date"
                value={txDateTo}
                onChange={(e) => setTxDateTo(e.target.value)}
                className="border rounded-xl px-3 py-2 text-sm"
              />
              <select
                value={txFilters.type || ""}
                onChange={(e) =>
                  setTxFilters((prev) => ({
                    ...prev,
                    type: e.target.value as TransactionFilters["type"],
                  }))
                }
                className="border rounded-xl px-3 py-2 text-sm"
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
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex justify-between items-center border-b pb-2">
                    <div className="flex items-center gap-2">
                      {tx.type === "credit" ? (
                        <span className="text-emerald-500 text-xl">↑</span>
                      ) : (
                        <span className="text-red-500 text-xl">↓</span>
                      )}
                      <div>
                        <p className="font-medium text-gray-800">{tx.description}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <p className={`font-bold ${tx.type === "credit" ? "text-emerald-600" : "text-red-500"}`}>
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
                className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-sm self-center">Page {txPage}</span>
              <button
                disabled={!txNext}
                onClick={() => setTxPage((p) => p + 1)}
                className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>

          {/* ----- WITHDRAWALS ----- */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
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
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {withdrawals.map((wd) => (
                  <div
                    key={wd.withdrawal_id}
                    className="border border-gray-200 rounded-xl p-3 flex flex-col sm:flex-row justify-between gap-2"
                  >
                    <div>
                      <p className="font-semibold text-gray-800">₹{wd.amount.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">
                        Requested: {new Date(wd.created_at).toLocaleDateString()}
                      </p>
                      {wd.processed_at && (
                        <p className="text-xs text-gray-500">
                          Processed: {new Date(wd.processed_at).toLocaleDateString()}
                        </p>
                      )}
                      {wd.status === "rejected" && wd.admin_notes && (
                        <p className="text-xs text-red-600 mt-1">
                          Reason: {wd.admin_notes}
                        </p>
                      )}
                    </div>
                    <span
                      className={`self-start px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusBadge(
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
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">Withdraw Funds</h2>
              <p className="text-sm text-gray-600 mb-2">
                Real Balance: ₹{wallet?.real_balance?.toFixed(2) ?? "0.00"}
              </p>
              <input
                type="number"
                placeholder="Enter amount"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                min={1}
                max={wallet?.real_balance}
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 py-2.5 bg-gray-200 rounded-xl font-semibold hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleWithdraw}
                  disabled={withdrawing}
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-70"
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
    <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
    <p className="text-sm text-gray-500 mt-1 max-w-xs">{description}</p>
  </div>
);