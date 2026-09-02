 "use client";

import { useEffect, useState } from "react";

import { useParams } from "next/navigation";

import {
  getInternshipApplications,
  updateInternshipApplicationStatus,
  InternshipApplication,
} from "@/services/v2Service";
import CompanyLayout from "@/app/company/layout";
import AlertService from "@/services/alertService";
import AdminLayout from "../../AdminLayout";

export default function CompanyInternshipApplicationsPage() {
  const { id: internshipId } = useParams();
  const [apps, setApps] = useState<InternshipApplication[]>([]);
  const [loading, setLoading] = useState(true);

  // Detail modal state
  const [selectedApp, setSelectedApp] = useState<InternshipApplication | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchApps = async () => {
    setLoading(true);
    try {
      const res = await getInternshipApplications({ internship: Number(internshipId) });
      setApps(res);
    } catch {
      AlertService.error("Load Failed", "Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, [internshipId]);

  const updateStatus = async (appId: number, status: string) => {
    try {
      await updateInternshipApplicationStatus(appId, status);
      AlertService.success("Status Updated", `Status updated to ${status}`);

      // Refresh applications and update selected app if modal is open
      const updatedApps = await getInternshipApplications({ internship: Number(internshipId) });
      setApps(updatedApps);

      if (selectedApp && selectedApp.id === appId) {
        const updated = updatedApps.find(a => a.id === appId);
        if (updated) setSelectedApp(updated);
      }
    } catch {
      AlertService.error("Update Failed", "Update failed");
    }
  };

  const openModal = (app: InternshipApplication) => {
    setSelectedApp(app);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedApp(null);
  };

  return (
    <AdminLayout>
      <div className="relative z-10">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-cyan-300 mb-8">
          Internship Applications
        </h1>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="h-4 w-2/3 rounded bg-white/10 mb-3" />
                <div className="h-3 w-full rounded bg-white/10 mb-2" />
                <div className="h-3 w-1/2 rounded bg-white/10" />
              </div>
            ))}
          </div>
        ) : apps.length === 0 ? (
          <div className="text-center py-12 text-white/50">No applications found</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {apps.map((app) => (
              <div
                key={app.id}
                onClick={() => openModal(app)}
                className="cursor-pointer rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 transition hover:border-violet-500/30 hover:bg-white/10"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-white">
                    {app.student_name || `Student #${app.student}`}
                  </p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                      app.status === "selected"
                        ? "bg-green-500/20 text-green-300"
                        : app.status === "rejected"
                        ? "bg-red-500/20 text-red-300"
                        : app.status === "shortlisted"
                        ? "bg-blue-500/20 text-blue-300"
                        : app.status === "interview"
                        ? "bg-yellow-500/20 text-yellow-300"
                        : "bg-white/10 text-white/60"
                    }`}
                  >
                    {app.status}
                  </span>
                </div>

                <p className="text-sm text-white/60 line-clamp-2 mb-3">
                  {app.cover_letter || "No cover letter provided"}
                </p>

                <div className="flex items-center justify-between text-xs text-white/40">
                  <span>
                    Applied: {new Date(app.applied_at).toLocaleDateString()}
                  </span>
                  {app.resume_url ? (
                    <span className="text-violet-400 underline">Resume ↗</span>
                  ) : (
                    <span className="text-white/30">No resume</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {modalOpen && selectedApp && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={closeModal}
        >
          <div
            className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/20 bg-gray-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-white/60 hover:text-white text-2xl"
            >
              ✕
            </button>

            {/* Student info */}
            <h2 className="text-2xl font-bold text-white">
              {selectedApp.student_name || `Student #${selectedApp.student}`}
            </h2>

            <div className="flex items-center gap-3 mt-2">
              <span
                className={`text-xs px-3 py-1 rounded-full capitalize font-medium ${
                  selectedApp.status === "selected"
                    ? "bg-green-500/20 text-green-300"
                    : selectedApp.status === "rejected"
                    ? "bg-red-500/20 text-red-300"
                    : selectedApp.status === "shortlisted"
                    ? "bg-blue-500/20 text-blue-300"
                    : selectedApp.status === "interview"
                    ? "bg-yellow-500/20 text-yellow-300"
                    : "bg-white/10 text-white/60"
                }`}
              >
                {selectedApp.status}
              </span>

              <span className="text-xs text-white/40">
                Applied {new Date(selectedApp.applied_at).toLocaleDateString()}
              </span>
            </div>

            {/* Cover Letter */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-white/80 mb-2">Cover Letter</h3>
              <div className="bg-white/5 rounded-xl p-4 text-white/80 whitespace-pre-line">
                {selectedApp.cover_letter || "No cover letter provided."}
              </div>
            </div>

            {/* Resume */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-white/80 mb-2">Resume</h3>
              {selectedApp.resume_url ? (
                <div className="space-y-3">
                  <a
                    href={selectedApp.resume_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-violet-400 underline hover:text-violet-300"
                  >
                    📄 Open Resume in New Tab
                  </a>

                  {/* PDF Preview using iframe (works best for public PDFs) */}
                  {selectedApp.resume_url.match(/\.pdf$/i) ? (
                    <div className="w-full h-96 rounded-xl overflow-hidden border border-white/10">
                      <iframe
                        src={`https://docs.google.com/gview?url=${encodeURIComponent(
                          selectedApp.resume_url
                        )}&embedded=true`}
                        className="w-full h-full"
                        title="Resume Preview"
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-white/50">
                      (Preview not available for this file type. Click the link above to view.)
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-white/30">No resume uploaded</p>
              )}
            </div>

            {/* Status update buttons */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <h3 className="text-lg font-semibold text-white/80 mb-3">Update Status</h3>
              <div className="flex flex-wrap gap-2">
                {["shortlisted", "interview", "selected", "rejected"].map((status) => (
                  <button
                    key={status}
                    onClick={() => updateStatus(selectedApp.id, status)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      selectedApp.status === status
                        ? "bg-green-600 text-white shadow-lg shadow-green-600/20"
                        : "bg-white/10 text-white/70 hover:bg-white/20"
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}