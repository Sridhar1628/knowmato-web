"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  getAdminWithdrawalDetail,
  updateAdminWithdrawal,
} from "@/services/v1Service";
import AdminLayout from "@/app/admin/AdminLayout";

// ---------- Types ----------
interface WithdrawalDetail {
  withdrawal_id: number;
  tutor: {
    id: number;
    name: string;
    email: string;
  };
  wallet: {
    real_balance: number;
    bonus_balance: number;
  };
  amount: number;
  status: string; // pending, processing, completed, rejected
  admin_notes?: string;
  processed_at?: string;
  processed_by?: string;
  created_at: string;
  transaction_id?: number;
  verification: {
    account_holder_name: string;
    account_number: string;
    ifsc_code: string;
    bank_name: string;
    branch_name: string;
    account_type: string;
    pan_number: string;
    aadhaar_number?: string;
    mobile_number: string;
    bank_proof?: string;
    pan_card?: string;
  };
}

// ---------- Status helpers (dark theme) ----------
const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    pending: "bg-amber-400/20 text-amber-300 border-amber-400/40",
    processing: "bg-purple-400/20 text-purple-300 border-purple-400/40",
    completed: "bg-emerald-400/20 text-emerald-300 border-emerald-400/40",
    rejected: "bg-rose-400/20 text-rose-300 border-rose-400/40",
  };
  return map[status] || "bg-gray-400/20 text-gray-300 border-gray-400/40";
};

const statusIcons: Record<string, string> = {
  pending: "⏳",
  processing: "🔄",
  completed: "✅",
  rejected: "❌",
};

// ---------- Skeleton (dark) ----------
const DetailSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-8 w-1/3 bg-white/10 rounded" />
    <div className="h-4 w-2/3 bg-white/10 rounded" />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-20 bg-white/10 rounded-2xl" />
      ))}
    </div>
    <div className="h-40 bg-white/10 rounded-2xl" />
  </div>
);

