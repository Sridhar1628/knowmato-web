"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  getTutorApplicationDetail,
  approveTutorApplication,
  rejectTutorApplication,
} from "@/services/v1Service";

import {
  API_HOST
} from '@/config/env';

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
// Helper – Info field
// ---------------------------------------------------------------------------
const InfoField = ({ label, value }: { label: string; value: any }) => (
  <div>
    <p className="text-sm font-medium text-gray-500">{label}</p>
    <p className="mt-1 text-base font-semibold text-gray-900">
      {value || <span className="italic text-gray-400">Not provided</span>}
    </p>
  </div>
);

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
            className="rounded-lg bg-gray-200 px-3 py-1 text-sm"
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
            className="rounded-lg bg-gray-200 px-3 py-1 text-sm"
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

  // ------ loading skeleton ------
  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-32 rounded-3xl bg-gray-200" />
          <div className="h-48 rounded-3xl bg-gray-100" />
          <div className="h-48 rounded-3xl bg-gray-100" />
          <div className="h-32 rounded-3xl bg-gray-100" />
        </div>
      </div>
    );
  }

  // ------ error state ------
  if (error || !application) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <span className="text-5xl">😕</span>
          <h2 className="mt-4 text-xl font-bold text-gray-800">
            {error || "Application not found"}
          </h2>
          <button
            onClick={() => router.push("/admin/tutor-applications")}
            className="mt-4 rounded-full bg-indigo-600 px-6 py-2 font-semibold text-white hover:bg-indigo-700"
          >
            Back to Applications
          </button>
        </div>
      </div>
    );
  }

  // ------ helper for resume link ------
  const resumeUrl = application.resume
    ? `${API_HOST}${application.resume}`
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back button & Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <button
            onClick={() => router.push("/admin/tutor-applications")}
            className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/30"
          >
            ← Back to Applications
          </button>
          <h1 className="text-3xl font-extrabold text-white sm:text-4xl">
            {application.full_name}
          </h1>
          <div className="mt-2 flex items-center gap-3">
            <span
              className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${
                application.status === "approved"
                  ? "bg-emerald-100 text-emerald-700"
                  : application.status === "rejected"
                  ? "bg-rose-100 text-rose-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {application.status.charAt(0).toUpperCase() +
                application.status.slice(1)}
            </span>
            <span className="text-sm text-indigo-100">{application.email}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Personal Information */}
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200/50">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-gray-900">
              <span className="text-2xl">👤</span> Personal Information
            </h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <InfoField label="Full Name" value={application.full_name} />
              <InfoField label="Email" value={application.email} />
              <InfoField label="Phone" value={application.phone} />
              <InfoField label="City / State" value={application.city_state} />
            </div>
          </section>

          {/* Education */}
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200/50">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-gray-900">
              <span className="text-2xl">🎓</span> Education
            </h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <InfoField
                label="Highest Qualification"
                value={application.highest_qualification}
              />
              <InfoField label="Degree" value={application.degree} />
              <InfoField label="College / University" value={application.college_name} />
              <InfoField
                label="Year of Completion"
                value={application.year_of_completion}
              />
            </div>
          </section>

          {/* Professional Experience */}
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200/50">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-gray-900">
              <span className="text-2xl">💼</span> Professional Experience
            </h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <InfoField label="Skills" value={application.skills} />
              <InfoField
                label="Experience"
                value={`${application.experience} Years`}
              />
              <InfoField label="Expertise Level" value={application.expertise_level} />
              <InfoField label="Organization" value={application.organization} />
            </div>
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-800">
                Professional Summary
              </h3>
              <p className="mt-2 leading-relaxed text-gray-600">
                {application.professional_summary || (
                  <span className="italic text-gray-400">Not provided</span>
                )}
              </p>
            </div>
          </section>

          {/* Subjects */}
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200/50">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900">
              <span className="text-2xl">📘</span> Subjects
            </h2>
            <div className="flex flex-wrap gap-2">
              {application.mentor_subjects?.length > 0 ? (
                application.mentor_subjects.map((subject) => (
                  <span
                    key={subject}
                    className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 ring-1 ring-indigo-200"
                  >
                    {subject}
                  </span>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic">No subjects listed</p>
              )}
            </div>
          </section>

          {/* Languages */}
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200/50">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900">
              <span className="text-2xl">🌐</span> Languages
            </h2>
            <div className="flex flex-wrap gap-2">
              {application.mentor_languages?.length > 0 ? (
                application.mentor_languages.map((lang) => (
                  <span
                    key={lang}
                    className="rounded-full bg-green-50 px-4 py-2 text-sm font-medium text-green-700 ring-1 ring-green-200"
                  >
                    {lang}
                  </span>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic">No languages listed</p>
              )}
            </div>
          </section>

          {/* Resume */}
          {resumeUrl && (
            <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200/50">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900">
                <span className="text-2xl">📄</span> Resume
              </h2>
              <a
                href={resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow transition hover:bg-blue-700"
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

          {/* Action Buttons */}
          {application.status === "pending" && (
            <div className="flex flex-col gap-3 pt-4 sm:flex-row">
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="flex-1 rounded-xl bg-emerald-500 px-6 py-3.5 font-bold text-white shadow-md transition hover:bg-emerald-600 disabled:opacity-50"
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
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="flex-1 rounded-xl border border-rose-200 bg-white px-6 py-3.5 font-bold text-rose-600 shadow-sm transition hover:bg-rose-50 disabled:opacity-50"
              >
                Reject Application
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}