"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getInternshipApplications,
  updateInternshipApplicationStatus,
  InternshipApplication,
} from "@/services/v2Service";
import AdminLayout from "@/app/admin/AdminLayout";
import toast from "react-hot-toast";

export default function AdminInternshipApplicationsPage() {
  const { id: internshipId } = useParams();
  const [apps, setApps] = useState<InternshipApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApps = async () => {
    setLoading(true);
    try {
      const res = await getInternshipApplications({ internship: Number(internshipId) });
      setApps(res);
    } catch {
      toast.error("Failed to load applications");
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
      toast.success("Status updated");
      fetchApps();
    } catch {
      toast.error("Update failed");
    }
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] p-4 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-cyan-300 mb-8">
            📋 Internship Applications
          </h1>
          {loading ? (
            <p className="text-white/60">Loading...</p>
          ) : (
            <div className="space-y-4">
              {apps.map((app) => (
                <div
                  key={app.id}
                  className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10"
                >
                  <p className="text-white font-semibold">
                    {app.student_name || `Student #${app.student}`}
                  </p>
                  <p className="text-sm text-white/60">
                    Cover Letter: {app.cover_letter?.substring(0, 80)}...
                  </p>
                  <p className="text-xs text-white/50">
                    Applied: {new Date(app.applied_at).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2 mt-4">
                    {["shortlisted", "interview", "selected", "rejected"].map((s) => (
                      <button
                        key={s}
                        onClick={() => updateStatus(app.id, s)}
                        className={`px-2 py-1 rounded-lg text-xs ${
                          app.status === s
                            ? "bg-green-600 text-white"
                            : "bg-white/10 text-white/70 hover:bg-white/20"
                        }`}
                      >
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}