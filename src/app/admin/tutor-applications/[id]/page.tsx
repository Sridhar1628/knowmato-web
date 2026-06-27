"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  getTutorApplicationDetail,
  approveTutorApplication,
  rejectTutorApplication,
} from "@/services/v1Service";
import AdminLayout from "@/app/admin/AdminLayout";
import { API_HOST } from "@/config/env";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ApplicationDetail {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  city_state: string;
  highest_qualification: string;
  degree: string;
  college_name: string;
  year_of_completion: string;
  skills: string;
  experience: number;
  expertise_level: string;
  organization: string;
  professional_summary: string;
  mentor_subjects: string[];
  mentor_languages: string[];
  resume: string | null;
  status: "pending" | "approved" | "rejected";
}

// ---------------------------------------------------------------------------
// Helper – Info field (dark theme)
// ---------------------------------------------------------------------------
const InfoField = ({ label, value }: { label: string; value: any }) => (
  <div>
    <p className="text-sm font-medium text-white/50">{label}</p>
    <p className="mt-1 text-base font-semibold text-white">
      {value || <span className="italic text-white/30">Not provided</span>}
    </p>
  </div>
);

// ---------------------------------------------------------------------------
// Status badge (dark)
// ---------------------------------------------------------------------------
const statusConfig: Record<string, { label: string; colors: string; emoji: string }> = {
  pending: {
    label: "Pending",
    colors: "bg-amber-400/20 text-amber-300 border-amber-400/40",
    emoji: "🕒",
  },
  approved: {
    label: "Approved",
    colors: "bg-emerald-400/20 text-emerald-300 border-emerald-400/40",
    emoji: "✅",
  },
  rejected: {
    label: "Rejected",
    colors: "bg-rose-400/20 text-rose-300 border-rose-400/40",
    emoji: "❌",
  },
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function TutorApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // ------ fetch detail ------
  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getTutorApplicationDetail(Number(id));
        setApplication(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load application details.");
        toast.error("Failed to load application details.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // ------ approve with confirmation ------
  const handleApprove = () => {
    toast(
      (t) => (
        <div className="flex items-center gap-4">
          <p className="text-sm font-medium">Approve this tutor?</p>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              performApprove();
            }}
            className="rounded-lg bg-emerald-500 px-3 py-1 text-sm text-white"
          >
            Confirm
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="rounded-lg bg-gray-700 px-3 py-1 text-sm text-white"
          >
            Cancel
          </button>
        </div>
      ),
      { duration: Infinity, position: "top-center" }
    );
  };

  const performApprove = async () => {
    try {
      setActionLoading(true);
      await approveTutorApplication(Number(id));
      toast.success("Tutor approved successfully!");
      router.push("/admin/tutor-applications");
    } catch (error) {
      toast.error("Approval failed");
    } finally {
      setActionLoading(false);
    }
  };

  // ------ reject with confirmation ------
  const handleReject = () => {
    toast(
      (t) => (
        <div className="flex items-center gap-4">
          <p className="text-sm font-medium">Reject this application?</p>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              performReject();
            }}
            className="rounded-lg bg-rose-500 px-3 py-1 text-sm text-white"
          >
            Confirm
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="rounded-lg bg-gray-700 px-3 py-1 text-sm text-white"
          >
            Cancel
          </button>
        </div>
      ),
      { duration: Infinity, position: "top-center" }
    );
  };

  const performReject = async () => {
    try {
      setActionLoading(true);
      await rejectTutorApplication(Number(id));
      toast.success("Application rejected.");
      router.push("/admin/tutor-applications");
    } catch (error) {
      toast.error("Rejection failed");
    } finally {
      setActionLoading(false);
    }
  };

  // ------ loading skeleton (dark) ------
  if (loading) {
    return (
      <AdminLayout>
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="animate-pulse space-y-6 max-w-5xl mx-auto">
            <div className="h-32 rounded-3xl bg-white/10" />
            <div className="h-48 rounded-3xl bg-white/10" />
            <div className="h-48 rounded-3xl bg-white/10" />
            <div className="h-32 rounded-3xl bg-white/10" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  // ------ error / not found ------
  if (error || !application) {
    return (
      <AdminLayout>
        <div className="flex min-h-[60vh] items-center justify-center px-4">
          <div className="text-center">
            <span className="text-5xl">😕</span>
            <h2 className="mt-4 text-xl font-bold text-white">
              {error || "Application not found"}
            </h2>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push("/admin/tutor-applications")}
              className="mt-4 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-2 font-bold text-white shadow-lg shadow-violet-500/25"
            >
              Back to Applications
            </motion.button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const resumeUrl = application.resume
    ? `${API_HOST}${application.resume}`
    : null;

  const status = statusConfig[application.status] ?? statusConfig.pending;

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
            onClick={() => router.push("/admin/tutor-applications")}
            className="mb-6 flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-md text-white font-semibold rounded-full border border-white/20 hover:border-white/40 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Applications
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Header card */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 rounded-full blur-2xl" />
              <div className="relative flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300">
                    {application.full_name}
                  </h1>
                  <p className="text-white/70 mt-1">{application.email}</p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-4 py-2 rounded-full text-sm font-bold border ${status.colors}`}
                >
                  {status.emoji} {status.label}
                </span>
              </div>
            </div>

            {/* Personal Information */}
            <section className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="w-1.5 h-6 bg-gradient-to-b from-violet-400 to-fuchsia-400 rounded-full" />
                👤 Personal Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InfoField label="Full Name" value={application.full_name} />
                <InfoField label="Email" value={application.email} />
                <InfoField label="Phone" value={application.phone} />
                <InfoField label="City / State" value={application.city_state} />
              </div>
            </section>

            {/* Education */}
            <section className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="w-1.5 h-6 bg-gradient-to-b from-violet-400 to-fuchsia-400 rounded-full" />
                🎓 Education
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InfoField label="Highest Qualification" value={application.highest_qualification} />
                <InfoField label="Degree" value={application.degree} />
                <InfoField label="College / University" value={application.college_name} />
                <InfoField label="Year of Completion" value={application.year_of_completion} />
              </div>
            </section>

            {/* Professional Experience */}
            <section className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="w-1.5 h-6 bg-gradient-to-b from-violet-400 to-fuchsia-400 rounded-full" />
                💼 Professional Experience
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InfoField label="Skills" value={application.skills} />
                <InfoField label="Experience" value={`${application.experience} Years`} />
                <InfoField label="Expertise Level" value={application.expertise_level} />
                <InfoField label="Organization" value={application.organization} />
              </div>
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-white/80">Professional Summary</h3>
                <p className="mt-2 leading-relaxed text-white/70">
                  {application.professional_summary || (
                    <span className="italic text-white/30">Not provided</span>
                  )}
                </p>
              </div>
            </section>

            {/* Subjects */}
            <section className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="w-1.5 h-6 bg-gradient-to-b from-violet-400 to-fuchsia-400 rounded-full" />
                📘 Subjects
              </h2>
              <div className="flex flex-wrap gap-2">
                {application.mentor_subjects?.length > 0 ? (
                  application.mentor_subjects.map((subject) => (
                    <span
                      key={subject}
                      className="rounded-full bg-violet-500/20 text-violet-300 border border-violet-400/30 px-4 py-2 text-sm font-medium"
                    >
                      {subject}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-white/40 italic">No subjects listed</p>
                )}
              </div>
            </section>

            {/* Languages */}
            <section className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                <span className="w-1.5 h-6 bg-gradient-to-b from-violet-400 to-fuchsia-400 rounded-full" />
                🌐 Languages
              </h2>
              <div className="flex flex-wrap gap-2">
                {application.mentor_languages?.length > 0 ? (
                  application.mentor_languages.map((lang) => (
                    <span
                      key={lang}
                      className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-4 py-2 text-sm font-medium"
                    >
                      {lang}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-white/40 italic">No languages listed</p>
                )}
              </div>
            </section>

            {/* Resume */}
            {resumeUrl && (
              <section className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                  <span className="w-1.5 h-6 bg-gradient-to-b from-violet-400 to-fuchsia-400 rounded-full" />
                  📄 Resume
                </h2>
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-500/20 text-violet-300 border border-violet-400/30 hover:bg-violet-500/30 hover:text-white px-6 py-3 font-semibold transition"
                >
                  <span>View Resume</span>
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </section>
            )}

            {/* Action Buttons – only if pending */}
            {application.status === "pending" && (
              <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 px-6 py-3.5 font-bold text-white shadow-lg disabled:opacity-50 transition"
                >
                  {actionLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="h-5 w-5 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    "Approve Application"
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleReject}
                  disabled={actionLoading}
                  className="flex-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-400/30 hover:bg-rose-500/30 hover:text-white px-6 py-3.5 font-bold shadow-sm disabled:opacity-50 transition"
                >
                  Reject Application
                </motion.button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AdminLayout>
  );
}