"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import AdminLayout from "@/app/admin/AdminLayout";
import toast from "react-hot-toast";
import {
  getAssignments,
  Assignment,
  updateAssignmentExpiry,
} from "@/services/assessmentService";

export default function EditAssignmentPage() {
  const router = useRouter();
  const params = useParams();
  const assignmentId = Number(params.id);

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    date_of_expiry: "",
    time: "",
    status: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // ─── Fetch assignment data ──────────────────────────
  useEffect(() => {
    if (!assignmentId) return;

    const fetchAssignment = async () => {
      try {
        const all = await getAssignments();
        const found = all.find((a) => a.id === assignmentId);
        if (!found) {
          toast.error("Assignment not found");
          router.push("/admin/assessment/assignments");
          return;
        }
        setAssignment(found);
        // pre‑fill form
        setFormData({
          date_of_expiry: found.date_of_expiry || "",
          time: found.time || "",
          status: found.status || "",
        });
      } catch (err) {
        toast.error("Failed to load assignment");
      } finally {
        setLoading(false);
      }
    };

    fetchAssignment();
  }, [assignmentId, router]);

  // ─── Form change handler ───────────────────────────
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ─── Submit updated data ──────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date_of_expiry) {
      toast.error("Expiry date is required");
      return;
    }

    setSubmitting(true);
    try {
      await updateAssignmentExpiry(assignmentId, formData);
      toast.success("Assignment updated!");
      router.push("/admin/assessment/assignments");
    } catch (err: any) {
      toast.error(err?.message || "Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Loading skeleton ─────────────────────────────
  if (loading) {
    return (
      <AdminLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
            <p className="mt-4 text-white/60">Loading assignment...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!assignment) return null; // redirected

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

        <div className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
          {/* Page header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button
              onClick={() => router.push("/admin/assessment/assignments")}
              className="mb-4 flex items-center gap-1 text-sm font-semibold text-violet-300 hover:text-violet-200"
            >
              ← Back to Assignments
            </button>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 mb-2">
              ✏️ Edit Assignment #{assignment.id}
            </h1>
            <p className="text-white/70 mb-8">
              Update expiry date, time, or status.
            </p>
          </motion.div>

          {/* Edit form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onSubmit={handleSubmit}
            className="space-y-6 bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl"
          >
            {/* Batch (read‑only) */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Batch
              </label>
              <input
                type="text"
                value={assignment.batch}
                disabled
                className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white/60 cursor-not-allowed"
              />
            </div>

            {/* Total Score (read‑only) */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Total Score
              </label>
              <input
                type="text"
                value={assignment.total_score || "N/A"}
                disabled
                className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white/60 cursor-not-allowed"
              />
            </div>

            {/* Date of Expiry */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Date of Expiry <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                name="date_of_expiry"
                value={formData.date_of_expiry}
                onChange={handleChange}
                required
                className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/50 transition"
              />
            </div>

            {/* Time */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Time
              </label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/50 transition"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/50 transition"
              >
                <option value="">Select status</option>
                <option value="Active">Active</option>
                <option value="Expired">Expired</option>
              </select>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold rounded-xl shadow-lg shadow-violet-500/25 hover:from-violet-700 hover:to-fuchsia-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Updating...
                </>
              ) : (
                "Update Assignment"
              )}
            </button>
          </motion.form>
        </div>
      </div>
    </AdminLayout>
  );
}