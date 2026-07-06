"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getJob, createJob, updateJob, type Job } from "@/services/v2Service";
import AdminLayout from "@/app/admin/AdminLayout";
import toast from "react-hot-toast";

const emptyJob: Partial<Job> = {
  title: "",
  company: 0,
  description: "",
  responsibilities: "",
  requirements: "",
  skills: [],
  location: "",
  job_type: "full_time",
  experience_level: "fresher",
  salary_min: 0,
  salary_max: 0,
  vacancies: 1,
  application_deadline: "",
  status: "draft",
  is_active: true,
};

export default function AdminJobFormPage() {
  const router = useRouter();
  const { id } = useParams();
  const isNew = id === "new";
  const [form, setForm] = useState<Partial<Job>>(emptyJob);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load existing job
  useEffect(() => {
    if (!isNew) {
      setLoading(true);
      getJob(Number(id))
        .then((job) => {
          // Format application_deadline for date input (take only date part)
          if (job.application_deadline) {
            job.application_deadline = job.application_deadline.split("T")[0];
          }
          setForm(job);
        })
        .catch(() => {
          toast.error("Failed to load job");
          router.push("/admin/jobs");
        })
        .finally(() => setLoading(false));
    }
  }, [id, isNew, router]);

  // Generic input/select/textarea change handler
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "number") {
      // Keep as empty if field is empty, otherwise convert to number
      setForm((prev) => ({
        ...prev,
        [name]: value === "" ? undefined : Number(value),
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Skills are comma separated; filter out empty strings
  const handleSkills = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const skillsArray = raw
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    setForm((prev) => ({ ...prev, skills: skillsArray }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isNew) {
        await createJob(form);
        toast.success("Job created");
      } else {
        await updateJob(Number(id), form);
        toast.success("Job updated");
      }
      router.push("/admin/jobs");
    } catch {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !isNew) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center text-white/60">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-violet-400" />
          <span className="ml-3">Loading job...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] p-4 sm:p-8 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />

        <div className="max-w-3xl mx-auto relative z-10">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300 mb-8">
            {isNew ? "Create New Job" : "Edit Job"}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Job Title *
              </label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Senior React Developer"
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            {/* Company ID */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Company ID *
              </label>
              <input
                name="company"
                type="number"
                value={form.company || ""}
                onChange={handleChange}
                placeholder="Enter company ID"
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={form.description || ""}
                onChange={handleChange}
                placeholder="Describe the role..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            {/* Responsibilities */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Responsibilities
              </label>
              <textarea
                name="responsibilities"
                value={form.responsibilities || ""}
                onChange={handleChange}
                placeholder="List key responsibilities..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            {/* Requirements */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Requirements
              </label>
              <textarea
                name="requirements"
                value={form.requirements || ""}
                onChange={handleChange}
                placeholder="Required qualifications..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Skills (comma separated)
              </label>
              <input
                name="skills"
                value={(form.skills || []).join(", ")}
                onChange={handleSkills}
                placeholder="React, TypeScript, Node.js"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            {/* Grid fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Location
                </label>
                <input
                  name="location"
                  value={form.location || ""}
                  onChange={handleChange}
                  placeholder="City, Country"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              {/* Job Type */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Job Type
                </label>
                <select
                  name="job_type"
                  value={form.job_type}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="remote">Remote</option>
                </select>
              </div>

              {/* Experience Level */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Experience Level
                </label>
                <select
                  name="experience_level"
                  value={form.experience_level}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="fresher">Fresher</option>
                  <option value="0_1">0-1 years</option>
                  <option value="1_3">1-3 years</option>
                  <option value="3_plus">3+ years</option>
                </select>
              </div>

              {/* Salary Min */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Min Salary
                </label>
                <input
                  name="salary_min"
                  type="number"
                  value={form.salary_min ?? ""}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              {/* Salary Max */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Max Salary
                </label>
                <input
                  name="salary_max"
                  type="number"
                  value={form.salary_max ?? ""}
                  onChange={handleChange}
                  placeholder="0"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              {/* Vacancies */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Vacancies
                </label>
                <input
                  name="vacancies"
                  type="number"
                  value={form.vacancies ?? 1}
                  onChange={handleChange}
                  placeholder="1"
                  min="1"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              {/* Application Deadline – use date type, not datetime-local */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Application Deadline
                </label>
                <input
                  name="application_deadline"
                  type="date"
                  value={form.application_deadline || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>

            {/* Status & Active toggle */}
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-white/80">
                  Status
                </label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <label className="flex items-center gap-2 text-white/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active || false}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, is_active: e.target.checked }))
                  }
                  className="accent-violet-400 w-4 h-4"
                />
                <span className="text-sm">Active</span>
              </label>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin h-4 w-4 border-t-2 border-white rounded-full" />
                    Saving...
                  </span>
                ) : (
                  "Save Job"
                )}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}