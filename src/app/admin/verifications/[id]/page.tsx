"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  getAdminVerificationDetail,
  updateAdminVerification,
} from "@/services/v1Service";
import AdminLayout from "@/app/admin/AdminLayout";
import { API_HOST } from "@/config/env";

// ---------- Types ----------
interface VerificationDetail {
  verification_id: number;
  tutor: {
    id: number;
    name: string;
    email: string;
  };
  account_holder_name: string;
  account_number: string;
  ifsc_code: string;
  bank_name: string;
  branch_name: string;
  account_type: string;
  pan_number: string;
  aadhaar_number?: string;
  mobile_number: string;
  bank_proof: string | null;
  pan_card: string | null;
  status: string; // pending / under_review / approved / rejected
  rejection_reason?: string;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
}

// ---------- Status Badge (dark) ----------
const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    pending: "bg-amber-400/20 text-amber-300 border-amber-400/40",
    under_review: "bg-sky-400/20 text-sky-300 border-sky-400/40",
    approved: "bg-emerald-400/20 text-emerald-300 border-emerald-400/40",
    rejected: "bg-rose-400/20 text-rose-300 border-rose-400/40",
  };
  return map[status] || "bg-gray-400/20 text-gray-300 border-gray-400/40";
};

const statusIcons: Record<string, string> = {
  pending: "⏳",
  under_review: "🔍",
  approved: "✅",
  rejected: "❌",
};

// ---------- Skeleton (dark) ----------
const DetailSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-8 w-1/3 bg-white/10 rounded" />
    <div className="h-4 w-2/3 bg-white/10 rounded" />
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="h-20 bg-white/10 rounded-2xl" />
      ))}
    </div>
    <div className="h-40 bg-white/10 rounded-2xl" />
  </div>
);

const getMediaUrl = (path?: string | null) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  if (path.startsWith("/")) return `${API_HOST}${path}`;
  return `${API_HOST}/media/${path}`;
};

// Reusable detail item (dark)
const DetailItem = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/10">
    <p className="text-xs text-white/50">{label}</p>
    <p className="font-medium text-white break-all">{value}</p>
  </div>
);