export default function AdminWithdrawalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const withdrawalId = Number(params.id);

  const [withdrawal, setWithdrawal] = useState<WithdrawalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Update form state
  const [selectedStatus, setSelectedStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  // Image modal
  const [imageModal, setImageModal] = useState<string | null>(null);

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminWithdrawalDetail(withdrawalId);
      const data = res?.data?.data ?? res?.data ?? null;
      if (!data) throw new Error("Withdrawal not found");
      setWithdrawal(data);
      setSelectedStatus(data.status);
      setAdminNotes(data.admin_notes || "");
    } catch (err: any) {
      setError(err?.message || "Failed to load withdrawal details");
      toast.error("Failed to load details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (withdrawalId) fetchDetail();
  }, [withdrawalId]);

  const handleUpdate = async () => {
    if (!withdrawal || updating) return;
    setUpdating(true);
    try {
      await updateAdminWithdrawal(withdrawalId, {
        status: selectedStatus as any,
        admin_notes: adminNotes,
      });
      toast.success("Withdrawal updated");
      await fetchDetail(); // refresh
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  // Quick action handlers
  const handleQuickAction = async (newStatus: "processing" | "rejected") => {
    if (!withdrawal || updating) return;
    const confirmMsg =
      newStatus === "processing"
        ? "Start processing this withdrawal request?"
        : "Reject this withdrawal request?";
    if (!window.confirm(confirmMsg)) return;

    setUpdating(true);
    try {
      await updateAdminWithdrawal(withdrawalId, {
        status: newStatus,
        admin_notes: adminNotes, // keep existing notes
      });
      toast.success(`Withdrawal ${newStatus}`);
      await fetchDetail();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Action failed");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 relative">
        {/* Animated blobs */}
        <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob pointer-events-none" />
        <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000 pointer-events-none" />
        <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000 pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto">
          {/* Back button */}
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/admin/withdrawals")}
            className="mb-6 flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-md text-white font-semibold rounded-full border border-white/20 hover:border-white/40 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Withdrawals
          </motion.button>

          {loading ? (
            <DetailSkeleton />
          ) : error ? (
            <div className="bg-rose-500/10 border border-rose-400/40 text-rose-300 rounded-2xl p-6 text-center backdrop-blur-md">
              <p className="font-bold text-lg mb-2">⚠️ {error}</p>
              <button
                onClick={fetchDetail}
                className="px-4 py-2 bg-rose-400/20 hover:bg-rose-400/30 rounded-xl font-medium"
              >
                Retry
              </button>
            </div>
          ) : !withdrawal ? (
            <div className="text-center py-20 text-white/60">Withdrawal not found.</div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Header Card */}
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 rounded-full blur-2xl" />
                <div className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                      {withdrawal.tutor.name}
                    </h1>
                    <p className="text-white/70">{withdrawal.tutor.email}</p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-bold border ${statusBadge(
                      withdrawal.status
                    )}`}
                  >
                    {statusIcons[withdrawal.status]} {withdrawal.status.replace("_", " ")}
                  </span>
                </div>

                {/* Amount & Wallet */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                  <div className="bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 backdrop-blur-md rounded-xl p-5 border border-white/10">
                    <p className="text-sm text-white/70">Withdrawal Amount</p>
                    <p className="text-2xl font-bold text-white mt-1">
                      ₹{withdrawal.amount.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-md rounded-xl p-5 border border-white/10">
                    <p className="text-sm text-white/70">Real Balance</p>
                    <p className="text-2xl font-bold text-white mt-1">
                      ₹{withdrawal.wallet.real_balance.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-md rounded-xl p-5 border border-white/10">
                    <p className="text-sm text-white/70">Bonus Balance</p>
                    <p className="text-2xl font-bold text-white mt-1">
                      ₹{withdrawal.wallet.bonus_balance.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Meta Data */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                  <DetailItem
                    label="Created"
                    value={new Date(withdrawal.created_at).toLocaleString()}
                  />
                  {withdrawal.processed_at && (
                    <DetailItem
                      label="Processed"
                      value={new Date(withdrawal.processed_at).toLocaleString()}
                    />
                  )}
                  {withdrawal.processed_by && (
                    <DetailItem label="Processed By" value={withdrawal.processed_by} />
                  )}
                  {withdrawal.transaction_id && (
                    <DetailItem
                      label="Transaction ID"
                      value={`#${withdrawal.transaction_id}`}
                    />
                  )}
                </div>
              </div>

              {/* Bank Details */}
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                  <span className="w-1.5 h-6 bg-gradient-to-b from-violet-400 to-fuchsia-400 rounded-full" />
                  Bank Details
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <DetailItem
                    label="Account Holder"
                    value={withdrawal.verification.account_holder_name}
                  />
                  <DetailItem
                    label="Account Number"
                    value={withdrawal.verification.account_number}
                  />
                  <DetailItem
                    label="IFSC Code"
                    value={withdrawal.verification.ifsc_code}
                  />
                  <DetailItem
                    label="Bank Name"
                    value={withdrawal.verification.bank_name}
                  />
                  <DetailItem
                    label="Branch"
                    value={withdrawal.verification.branch_name}
                  />
                  <DetailItem
                    label="Account Type"
                    value={withdrawal.verification.account_type}
                  />
                  <DetailItem
                    label="PAN Number"
                    value={withdrawal.verification.pan_number}
                  />
                  {withdrawal.verification.aadhaar_number && (
                    <DetailItem
                      label="Aadhaar"
                      value={withdrawal.verification.aadhaar_number}
                    />
                  )}
                  <DetailItem
                    label="Mobile"
                    value={withdrawal.verification.mobile_number}
                  />
                </div>

                {/* Document Previews */}
                {(withdrawal.verification.bank_proof ||
                  withdrawal.verification.pan_card) && (
                  <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {withdrawal.verification.bank_proof && (
                      <div>
                        <p className="text-sm font-medium text-white/70 mb-2">
                          Bank Proof
                        </p>
                        <img
                          src={withdrawal.verification.bank_proof}
                          alt="Bank proof"
                          className="max-h-48 rounded-xl border border-white/20 object-cover cursor-pointer hover:opacity-90 transition"
                          onClick={() =>
                            setImageModal(withdrawal.verification.bank_proof!)
                          }
                        />
                      </div>
                    )}
                    {withdrawal.verification.pan_card && (
                      <div>
                        <p className="text-sm font-medium text-white/70 mb-2">
                          PAN Card
                        </p>
                        <img
                          src={withdrawal.verification.pan_card}
                          alt="PAN card"
                          className="max-h-48 rounded-xl border border-white/20 object-cover cursor-pointer hover:opacity-90 transition"
                          onClick={() =>
                            setImageModal(withdrawal.verification.pan_card!)
                          }
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Admin Notes (if any) */}
              {withdrawal.admin_notes && (
                <div className="bg-white/5 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl">
                  <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-3">
                    <span className="w-1.5 h-6 bg-gradient-to-b from-violet-400 to-fuchsia-400 rounded-full" />
                    Admin Notes
                  </h2>
                  <p className="text-white/80 whitespace-pre-wrap">{withdrawal.admin_notes}</p>
                </div>
              )}

              {/* Update Panel – only if not completed/rejected */}
              {withdrawal.status !== "completed" &&
                withdrawal.status !== "rejected" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden"
                  >
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-violet-400/30 to-fuchsia-400/30 rounded-full blur-2xl" />
                    <div className="relative">
                      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-gradient-to-b from-violet-400 to-fuchsia-400 rounded-full" />
                        Update Withdrawal
                      </h2>

                      {/* Quick Accept / Reject Buttons */}
                      <div className="flex gap-4 mb-8">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleQuickAction("processing")}
                          disabled={updating}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-500/20 text-emerald-300 font-bold rounded-2xl border border-emerald-400/30 hover:bg-emerald-500/30 hover:text-white transition disabled:opacity-50"
                        >
                          ✅ Approve
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleQuickAction("rejected")}
                          disabled={updating}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-rose-500/20 text-rose-300 font-bold rounded-2xl border border-rose-400/30 hover:bg-rose-500/30 hover:text-white transition disabled:opacity-50"
                        >
                          ❌ Reject
                        </motion.button>
                      </div>

                      {/* Manual Status Change & Notes */}
                      <div className="space-y-5">
                        <div>
                          <label className="block text-sm font-bold text-violet-300 mb-2">
                            Status
                          </label>
                          <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="w-full bg-gray-900/60 border-2 border-white/20 rounded-2xl px-4 py-3 text-sm font-medium text-white focus:ring-4 focus:ring-violet-500/50 focus:border-violet-400 outline-none backdrop-blur-sm appearance-none cursor-pointer"
                          >
                            <option value="pending" className="bg-gray-900">⏳ Pending</option>
                            <option value="processing" className="bg-gray-900">🔄 Processing</option>
                            <option value="completed" className="bg-gray-900">✅ Completed</option>
                            <option value="rejected" className="bg-gray-900">❌ Rejected</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-violet-300 mb-2">
                            Admin Notes
                          </label>
                          <textarea
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            className="w-full bg-gray-900/60 border-2 border-white/20 rounded-2xl p-4 text-sm min-h-[100px] text-white placeholder-white/40 focus:ring-4 focus:ring-violet-500/50 focus:border-violet-400 outline-none backdrop-blur-sm resize-y"
                            placeholder="Add notes about this withdrawal..."
                          />
                        </div>
                        <div className="flex justify-end gap-3">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => router.push("/admin/withdrawals")}
                            className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-2xl transition-colors border border-white/20"
                          >
                            Cancel
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={handleUpdate}
                            disabled={updating}
                            className="px-5 py-2.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white font-bold rounded-2xl shadow-lg shadow-violet-500/25 disabled:opacity-60 transition flex items-center gap-2"
                          >
                            {updating ? (
                              <>
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                </svg>
                                Saving...
                              </>
                            ) : (
                              "Save Changes"
                            )}
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
            </motion.div>
          )}
        </div>

        {/* Image Modal */}
        {imageModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setImageModal(null)}
          >
            <div
              className="relative max-w-4xl max-h-[90vh] bg-gradient-to-b from-gray-900 to-gray-800 rounded-2xl overflow-hidden shadow-2xl border border-white/20"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={imageModal}
                alt="Document preview"
                className="w-full h-auto max-h-[80vh] object-contain"
              />
              <button
                onClick={() => setImageModal(null)}
                className="absolute top-3 right-3 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

// Reusable detail item (dark theme)
const DetailItem = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10">
    <p className="text-xs text-white/50">{label}</p>
    <p className="font-medium text-white break-all">{value}</p>
  </div>
);