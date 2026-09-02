"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getJobApplications,
  updateJobApplicationStatus,
  type JobApplication,
} from "@/services/v2Service";
import CompanyLayout from "@/app/company/layout";
import AlertService from "@/services/alertService";

export default function CompanyJobApplicationsPage() {
  const { id: jobId } = useParams<{ id: string }>();

  // ---------- State ----------
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // For inline notes when updating status
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [companyNotes, setCompanyNotes] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
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
      AlertService.error("Load Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jobId) fetchApplications();
  }, [jobId]);

  // ---------- Handle Status Update ----------
  const openUpdateModal = (app: JobApplication, newStatus: string) => {
    setUpdatingId(app.id);
    setSelectedStatus(newStatus);
    setCompanyNotes(""); // start fresh
  };

  const handleUpdateStatus = async () => {
    if (!updatingId) return;
    setUpdateLoading(true);
    try {
      await updateJobApplicationStatus(updatingId, selectedStatus, companyNotes);
      AlertService.success("Status Updated", "Status updated successfully");
      setUpdatingId(null);
      fetchApplications(); // refresh
    } catch (err: any) {
      AlertService.error(
        "Update Failed",
        err?.response?.data?.detail || "Update failed"
      );
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
    <CompanyLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] p-4 sm:p-8 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-0 -right-20 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animation-delay-2000" />

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
            <div className="space-y-6">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-lg hover:shadow-violet-500/10 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Applicant Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-white">
                          {app.student_name || `Student #${app.student}`}
                        </h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(app.status)}`}>
                          {app.status.replace("_", " ").toUpperCase()}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-white/70 line-clamp-2">
                        {app.cover_letter || "No cover letter provided."}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-white/50">
                        <span>Applied: {new Date(app.applied_at).toLocaleDateString()}</span>
                        {app.resume_url && (
                          <a
                            href={app.resume_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-violet-400 underline hover:text-violet-300"
                          >
                            📄 View Resume
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Status Update Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {["shortlisted", "interview", "offered", "rejected"].map((status) => (
                        <button
                          key={status}
                          onClick={() => openUpdateModal(app, status)}
                          disabled={app.status === status}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                            app.status === status
                              ? "bg-white/20 text-white cursor-not-allowed"
                              : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                          }`}
                        >
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ---------- Status Update Modal ---------- */}
        {updatingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl border border-white/20 bg-gray-900/90 backdrop-blur-xl p-6 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-2">
                Update Status to{" "}
                <span className="text-violet-300">{selectedStatus.replace("_", " ")}</span>
              </h2>

              <label className="block mt-4 text-sm text-white/70">
                Company Notes{" "}
                <span className="text-white/40">(optional)</span>
              </label>
              <textarea
                value={companyNotes}
                onChange={(e) => setCompanyNotes(e.target.value)}
                rows={3}
                placeholder="Add internal notes..."
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 p-3 text-white placeholder:text-white/30 focus:border-violet-500/50 focus:outline-none resize-none"
              />

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setUpdatingId(null)}
                  disabled={updateLoading}
                  className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateStatus}
                  disabled={updateLoading || !selectedStatus}
                  className="rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-2 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {updateLoading ? "Updating..." : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CompanyLayout>
  );
}