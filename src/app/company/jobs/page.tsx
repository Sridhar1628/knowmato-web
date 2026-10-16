"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getJobs,
  deleteJob,
  type Job,
} from "@/services/v2Service";
import ConfirmModal from "@/components/ConfirmModal";
import AlertService from "@/services/alertService";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function toArray<T>(res: any): T[] {
  if (Array.isArray(res)) return res;
  if (!res) return [];
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.results)) return res.results;
  if (Array.isArray(res.data?.results)) return res.data.results;
  if (Array.isArray(res.data?.data)) return res.data.data;
  if (Array.isArray(res.items)) return res.items;
  return [];
}

export default function CompanyJobsPage() {
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    id: number | null;
    title?: string;
  }>({
    open: false,
    id: null,
  });

  const [deleting, setDeleting] = useState(false);

  /* ------------------------------ Fetch ---------------------------------- */
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Company users are already scoped to their own company by the
      // backend JobViewSet. Do not depend on a separate company-profile
      // request or send a client-controlled company id here.
      console.log("GET /api/v2/jobs/");

      const res = await getJobs();
      console.log("COMPANY JOBS API RESPONSE:", res);

      setJobs(toArray<Job>(res));
    } catch (err: any) {
      console.error("COMPANY JOBS LOAD ERROR:", err);

      const responseData = err?.response?.data;
      const detail =
        responseData?.detail ||
        responseData?.message ||
        responseData?.error ||
        (typeof responseData === "string" ? responseData : null) ||
        err?.message ||
        "Failed to load jobs";

      setJobs([]);
      setError(detail);
      AlertService.error("Load Failed", detail);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchJobs();
  }, [fetchJobs]);

  /* ------------------------------ Delete --------------------------------- */
  const handleDelete = async () => {
    if (deleteModal.id === null) return;

    setDeleting(true);

    try {
      await deleteJob(deleteModal.id);

      AlertService.success("Job Deleted", "The job has been deleted.");

      // Optimistic local removal — no refetch
      setJobs((prev) =>
        (Array.isArray(prev) ? prev : []).filter(
          (job) => job.id !== deleteModal.id
        )
      );
    } catch (err: any) {
      console.error("DELETE JOB ERROR:", err);

      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Delete failed";

      AlertService.error("Delete Failed", detail);
    } finally {
      setDeleting(false);
      setDeleteModal({ open: false, id: null });
    }
  };

  /* ------------------------------ Derived -------------------------------- */
  const safeJobs = useMemo(() => (Array.isArray(jobs) ? jobs : []), [jobs]);

  const filteredJobs = useMemo(() => {
    const q = search.trim().toLowerCase();

    return safeJobs.filter((job) => {
      const matchesSearch = q
        ? (job.title || "").toLowerCase().includes(q) ||
          (job.location || "").toLowerCase().includes(q)
        : true;

      const matchesType = typeFilter ? job.job_type === typeFilter : true;
      const matchesStatus = statusFilter ? job.status === statusFilter : true;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [safeJobs, search, typeFilter, statusFilter]);

  const counts = useMemo(() => {
    const total = safeJobs.length;
    const published = safeJobs.filter((j) => j.status === "published").length;
    const draft = safeJobs.filter((j) => j.status === "draft").length;
    const closed = safeJobs.filter((j) => j.status === "closed").length;
    const active = safeJobs.filter(
      (j) => j.status === "published" && j.is_active
    ).length;
    return { total, published, draft, closed, active };
  }, [safeJobs]);

  /* ------------------------------ Helpers -------------------------------- */
  const formatDeadline = (dateString?: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatSalary = (
    min?: number | string | null,
    max?: number | string | null
  ) => {
    const minNum = min !== null && min !== undefined ? Number(min) : NaN;
    const maxNum = max !== null && max !== undefined ? Number(max) : NaN;

    const hasMin = Number.isFinite(minNum) && minNum > 0;
    const hasMax = Number.isFinite(maxNum) && maxNum > 0;

    if (!hasMin && !hasMax) return "Not disclosed";
    if (hasMin && hasMax)
      return `₹${minNum.toLocaleString()} – ₹${maxNum.toLocaleString()}`;
    if (hasMin) return `From ₹${minNum.toLocaleString()}`;
    return `Up to ₹${maxNum.toLocaleString()}`;
  };

  const translateJobType = (type?: string) => {
    if (!type) return "";
    return type
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const translateExperienceLevel = (level?: string) => {
    if (!level) return "";
    const map: Record<string, string> = {
      fresher: "Fresher",
      "0_1": "0–1 yrs",
      "1_3": "1–3 yrs",
      "3_plus": "3+ yrs",
    };
    return map[level] || level;
  };

  /* ------------------------------ Render --------------------------------- */
  return (
    <div className="relative z-10">
      {/* ============================== HEADER ============================== */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300 backdrop-blur-xl">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
            Company Jobs
          </div>

          <h1 className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-3xl font-extrabold text-transparent sm:text-4xl">
            Your Jobs
          </h1>

          <p className="mt-2 text-white/70">
            Manage job openings, review applications, and keep listings up to
            date.
          </p>
        </div>

        <Link
          href="/company/jobs/new"
          className="inline-flex w-fit items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/10 transition hover:opacity-90 hover:shadow-violet-500/20"
        >
          <span className="text-lg leading-none">+</span>
          New Job
        </Link>
      </div>

      {/* ============================== STATS =============================== */}
      {!loading && !error && safeJobs.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatPill label="Total" value={counts.total} accent="white" />
          <StatPill label="Active" value={counts.active} accent="emerald" />
          <StatPill label="Drafts" value={counts.draft} accent="yellow" />
          <StatPill label="Closed" value={counts.closed} accent="red" />
        </div>
      )}

      {/* ============================== FILTERS ============================= */}
      {!loading && !error && safeJobs.length > 0 && (
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <label
                htmlFor="job-search"
                className="mb-1.5 block text-sm font-medium text-white/60"
              >
                Search
              </label>
              <input
                id="job-search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title or location..."
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/30 transition focus:border-violet-400/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              />
            </div>

            <div>
              <label
                htmlFor="job-type"
                className="mb-1.5 block text-sm font-medium text-white/60"
              >
                Type
              </label>
              <select
                id="job-type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white transition focus:border-violet-400/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              >
                <option value="" className="bg-[#1b1738]">
                  All types
                </option>
                <option value="full_time" className="bg-[#1b1738]">
                  Full Time
                </option>
                <option value="part_time" className="bg-[#1b1738]">
                  Part Time
                </option>
                <option value="contract" className="bg-[#1b1738]">
                  Contract
                </option>
                <option value="remote" className="bg-[#1b1738]">
                  Remote
                </option>
              </select>
            </div>

            <div>
              <label
                htmlFor="job-status"
                className="mb-1.5 block text-sm font-medium text-white/60"
              >
                Status
              </label>
              <select
                id="job-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white transition focus:border-violet-400/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              >
                <option value="" className="bg-[#1b1738]">
                  All statuses
                </option>
                <option value="draft" className="bg-[#1b1738]">
                  Draft
                </option>
                <option value="published" className="bg-[#1b1738]">
                  Published
                </option>
                <option value="closed" className="bg-[#1b1738]">
                  Closed
                </option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ============================== LOADING ============================= */}
      {loading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-xl"
            >
              <div className="mb-3 h-5 w-2/3 rounded bg-white/10" />
              <div className="mb-4 h-4 w-1/2 rounded bg-white/10" />
              <div className="mb-4 h-10 w-full rounded bg-white/10" />
              <div className="flex gap-2">
                <div className="h-8 w-20 rounded-lg bg-white/10" />
                <div className="h-8 w-24 rounded-lg bg-white/10" />
                <div className="ml-auto h-8 w-20 rounded-lg bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ============================== ERROR =============================== */}
      {!loading && error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="mb-3 text-4xl">⚠️</div>
          <p className="text-red-300">{error}</p>
          <button
            onClick={fetchJobs}
            className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 hover:text-red-200"
          >
            Retry
          </button>
        </div>
      )}

      {/* ============================== EMPTY =============================== */}
      {!loading && !error && safeJobs.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center text-white/50 shadow-2xl backdrop-blur-xl">
          <div className="mb-4 text-5xl">💼</div>
          <p className="text-lg">No jobs posted yet</p>
          <p className="mt-1 text-sm text-white/40">
            Post your first job opening to start receiving applications.
          </p>
          <Link
            href="/company/jobs/new"
            className="mt-4 inline-block rounded-xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/10 transition hover:opacity-90"
          >
            + Post your first job
          </Link>
        </div>
      )}

      {/* ========================= FILTER EMPTY ============================= */}
      {!loading &&
        !error &&
        safeJobs.length > 0 &&
        filteredJobs.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center text-white/50 shadow-2xl backdrop-blur-xl">
            <div className="mb-4 text-5xl">🔍</div>
            <p>No jobs match your filters</p>
            <button
              onClick={() => {
                setSearch("");
                setTypeFilter("");
                setStatusFilter("");
              }}
              className="mt-3 rounded-lg px-4 py-2 text-sm font-medium text-violet-300 transition hover:bg-violet-500/10 hover:text-violet-200"
            >
              Clear filters
            </button>
          </div>
        )}

      {/* ============================== JOB CARDS =========================== */}
      {!loading && !error && filteredJobs.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="group flex flex-col rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-violet-400/30 hover:bg-white/[0.08]"
            >
              {/* Title + status */}
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold text-white transition-colors group-hover:text-violet-200">
                  {job.title}
                </h3>

                <span
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${
                    job.status === "published"
                      ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-300"
                      : job.status === "closed"
                        ? "border-red-400/20 bg-red-500/15 text-red-300"
                        : "border-yellow-400/20 bg-yellow-500/15 text-yellow-300"
                  }`}
                >
                  {job.status}
                </span>
              </div>

              {/* Meta */}
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/60">
                <span>📍 {job.location || "—"}</span>
                <span className="h-1 w-1 rounded-full bg-white/20" />
                <span>{translateJobType(job.job_type)}</span>
                {job.experience_level && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-white/20" />
                    <span>{translateExperienceLevel(job.experience_level)}</span>
                  </>
                )}
              </div>

              {/* Details */}
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/60">
                <span>💰 {formatSalary(job.salary_min, job.salary_max)}</span>
                <span className="h-1 w-1 rounded-full bg-white/20" />
                <span>
                  👥 {job.vacancies}{" "}
                  {job.vacancies === 1 ? "vacancy" : "vacancies"}
                </span>

                {job.application_deadline && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-white/20" />
                    <span>
                      Deadline: {formatDeadline(job.application_deadline)}
                    </span>
                  </>
                )}
              </div>

              {/* Skills */}
              {Array.isArray(job.skills) && job.skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {job.skills.slice(0, 4).map((skill, idx) => (
                    <span
                      key={idx}
                      className="rounded-full border border-cyan-400/15 bg-cyan-500/10 px-2.5 py-1 text-xs text-cyan-300"
                    >
                      {skill}
                    </span>
                  ))}
                  {job.skills.length > 4 && (
                    <span className="px-1 py-1 text-xs text-white/40">
                      +{job.skills.length - 4}
                    </span>
                  )}
                </div>
              )}

              {/* Description */}
              {job.description && (
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/60">
                  {job.description}
                </p>
              )}

              {/* Active badge */}
              {!job.is_active && (
                <div className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/50">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/40" />
                  Inactive
                </div>
              )}

              {/* Actions */}
              <div className="mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-4">
                <button
                  onClick={() => router.push(`/company/jobs/${job.id}`)}
                  className="rounded-lg border border-violet-400/20 bg-violet-500/10 px-3.5 py-1.5 text-sm font-medium text-violet-200 transition hover:bg-violet-500/20"
                >
                  ✏️ Edit
                </button>

                <button
                  onClick={() =>
                    router.push(`/company/jobs/${job.id}/applications`)
                  }
                  className="rounded-lg border border-cyan-400/20 bg-cyan-500/10 px-3.5 py-1.5 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/20"
                >
                  📨 Applications
                </button>

                <button
                  onClick={() =>
                    setDeleteModal({
                      open: true,
                      id: job.id,
                      title: job.title,
                    })
                  }
                  className="ml-auto rounded-lg border border-red-400/20 bg-red-500/10 px-3.5 py-1.5 text-sm font-medium text-red-300 transition hover:bg-red-500/20 hover:text-red-200"
                >
                  🗑 Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ============================ DELETE MODAL ========================== */}
      <ConfirmModal
        open={deleteModal.open}
        title="Delete Job"
        message={
          deleteModal.title
            ? `Are you sure you want to delete "${deleteModal.title}"? This action cannot be undone.`
            : "Are you sure? This action cannot be undone."
        }
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal({ open: false, id: null })}
        loading={deleting}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Stat pill                                                                 */
/* -------------------------------------------------------------------------- */

type PillAccent = "white" | "emerald" | "yellow" | "red";

const PILL_STYLES: Record<PillAccent, { text: string }> = {
  white: { text: "text-white" },
  emerald: { text: "text-emerald-300" },
  yellow: { text: "text-yellow-300" },
  red: { text: "text-red-300" },
};

function StatPill({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: PillAccent;
}) {
  const styles = PILL_STYLES[accent];
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl">
      <p className="text-xs text-white/50">{label}</p>
      <p className={`mt-1 text-xl font-bold ${styles.text}`}>{value}</p>
    </div>
  );
}