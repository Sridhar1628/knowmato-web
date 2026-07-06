"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getJobApplications,
  updateJobApplicationStatus,
  type JobApplication,
} from "@/services/v2Service";
import AdminLayout from "@/app/admin/AdminLayout";
import toast from "react-hot-toast";

export default function AdminJobApplicationsPage() {
  const { id: jobId } = useParams<{ id: string }>();

  // ---------- State ----------
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected application for detail modal
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);

  // Status update within modal
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [companyNotes, setCompanyNotes] = useState("");
  const [statusToSet, setStatusToSet] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);

  // ---------- Fetch Applications ----------
  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getJobApplications({ job: Number(jobId) });
      setApplications(data);
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail || err?.message || "Failed to load applications";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jobId) fetchApplications();
  }, [jobId]);

  // ---------- Open detail modal ----------
  const openDetailModal = (app: JobApplication) => {
    setSelectedApp(app);
    // Reset status form
    setUpdatingStatus(false);
    setCompanyNotes("");
    setStatusToSet("");
  };

  const closeModal = () => {
    setSelectedApp(null);
  };

  // ---------- Handle Status Update ----------
  const startStatusUpdate = (status: string) => {
    setStatusToSet(status);
    setUpdatingStatus(true);
    setCompanyNotes("");
  };

  const cancelStatusUpdate = () => {
    setUpdatingStatus(false);
    setStatusToSet("");
    setCompanyNotes("");
  };

  const handleUpdateStatus = async () => {
    if (!selectedApp || !statusToSet) return;
    setUpdateLoading(true);
    try {
      await updateJobApplicationStatus(selectedApp.id, statusToSet, companyNotes);
      toast.success("Status updated successfully");
      // Update local state to reflect new status
      setApplications((prev) =>
        prev.map((app) =>
          app.id === selectedApp.id
            ? { ...app, status: statusToSet as JobApplication["status"] }
            : app
        )
      );
      // Update selectedApp as well
      setSelectedApp((prev) =>
        prev ? { ...prev, status: statusToSet as JobApplication["status"] } : null
      );
      setUpdatingStatus(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Update failed");
    } finally {
      setUpdateLoading(false);
    }
  };

  // ---------- Helpers ----------
  const getStatusColor = (status: string) => {
    switch (status) {
      case "applied":
        return "bg-blue-500/20 text-blue-300";
      case "shortlisted":
        return "bg-yellow-500/20 text-yellow-300";
      case "interview":
        return "bg-purple-500/20 text-purple-300";
      case "offered":
        return "bg-green-500/20 text-green-300";
      case "rejected":
        return "bg-red-500/20 text-red-300";
      case "withdrawn":
        return "bg-gray-500/20 text-gray-400";
      default:
        return "bg-white/10 text-white/60";
    }
  };

  // ---------- Render ----------
  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] p-4 sm:p-8 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-0 -right-20 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />

        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-cyan-300 mb-8">
            📋 Job Applications
          </h1>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-violet-400" />
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center">
              <p className="text-red-300">{error}</p>
              <button
                onClick={fetchApplications}
                className="mt-4 text-sm text-white/70 underline hover:text-white"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && applications.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-12 text-center text-white/50">
              <p className="text-lg">No applications received yet.</p>
            </div>
          )}

          {/* Applications List */}
          {!loading && !error && applications.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {applications.map((app) => (
                <div
                  key={app.id}
                  onClick={() => openDetailModal(app)}
                  className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-lg hover:shadow-violet-500/10 transition cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-white group-hover:text-violet-300 transition-colors">
                      {app.student_name || `Student #${app.student}`}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(app.status)}`}>
                      {app.status.replace("_", " ").toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-white/70 line-clamp-2 mb-3">
                    {app.cover_letter || "No cover letter provided."}
                  </p>
                  <div className="flex items-center justify-between text-xs text-white/50">
                    <span>Applied: {new Date(app.applied_at).toLocaleDateString()}</span>
                    {app.resume_url && (
                      <span className="text-violet-400 underline group-hover:text-violet-300">
                        Resume attached
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ---------- Detail Modal ---------- */}
        {selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/20 bg-gray-900/90 backdrop-blur-xl p-6 shadow-2xl">
              {/* Close button */}
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 text-white/50 hover:text-white text-xl leading-none"
              >
                ✕
              </button>

              {/* Applicant info */}
              <h2 className="text-2xl font-bold text-white pr-8">
                {selectedApp.student_name || `Student #${selectedApp.student}`}
              </h2>
              <span className={`inline-block mt-2 text-xs px-3 py-1 rounded-full ${getStatusColor(selectedApp.status)}`}>
                {selectedApp.status.replace("_", " ").toUpperCase()}
              </span>

              <p className="mt-2 text-sm text-white/50">
                Applied on {new Date(selectedApp.applied_at).toLocaleDateString()}
              </p>

              {/* Cover Letter */}
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-white/80">Cover Letter</h3>
                <div className="mt-2 p-4 rounded-lg bg-white/5 border border-white/10 text-white/70 whitespace-pre-line text-sm">
                  {selectedApp.cover_letter || "No cover letter provided."}
                </div>
              </div>

              {/* Resume */}
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-white/80">Resume</h3>
                {selectedApp.resume_url ? (
                  <div className="mt-2 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <a
                      href={selectedApp.resume_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-violet-500/20 px-4 py-2 text-sm font-medium text-violet-300 hover:bg-violet-500/30 transition"
                    >
                      <span>📄</span> Open Resume in New Tab
                    </a>
                    <span className="text-xs text-white/40">
                      The resume will open in a new browser tab.
                    </span>
                  </div>
                ) : (
                  <p className="mt-2 text-white/40 text-sm">No resume uploaded.</p>
                )}
              </div>

              {/* Status Update Section (only if not in updating mode) */}
              {!updatingStatus ? (
                <div className="mt-8 border-t border-white/10 pt-6">
                  <h3 className="text-sm font-semibold text-white/80 mb-4">Update Status</h3>
                  <div className="flex flex-wrap gap-2">
                    {["shortlisted", "interview", "offered", "rejected"].map((status) => (
                      <button
                        key={status}
                        onClick={() => startStatusUpdate(status)}
                        disabled={selectedApp.status === status}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          selectedApp.status === status
                            ? "bg-white/20 text-white cursor-not-allowed"
                            : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Status Update Form */
                <div className="mt-8 border-t border-white/10 pt-6">
                  <h3 className="text-sm font-semibold text-white/80 mb-4">
                    Set status to{" "}
                    <span className="text-violet-300">{statusToSet.replace("_", " ")}</span>
                  </h3>

                  <label className="block text-sm text-white/70 mb-1">
                    Company Notes{" "}
                    <span className="text-white/40">(optional)</span>
                  </label>
                  <textarea
                    value={companyNotes}
                    onChange={(e) => setCompanyNotes(e.target.value)}
                    rows={3}
                    placeholder="Add internal notes..."
                    className="w-full rounded-lg border border-white/10 bg-white/5 p-3 text-white placeholder:text-white/30 focus:border-violet-500/50 focus:outline-none resize-none"
                  />

                  <div className="mt-4 flex justify-end gap-3">
                    <button
                      onClick={cancelStatusUpdate}
                      disabled={updateLoading}
                      className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateStatus}
                      disabled={updateLoading}
                      className="rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-2 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                    >
                      {updateLoading ? "Updating..." : "Confirm"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}