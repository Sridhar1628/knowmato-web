"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import AdminLayout from "@/app/admin/AdminLayout";
import {
  getAdminCompanyApplication,
  approveCompanyApplication,
  rejectCompanyApplication,
} from "@/services/v2Service";
import AlertService from "@/services/alertService";
import { API_HOST } from "@/config/env";

// --------------------------------------------------
// Types (from your service interface)
// --------------------------------------------------

interface AdminCompanyApplication {
  id: number;
  company_name: string;
  industry: string | null;
  website: string | null;
  email: string;
  phone: string;
  hr_name: string | null;
  hr_email: string | null;
  hr_phone: string | null;
  address: string;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  company_description: string | null;
  logo: string | null;
  registration_number: string | null;
  gst_number: string | null;
  pan_number: string | null;
  linkedin_url: string | null;
  employee_count: number | null;
  founded_year: number | null;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  approved_at: string | null;
  reviewed_by: number | null;
  reviewed_by_name: string | null;
  created_at: string;
  updated_at: string;
}

// --------------------------------------------------
// Helper
// --------------------------------------------------

const StatusBadge = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/50",
    approved: "bg-emerald-500/20 text-emerald-300 border-emerald-500/50",
    rejected: "bg-red-500/20 text-red-300 border-red-500/50",
  };
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-sm font-semibold border ${colors[status] || "bg-gray-500/20 text-gray-300 border-gray-500/50"}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// --------------------------------------------------
// Detail Page Component
// --------------------------------------------------

