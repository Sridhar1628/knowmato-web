"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  getAdminReportDetail,
  updateAdminReport,
} from "@/services/v1Service";
import AdminLayout from "@/app/admin/AdminLayout";
import toast from "react-hot-toast";

// ---------- Types ----------
interface ReportDetail {
  report_id: number;
  student: { id: number; name: string };
  tutor: { id: number; name: string };
  doubt: { id: number; title: string; description: string; category: string };
  session: { id: number; status: string; session_type: string; price: number };
  reason: string;
  description: string;
  status: string;
  admin_notes: string | null;
  reviewed_by: number | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

const reasonLabels: Record<string, string> = {
  rude: "Rude Behaviour",
  late: "Late Arrival",
  poor_explanation: "Poor Explanation",
  wrong_information: "Wrong Information",
  harassment: "Harassment",
  spam: "Spam",
  other: "Other",
};

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    pending: "bg-amber-400/20 text-amber-300 border-amber-400/40",
    under_review: "bg-sky-400/20 text-sky-300 border-sky-400/40",
    resolved: "bg-emerald-400/20 text-emerald-300 border-emerald-400/40",
    rejected: "bg-rose-400/20 text-rose-300 border-rose-400/40",
  };
  return map[status] || "bg-gray-400/20 text-gray-300 border-gray-400/40";
};

// ---------- Skeleton ----------
const DetailSkeleton = () => (
  <div className="animate-pulse space-y-6 p-2">
    <div className="h-10 w-2/3 bg-white/10 rounded-2xl" />
    <div className="grid grid-cols-2 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-24 bg-white/10 rounded-2xl" />
      ))}
    </div>
    <div className="h-40 bg-white/10 rounded-2xl" />
    <div className="h-48 bg-white/10 rounded-2xl" />
  </div>
);

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = Number(params.id);

  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const response = await getAdminReportDetail(reportId);
      const report = response.data;
      setReport(report);
      setSelectedStatus(report.status);
      setAdminNotes(report.admin_notes ?? "");
    } catch (err: any) {
      toast.error("Failed to load report details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (reportId) fetchDetail();
  }, [reportId]);

  const handleUpdate = async () => {
    if (!report) return;
    setUpdating(true);
    try {
      await updateAdminReport(reportId, {
        status: selectedStatus as any,
        admin_notes: adminNotes,
      });
      toast.success("Report updated!");
      setReport((prev) =>
        prev ? { ...prev, status: selectedStatus, admin_notes: adminNotes } : prev
      );
    } catch (err: any) {
      toast.error(err?.message || "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Back button */}
        <motion.button
          whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push("/admin/reports")}
          className="mb-8 flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-md text-white font-semibold rounded-full border border-white/20 hover:border-white/40 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Reports
        </motion.button>

        {loading ? (
          <DetailSkeleton />
        ) : !report ? (
          <div className="text-center py-20 text-white/60 font-medium text-lg">
            Report not found.
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-8 max-w-5xl mx-auto"
          >
            {/* Reason & Status Header */}
            <div className="relative bg-white/5 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 rounded-full blur-2xl" />
              <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300">
                  {reasonLabels[report.reason] || report.reason}
                </h1>
                <span
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border ${statusBadge(
                    report.status
                  )}`}
                >
                  <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                  {(report.status ?? "pending").replaceAll("_", " ")}
                </span>
              </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Reported by", value: report.student.name, gradient: "from-rose-500/20 to-pink-600/20", border: "border-rose-400/30", text: "text-rose-300" },
                { label: "Tutor", value: report.tutor.name, gradient: "from-cyan-500/20 to-blue-600/20", border: "border-cyan-400/30", text: "text-cyan-300" },
                { label: "Session", value: `#${report.session.id}`, gradient: "from-amber-500/20 to-orange-600/20", border: "border-amber-400/30", text: "text-amber-300" },
                { label: "Date", value: new Date(report.created_at).toLocaleString(), gradient: "from-emerald-500/20 to-green-600/20", border: "border-emerald-400/30", text: "text-emerald-300" },
              ].map((card, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className={`bg-gradient-to-br ${card.gradient} backdrop-blur-md rounded-2xl p-5 shadow-lg ${card.border} border`}
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-white/70 mb-1">
                    {card.label}
                  </p>
                  <p className={`text-lg font-bold ${card.text}`}>{card.value}</p>
                </motion.div>
              ))}
            </div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white/5 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl"
            >
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="w-1.5 h-6 bg-gradient-to-b from-violet-400 to-fuchsia-400 rounded-full" />
                Description
              </h2>
              <p className="text-white/80 whitespace-pre-wrap leading-relaxed">
                {report.description}
              </p>
            </motion.div>

            {/* Doubt Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-indigo-500/20 to-violet-600/20 backdrop-blur-md rounded-2xl p-5 border border-indigo-400/30 shadow-lg">
                <p className="text-xs font-bold uppercase text-indigo-300 tracking-wider">
                  Doubt Title
                </p>
                <p className="mt-1 font-bold text-lg text-white">{report.doubt.title}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500/20 to-fuchsia-600/20 backdrop-blur-md rounded-2xl p-5 border border-purple-400/30 shadow-lg">
                <p className="text-xs font-bold uppercase text-purple-300 tracking-wider">
                  Category
                </p>
                <p className="mt-1 font-bold text-lg text-white">{report.doubt.category}</p>
              </div>
            </div>

            {/* Update Panel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-violet-400/30 to-fuchsia-400/30 rounded-full blur-2xl" />
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="w-1.5 h-6 bg-gradient-to-b from-violet-400 to-fuchsia-400 rounded-full" />
                Update Report
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
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
                    <option value="resolved" className="bg-gray-900">✅ Resolved</option>
                    <option value="rejected" className="bg-gray-900">❌ Rejected</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-bold text-violet-300 mb-2">
                    Admin Notes
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full bg-gray-900/60 border-2 border-white/20 rounded-2xl p-4 text-sm min-h-[120px] text-white placeholder-white/40 focus:ring-4 focus:ring-violet-500/50 focus:border-violet-400 outline-none transition-all backdrop-blur-sm resize-y"
                    placeholder="Write your internal notes here..."
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => router.push("/admin/reports")}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-2xl transition-colors border border-white/20"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleUpdate}
                  disabled={updating}
                  className="px-6 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white font-bold rounded-2xl shadow-lg shadow-violet-500/25 hover:shadow-xl disabled:opacity-60 transition-all flex items-center justify-center gap-2"
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
            </motion.div>
          </motion.div>
        )}
      </div>
    </AdminLayout>
  );
}