export default function AdminVerificationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const verificationId = Number(params.id);

  const [verification, setVerification] = useState<VerificationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Update form state
  const [selectedStatus, setSelectedStatus] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [updating, setUpdating] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Image modal
  const [imageModal, setImageModal] = useState<string | null>(null);

  const fetchDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminVerificationDetail(verificationId);
      const data = res?.data?.data ?? res?.data ?? null;
      if (!data) throw new Error("Verification not found");
      setVerification(data);
      setSelectedStatus(data.status);
      setRejectionReason(data.rejection_reason || "");
    } catch (err: any) {
      setError(err?.message || "Failed to load verification details");
      toast.error("Failed to load details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (verificationId) fetchDetail();
  }, [verificationId]);

  // ---------- Quick Approve / Reject ----------
  const handleQuickUpdate = async (newStatus: "approved" | "rejected") => {
    if (!verification || actionLoading) return;
    let reason = "";
    if (newStatus === "rejected") {
      reason = window.prompt("Rejection reason (optional):") || "";
      if (reason === null) return; // cancelled
    }
    const confirmed = window.confirm(
      `Confirm ${newStatus} this verification?`
    );
    if (!confirmed) return;

    setActionLoading(true);
    try {
      await updateAdminVerification(verificationId, {
        status: newStatus,
        rejection_reason: reason,
      });
      toast.success(`Verification ${newStatus}`);
      fetchDetail(); // refresh
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!verification || updating) return;
    setUpdating(true);
    try {
      await updateAdminVerification(verificationId, {
        status: selectedStatus as any,
        rejection_reason: rejectionReason,
      });
      toast.success("Verification updated");
      await fetchDetail();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8 relative">
        {/* Background blobs */}
        <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob pointer-events-none" />
        <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000 pointer-events-none" />
        <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000 pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto">
          {/* Back button */}
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/admin/verifications")}
            className="mb-6 flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-md text-white font-semibold rounded-full border border-white/20 hover:border-white/40 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Verifications
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
          ) : !verification ? (
            <div className="text-center py-20 text-white/60">Verification not found.</div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Header Card */}
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-extrabold text-white">
                      {verification.tutor.name}
                    </h1>
                    <p className="text-sm text-white/60">{verification.tutor.email}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold border ${statusBadge(
                        verification.status
                      )}`}
                    >
                      {statusIcons[verification.status]} {verification.status.replace("_", " ")}
                    </span>
                    {/* Quick Approve / Reject buttons (only if not final) */}
                    {verification.status !== "approved" && verification.status !== "rejected" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleQuickUpdate("approved")}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-xl font-semibold text-sm hover:bg-emerald-500/30 transition disabled:opacity-50"
                        >
                          ✅ Approve
                        </button>
                        <button
                          onClick={() => handleQuickUpdate("rejected")}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-rose-500/20 text-rose-300 border border-rose-400/30 rounded-xl font-semibold text-sm hover:bg-rose-500/30 transition disabled:opacity-50"
                        >
                          ❌ Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                  <DetailItem label="Account Holder" value={verification.account_holder_name} />
                  <DetailItem label="Account Number" value={verification.account_number} />
                  <DetailItem label="IFSC Code" value={verification.ifsc_code} />
                  <DetailItem label="Bank Name" value={verification.bank_name} />
                  <DetailItem label="Branch" value={verification.branch_name} />
                  <DetailItem label="Account Type" value={verification.account_type} />
                  <DetailItem label="PAN Number" value={verification.pan_number} />
                  {verification.aadhaar_number && (
                    <DetailItem label="Aadhaar" value={verification.aadhaar_number} />
                  )}
                  <DetailItem label="Mobile" value={verification.mobile_number} />
                  <DetailItem
                    label="Created"
                    value={new Date(verification.created_at).toLocaleDateString()}
                  />
                  {verification.verified_by && (
                    <DetailItem label="Verified By" value={verification.verified_by} />
                  )}
                  {verification.verified_at && (
                    <DetailItem
                      label="Verified At"
                      value={new Date(verification.verified_at).toLocaleDateString()}
                    />
                  )}
                </div>

                {/* Documents */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {verification.bank_proof && (
                    <div>
                      <p className="text-sm font-medium text-white/70 mb-1">Bank Proof</p>
                      <img
                        src={getMediaUrl(verification.bank_proof)}
                        alt="Bank proof"
                        className="max-h-48 rounded-xl border border-white/10 object-cover cursor-pointer hover:opacity-90"
                        onClick={() => setImageModal(getMediaUrl(verification.bank_proof))}
                      />
                    </div>
                  )}
                  {verification.pan_card && (
                    <div>
                      <p className="text-sm font-medium text-white/70 mb-1">PAN Card</p>
                      <img
                        src={getMediaUrl(verification.pan_card)}
                        alt="PAN card"
                        className="max-h-48 rounded-xl border border-white/10 object-cover cursor-pointer hover:opacity-90"
                        onClick={() => setImageModal(getMediaUrl(verification.pan_card))}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Update Panel – only show if status is not final */}
              {verification.status !== "approved" && verification.status !== "rejected" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl"
                >
                  <h2 className="text-xl font-bold text-white mb-4">Update Verification</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-violet-300 mb-2">
                        Status
                      </label>
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full bg-gray-900/60 border-2 border-white/20 rounded-2xl px-4 py-3 text-sm font-medium text-white focus:ring-4 focus:ring-violet-500/50 focus:border-violet-400 outline-none transition-all backdrop-blur-sm appearance-none cursor-pointer"
                      >
                        <option value="pending" className="bg-gray-900">⏳ Pending</option>
                        <option value="under_review" className="bg-gray-900">🔍 Under Review</option>
                        <option value="approved" className="bg-gray-900">✅ Approved</option>
                        <option value="rejected" className="bg-gray-900">❌ Rejected</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-violet-300 mb-2">
                        Rejection Reason (optional)
                      </label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="w-full bg-gray-900/60 border-2 border-white/20 rounded-2xl p-4 text-sm min-h-[100px] text-white placeholder-white/40 focus:ring-4 focus:ring-violet-500/50 focus:border-violet-400 outline-none transition-all backdrop-blur-sm resize-y"
                        placeholder="Explain why this verification was rejected..."
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end gap-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => router.push("/admin/verifications")}
                        className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-2xl transition-colors border border-white/20"
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleUpdate}
                        disabled={updating}
                        className="px-6 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white font-bold rounded-2xl shadow-lg shadow-violet-500/25 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
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
                </motion.div>
              )}
            </motion.div>
          )}
        </div>

        {/* Image Modal (dark) */}
        {imageModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setImageModal(null)}
          >
            <div
              className="relative max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl"
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
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}