export default function AdminCompanyApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = Number(params.id);

  const [application, setApplication] = useState<AdminCompanyApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Rejection modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await getAdminCompanyApplication(applicationId);
        setApplication(res.data);
      } catch (error) {
        console.error(error);
        AlertService.error("Load Failed", "Failed to load application detail");
        router.push("/admin/company-applications");
      } finally {
        setLoading(false);
      }
    };
    if (applicationId) fetchDetail();
  }, [applicationId, router]);

  const handleApprove = async () => {
    if (!application) return;
    try {
      setProcessing(true);
      const res = await approveCompanyApplication(application.id);
      AlertService.success("Application Approved", res.message);
      // Refresh detail
      const updated = await getAdminCompanyApplication(application.id);
      setApplication(updated.data);
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Approval failed";
      AlertService.error("Approval Failed", msg);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!application || !rejectionReason.trim()) {
      AlertService.error("Rejection Reason Required", "Please provide a rejection reason");
      return;
    }
    try {
      setProcessing(true);
      const res = await rejectCompanyApplication(application.id, rejectionReason.trim());
      AlertService.success("Application Rejected", res.message);
      setShowRejectModal(false);
      setRejectionReason("");
      const updated = await getAdminCompanyApplication(application.id);
      setApplication(updated.data);
    } catch (error: any) {
      const msg = error?.response?.data?.message || "Rejection failed";
      AlertService.error("Rejection Failed", msg);
    } finally {
      setProcessing(false);
    }
  };

  // --------------------------------------------------
  // Loading state
  // --------------------------------------------------
  if (loading) {
    return (
      <AdminLayout>
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
        </div>
      </AdminLayout>
    );
  }

  if (!application) return null; // will redirect in catch

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden">
        {/* Animated blobs */}
        <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

        <div className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
          {/* Back button */}
          <button
            onClick={() => router.push("/admin/company-applications")}
            className="mb-6 flex items-center gap-2 text-white/60 hover:text-white transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to list
          </button>

          {/* Header with action buttons */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
          >
            <div>
              <h1 className="text-3xl font-extrabold text-white">{application.company_name}</h1>
              <p className="text-white/60 mt-1">Application #{application.id}</p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={application.status} />
              {application.status === "pending" && (
                <>
                  <button
                    onClick={handleApprove}
                    disabled={processing}
                    className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-2.5 font-semibold text-white shadow-lg hover:from-emerald-600 hover:to-teal-600 transition disabled:opacity-50"
                  >
                    {processing ? "Processing..." : "Approve"}
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={processing}
                    className="rounded-xl bg-gradient-to-r from-red-500 to-pink-500 px-6 py-2.5 font-semibold text-white shadow-lg hover:from-red-600 hover:to-pink-600 transition disabled:opacity-50"
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          </motion.div>

          {/* Company Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 sm:p-8 shadow-2xl mb-6"
          >
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300 mb-6">
              📋 Company Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoField label="Company Name" value={application.company_name} />
              <InfoField label="Industry" value={application.industry || "—"} />
              <InfoField label="Website" value={application.website || "—"} isLink />
              <InfoField label="LinkedIn" value={application.linkedin_url || "—"} isLink />
              <InfoField label="Founded Year" value={application.founded_year?.toString() || "—"} />
              <InfoField label="Employee Count" value={application.employee_count?.toString() || "—"} />
              <div className="md:col-span-2">
                <InfoField label="Description" value={application.company_description || "—"} />
              </div>
            </div>
          </motion.div>

          {/* Contact Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 sm:p-8 shadow-2xl mb-6"
          >
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300 mb-6">
              📞 Contact Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoField label="Email" value={application.email} />
              <InfoField label="Phone" value={application.phone} />
              <InfoField label="HR Name" value={application.hr_name || "—"} />
              <InfoField label="HR Email" value={application.hr_email || "—"} />
              <InfoField label="HR Phone" value={application.hr_phone || "—"} />
            </div>
          </motion.div>

          {/* Address Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 sm:p-8 shadow-2xl mb-6"
          >
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300 mb-6">
              📍 Office Address
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoField label="Address" value={application.address} />
              <InfoField label="City" value={application.city || "—"} />
              <InfoField label="State" value={application.state || "—"} />
              <InfoField label="Country" value={application.country || "—"} />
              <InfoField label="Postal Code" value={application.postal_code || "—"} />
            </div>
          </motion.div>

          {/* Legal Documents Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 sm:p-8 shadow-2xl mb-6"
          >
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300 mb-6">
              📑 Legal & Documents
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InfoField label="Registration Number" value={application.registration_number || "—"} />
              <InfoField label="GST Number" value={application.gst_number || "—"} />
              <InfoField label="PAN Number" value={application.pan_number || "—"} />
            </div>
            <div className="mt-4">
                {application.logo ? (
                    <a
                    href={
                        application.logo.startsWith("http")
                        ? application.logo
                        : `${API_HOST}${application.logo}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-400 hover:underline"
                    >
                    View Logo →
                    </a>
                ) : (
                    <p className="text-white/40">No logo uploaded</p>
                )}
                </div>
          </motion.div>

          {/* Review Info */}
          {application.status !== "pending" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 sm:p-8 shadow-2xl"
            >
              <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300 mb-6">
                📝 Review Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoField label="Reviewed By" value={application.reviewed_by_name || "Unknown"} />
                <InfoField
                  label="Approved / Rejected At"
                  value={application.approved_at ? new Date(application.approved_at).toLocaleString() : "—"}
                />
                {application.status === "rejected" && (
                  <div className="md:col-span-2">
                    <label className="block text-sm text-white/50 mb-1">Rejection Reason</label>
                    <p className="text-white/80 bg-red-500/10 rounded-xl p-4 border border-red-500/30">
                      {application.rejection_reason || "No reason provided"}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md mx-4 rounded-2xl bg-gray-900 border border-white/10 p-6 shadow-2xl"
            >
              <h2 className="text-xl font-bold text-white mb-4">Reject Application</h2>
              <textarea
                rows={4}
                className="w-full rounded-xl border-2 border-white/20 bg-gray-900/60 px-4 py-3 text-white placeholder:text-white/40 focus:border-red-400 focus:ring-4 focus:ring-red-500/50 outline-none transition"
                placeholder="Enter reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={processing}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold hover:from-red-600 hover:to-pink-600 transition disabled:opacity-50"
                >
                  {processing ? "Processing..." : "Confirm Reject"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

// --------------------------------------------------
// Reusable Info Field Component
// --------------------------------------------------

function InfoField({
  label,
  value,
  isLink = false,
}: {
  label: string;
  value: string;
  isLink?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-white/50 mb-1">{label}</label>
      {isLink && value.startsWith("http") ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-violet-400 hover:underline break-all"
        >
          {value}
        </a>
      ) : (
        <p className="text-white/90 break-words">{value}</p>
      )}
    </div>
  );
}