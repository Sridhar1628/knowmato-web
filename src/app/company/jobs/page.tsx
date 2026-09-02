"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useRouter } from "next/navigation";
import { getJobs, deleteJob, Job } from "@/services/v2Service";
import CompanyLayout from "@/app/company/layout";
import ConfirmModal from "@/components/ConfirmModal";
import AlertService from "@/services/alertService";

export default function CompanyJobsPage() {
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);
  const companyId = user?.company;
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });
  const [deleting, setDeleting] = useState(false);

  const fetchJobs = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const res = await getJobs({ company: companyId });
      setJobs(res);
    } catch {
      AlertService.error("Load Failed", "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJobs(); }, [companyId]);

  const handleDelete = async () => {
    if (!deleteModal.id) return;
    setDeleting(true);
    try {
      await deleteJob(deleteModal.id);
      AlertService.success("Job Deleted", "Job deleted");
      fetchJobs();
    } catch {
      AlertService.error("Delete Failed", "Delete failed");
    } finally {
      setDeleting(false);
      setDeleteModal({ open: false, id: null });
    }
  };

  return (
    <CompanyLayout>
      <div className="relative z-10">
        <div className="flex justify-between mb-8">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-cyan-300">Your Jobs</h1>
          <button onClick={() => router.push("/company/jobs/new")} className="px-4 py-2 bg-white/10 rounded-xl border border-white/20 text-violet-300 hover:bg-white/20 transition">+ New Job</button>
        </div>
        {loading ? <p className="text-white/60">Loading...</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.map(job => (
              <div key={job.id} className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
                <h3 className="text-lg font-semibold text-white">{job.title}</h3>
                <p className="text-sm text-white/60">{job.location} • {job.job_type}</p>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => router.push(`/company/jobs/${job.id}`)} className="px-3 py-1.5 bg-violet-600/80 text-white rounded-lg text-sm">Edit</button>
                  <button onClick={() => router.push(`/company/jobs/${job.id}/applications`)} className="px-3 py-1.5 bg-cyan-600/80 text-white rounded-lg text-sm">Apps</button>
                  <button onClick={() => setDeleteModal({ open: true, id: job.id })} className="px-3 py-1.5 bg-red-600/20 text-red-300 rounded-lg text-sm">Del</button>
                </div>
              </div>
            ))}
          </div>
        )}
        <ConfirmModal open={deleteModal.open} title="Delete Job" message="Are you sure?" onConfirm={handleDelete} onCancel={() => setDeleteModal({ open: false, id: null })} loading={deleting} />
      </div>
    </CompanyLayout>
  );
}