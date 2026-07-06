"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getJobs, deleteJob, Job } from "@/services/v2Service";
import AdminLayout from "@/app/admin/AdminLayout";
import ConfirmModal from "@/components/ConfirmModal";
import toast from "react-hot-toast";

export default function AdminJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ location: "", job_type: "" });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });
  const [deleting, setDeleting] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filters.location) params.location = filters.location;
      if (filters.job_type) params.job_type = filters.job_type;
      const res = await getJobs(params);
      setJobs(res);
    } catch {
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  const handleDelete = async () => {
    if (!deleteModal.id) return;
    setDeleting(true);
    try {
      await deleteJob(deleteModal.id);
      toast.success("Job deleted");
      fetchJobs();
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleting(false);
      setDeleteModal({ open: false, id: null });
    }
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden p-4 sm:p-8">
        <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row justify-between mb-8">
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-cyan-300">💼 All Jobs</h1>
            <button onClick={() => router.push("/admin/jobs/new")} className="mt-4 sm:mt-0 px-4 py-2 bg-white/10 rounded-xl border border-white/20 text-violet-300 hover:bg-white/20 transition">
              + New Job
            </button>
          </div>

          <div className="flex gap-4 mb-6 flex-wrap">
            <input placeholder="Location" value={filters.location} onChange={(e) => setFilters(f => ({ ...f, location: e.target.value }))} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white" />
            <select value={filters.job_type} onChange={(e) => setFilters(f => ({ ...f, job_type: e.target.value }))} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white">
              <option value="">All Types</option>
              <option value="full_time">Full Time</option>
              <option value="part_time">Part Time</option>
              <option value="contract">Contract</option>
              <option value="remote">Remote</option>
            </select>
          </div>

          {loading ? <div className="text-center text-white/60 py-20">Loading...</div> : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {jobs.map(job => (
                <motion.div key={job.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
                  <h3 className="text-lg font-semibold text-white">{job.title}</h3>
                  <p className="text-sm text-white/60">{job.company_name} • {job.location} • {job.job_type}</p>
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => router.push(`/admin/jobs/${job.id}`)} className="px-3 py-1.5 bg-violet-600/80 text-white rounded-lg text-sm">Edit</button>
                    <button onClick={() => router.push(`/admin/jobs/${job.id}/applications`)} className="px-3 py-1.5 bg-cyan-600/80 text-white rounded-lg text-sm">Apps</button>
                    <button onClick={() => setDeleteModal({ open: true, id: job.id })} className="px-3 py-1.5 bg-red-600/20 text-red-300 rounded-lg text-sm">Del</button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          <ConfirmModal open={deleteModal.open} title="Delete Job" message="Are you sure?" onConfirm={handleDelete} onCancel={() => setDeleteModal({ open: false, id: null })} loading={deleting} />
        </div>
      </div>
    </AdminLayout>
  );
}