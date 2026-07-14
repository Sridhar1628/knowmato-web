"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import AdminLayout from "@/app/admin/AdminLayout";
import toast from "react-hot-toast";
import {
  getAssignments,
  Assignment,
  getAssignmentDetails,
  AssignmentDetails,
} from "@/services/assessmentService";

export default function AdminAssignmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const assignmentId = Number(params.id);

  // ─── state ──────────────────────────────────────────
  const [assignmentMeta, setAssignmentMeta] = useState<Assignment | null>(null);
  const [assignmentDetails, setAssignmentDetails] = useState<AssignmentDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // ─── fetch all needed data ─────────────────────────
  useEffect(() => {
    if (!assignmentId) return;

    const fetchData = async () => {
      try {
        // fetch metadata (batch, status, expiry, etc.)
        const all = await getAssignments();
        const found = all.find((a) => a.id === assignmentId);
        if (!found) {
          toast.error("Assignment not found");
          router.push("/admin/assessment/assignments");
          return;
        }
        setAssignmentMeta(found);

        // fetch questions & MCQs
        const details = await getAssignmentDetails(assignmentId);
        setAssignmentDetails(details);
      } catch (err) {
        toast.error("Failed to load assignment details");
        router.push("/admin/assessment/assignments");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [assignmentId, router]);

  // ─── loading skeleton ──────────────────────────────
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

  if (!assignmentMeta || !assignmentDetails) return null; // already redirected

  const isExpired =
    assignmentMeta.status?.toLowerCase() === "expired" ||
    new Date(assignmentMeta.date_of_expiry) < new Date();

  // ─── main render ──────────────────────────────────
  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

        <div className="relative z-10 p-4 sm:p-6 lg:p-8">
          {/* Page header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <button
              onClick={() => router.push("/admin/assessment/assignments")}
              className="mb-4 flex items-center gap-1 text-sm font-semibold text-violet-300 hover:text-violet-200"
            >
              ← Back to Assignments
            </button>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 mb-2">
              📄 Assignment #{assignmentMeta.id}
            </h1>
            <p className="text-white/70">View details and manage questions.</p>
          </motion.div>

          {/* Metadata card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl mb-8"
          >
            <h2 className="font-semibold text-white/80 mb-4">📋 Assignment Info</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-white/50">Batch:</span>
                <p className="text-white font-medium">{assignmentMeta.batch}</p>
              </div>
              <div>
                <span className="text-white/50">Total Score:</span>
                <p className="text-white font-medium">{assignmentMeta.total_score || "N/A"}</p>
              </div>
              <div>
                <span className="text-white/50">Expiry:</span>
                <p className="text-white font-medium">
                  {new Date(assignmentMeta.date_of_expiry).toLocaleDateString()}
                  {assignmentMeta.time && ` at ${assignmentMeta.time}`}
                </p>
              </div>
              <div>
                <span className="text-white/50">Status:</span>
                <p>
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
                      isExpired
                        ? "bg-red-400/20 text-red-300 border border-red-400/30"
                        : "bg-emerald-400/20 text-emerald-300 border border-emerald-400/30"
                    }`}
                  >
                    {isExpired ? "Expired" : "Active"}
                  </span>
                </p>
              </div>
            </div>
            {/* Quick actions */}
            <div className="mt-4 flex gap-2">
              <button
                onClick={() =>
                  router.push(`/admin/assessment/assignments/${assignmentId}/edit`)
                }
                className="rounded-lg bg-fuchsia-500/20 px-3 py-1.5 text-xs font-bold text-fuchsia-300 border border-fuchsia-400/30 hover:bg-fuchsia-500/30 transition"
              >
                Edit Expiry
              </button>
              <button
                onClick={() =>
                  router.push(`/admin/assessment/questions/create?assignment=${assignmentId}`)
                }
                className="rounded-lg bg-violet-500/20 px-3 py-1.5 text-xs font-bold text-violet-300 border border-violet-400/30 hover:bg-violet-500/30 transition"
              >
                Add Programming Question
              </button>
              <button
                onClick={() =>
                  router.push(`/admin/assessment/mcq/create?assignment=${assignmentId}`)
                }
                className="rounded-lg bg-cyan-500/20 px-3 py-1.5 text-xs font-bold text-cyan-300 border border-cyan-400/30 hover:bg-cyan-500/30 transition"
              >
                Add MCQ
              </button>
            </div>
          </motion.div>

          {/* Programming questions section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl mb-8"
          >
            <h2 className="font-semibold text-white/80 mb-4">
              💻 Programming Questions ({assignmentDetails.questions.length})
            </h2>
            {assignmentDetails.questions.length === 0 ? (
              <p className="text-white/50 text-sm">No programming questions yet.</p>
            ) : (
              <div className="space-y-3">
                {assignmentDetails.questions.map((q) => (
                  <div
                    key={q.id}
                    className="flex items-center justify-between bg-white/5 rounded-xl p-4 border border-white/10"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{q.question}</p>
                      <p className="text-xs text-white/50 mt-1">
                        Level: {q.level} | Status: {q.status || "N/A"}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        router.push(`/admin/assessment/questions/${q.id}/edit`)
                      }
                      className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white/80 hover:bg-white/20 transition"
                    >
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* MCQ section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl"
          >
            <h2 className="font-semibold text-white/80 mb-4">
              📝 MCQs ({assignmentDetails.mcqs.length})
            </h2>
            {assignmentDetails.mcqs.length === 0 ? (
              <p className="text-white/50 text-sm">No MCQs yet.</p>
            ) : (
              <div className="space-y-3">
                {assignmentDetails.mcqs.map((mcq) => (
                  <div
                    key={mcq.id}
                    className="flex items-center justify-between bg-white/5 rounded-xl p-4 border border-white/10"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{mcq.question}</p>
                      <p className="text-xs text-white/50 mt-1">
                        Type: {mcq.list} | Subtype: {mcq.subtype || "—"} | Correct:{" "}
                        {mcq.correct_answer}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        router.push(`/admin/assessment/mcq/${mcq.id}/edit`)
                      }
                      className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white/80 hover:bg-white/20 transition"
                    >
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
}