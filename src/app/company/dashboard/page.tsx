"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import Link from "next/link";
import {
  getCompanyDashboard,
  type CompanyDashboard,
  type CompanyUser,
  type Job,
  type Internship,
  type JobApplication,
  type InternshipApplication,
} from "@/services/v2Service";
import AlertService from "@/services/alertService";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function toArray<T>(value: any): T[] {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  if (Array.isArray(value.data)) return value.data;
  if (Array.isArray(value.results)) return value.results;
  if (Array.isArray(value.data?.results)) return value.data.results;
  if (Array.isArray(value.data?.data)) return value.data.data;
  if (Array.isArray(value.items)) return value.items;
  return [];
}

function formatDate(dateString?: string) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function prettyType(value?: string) {
  if (!value) return "";
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export default function CompanyDashboardPage() {
  const user = useSelector((state: RootState) => state.auth.user);

  const [dashboard, setDashboard] = useState<CompanyDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ------------------------------ Fetch all ------------------------------ */
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await getCompanyDashboard();

      // Defensive: unwrap in case the service returns the wrapper
      const payload: CompanyDashboard =
        (res as any)?.data?.stats !== undefined
          ? (res as any).data
          : res;

      if (!payload || typeof payload !== "object") {
        throw new Error("Invalid dashboard payload");
      }

      // Normalize the arrays so a bad shape never crashes render
      setDashboard({
        company: payload.company as CompanyUser,
        stats: {
          active_jobs: Number(payload.stats?.active_jobs ?? 0),
          active_internships: Number(
            payload.stats?.active_internships ?? 0
          ),
          total_applications: Number(
            payload.stats?.total_applications ?? 0
          ),
          pending_applications: Number(
            payload.stats?.pending_applications ?? 0
          ),
        },
        recent_jobs: toArray<Job>(payload.recent_jobs),
        recent_internships: toArray<Internship>(
          payload.recent_internships
        ),
        recent_job_applications: toArray<JobApplication>(
          payload.recent_job_applications
        ),
        recent_internship_applications: toArray<InternshipApplication>(
          payload.recent_internship_applications
        ),
      });
    } catch (err: any) {
      console.error("COMPANY DASHBOARD LOAD ERROR:", err);
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to load dashboard";
      setError(detail);
      AlertService.error("Load Failed", detail);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ---------------------------- Derived data ----------------------------- */
  const stats = dashboard?.stats ?? {
    active_jobs: 0,
    active_internships: 0,
    total_applications: 0,
    pending_applications: 0,
  };

  const recentJobs = useMemo(
    () => toArray<Job>(dashboard?.recent_jobs),
    [dashboard]
  );
  const recentInternships = useMemo(
    () => toArray<Internship>(dashboard?.recent_internships),
    [dashboard]
  );

  const companyName =
    dashboard?.company?.company_name ||
    (user as any)?.company_name ||
    "Your Company";

  /* --------------------------------- UI ---------------------------------- */
  return (
    <div className="relative z-10">
      {/* -------------------------- Header -------------------------- */}
      <div className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300 backdrop-blur-xl">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
          Company Panel
        </div>

        <h1 className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-3xl font-extrabold text-transparent sm:text-4xl">
          {companyName}
        </h1>

        <p className="mt-2 max-w-2xl text-white/70">
          Manage your job openings, internships, and applications all in one
          place.
        </p>
      </div>

      {/* ------------------------ Error state ----------------------- */}
      {!loading && error && (
        <div className="mb-8 rounded-2xl border border-red-400/20 bg-red-500/10 p-6 text-center shadow-2xl backdrop-blur-xl">
          <div className="mb-2 text-3xl">⚠️</div>
          <p className="text-red-300">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 hover:text-red-200"
          >
            Retry
          </button>
        </div>
      )}

      {/* -------------------------- Stat cards ---------------------- */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active Jobs"
          icon="💼"
          value={stats.active_jobs}
          accent="violet"
          loading={loading}
          href="/company/jobs"
        />
        <StatCard
          label="Active Internships"
          icon="🎓"
          value={stats.active_internships}
          accent="cyan"
          loading={loading}
          href="/company/internships"
        />
        <StatCard
          label="Total Applications"
          icon="📨"
          value={stats.total_applications}
          accent="fuchsia"
          loading={loading}
        />
        <StatCard
          label="Pending Review"
          icon="⏳"
          value={stats.pending_applications}
          accent="amber"
          loading={loading}
        />
      </div>

      {/* ------------------------ Quick actions --------------------- */}
      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/company/jobs/new"
          className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-violet-400/30 hover:bg-white/[0.08]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/20 text-2xl">
            💼
          </div>
          <div className="flex-1">
            <p className="font-semibold text-white group-hover:text-violet-200">
              Post a New Job
            </p>
            <p className="mt-0.5 text-sm text-white/60">
              Create a job opening for candidates
            </p>
          </div>
          <span className="text-white/30 transition group-hover:translate-x-0.5 group-hover:text-violet-300">
            →
          </span>
        </Link>

        <Link
          href="/company/internships/new"
          className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-cyan-400/30 hover:bg-white/[0.08]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-500/20 text-2xl">
            🎓
          </div>
          <div className="flex-1">
            <p className="font-semibold text-white group-hover:text-cyan-200">
              Create an Internship
            </p>
            <p className="mt-0.5 text-sm text-white/60">
              Offer an internship program
            </p>
          </div>
          <span className="text-white/30 transition group-hover:translate-x-0.5 group-hover:text-cyan-300">
            →
          </span>
        </Link>
      </div>

      {/* ------------------------ Recent content -------------------- */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent jobs */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Recent Jobs</h2>
            <Link
              href="/company/jobs"
              className="text-sm font-medium text-violet-300 transition hover:text-violet-200"
            >
              View all →
            </Link>
          </div>

          {loading ? (
            <SkeletonList />
          ) : recentJobs.length === 0 ? (
            <EmptyMini
              icon="💼"
              text="No jobs posted yet"
              ctaLabel="Post a job"
              ctaHref="/company/jobs/new"
            />
          ) : (
            <ul className="space-y-3">
              {recentJobs.map((job) => (
                <li
                  key={job.id}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-4 transition hover:border-violet-400/20 hover:bg-white/[0.06]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-white group-hover:text-violet-200">
                      {job.title}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-white/50">
                      📍 {job.location} • {prettyType(job.job_type)} •{" "}
                      {formatDate(job.created_at)}
                    </p>
                  </div>
                  <StatusPill status={job.status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent internships */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              Recent Internships
            </h2>
            <Link
              href="/company/internships"
              className="text-sm font-medium text-cyan-300 transition hover:text-cyan-200"
            >
              View all →
            </Link>
          </div>

          {loading ? (
            <SkeletonList />
          ) : recentInternships.length === 0 ? (
            <EmptyMini
              icon="🎓"
              text="No internships posted yet"
              ctaLabel="Create internship"
              ctaHref="/company/internships/new"
            />
          ) : (
            <ul className="space-y-3">
              {recentInternships.map((internship) => (
                <li
                  key={internship.id}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-4 transition hover:border-cyan-400/20 hover:bg-white/[0.06]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-white group-hover:text-cyan-200">
                      {internship.title}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-white/50">
                      📍 {internship.location} •{" "}
                      {prettyType(internship.internship_type)} •{" "}
                      {internship.duration_months}mo • ₹
                      {internship.stipend?.toLocaleString?.() ?? 0}
                    </p>
                  </div>
                  <StatusPill status={internship.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                            */
/* -------------------------------------------------------------------------- */

type Accent = "violet" | "cyan" | "fuchsia" | "amber";

const ACCENT_STYLES: Record<
  Accent,
  { value: string; ring: string; bg: string }
> = {
  violet: {
    value: "text-violet-300",
    ring: "border-violet-400/20 hover:border-violet-400/40",
    bg: "bg-violet-500/10",
  },
  cyan: {
    value: "text-cyan-300",
    ring: "border-cyan-400/20 hover:border-cyan-400/40",
    bg: "bg-cyan-500/10",
  },
  fuchsia: {
    value: "text-fuchsia-300",
    ring: "border-fuchsia-400/20 hover:border-fuchsia-400/40",
    bg: "bg-fuchsia-500/10",
  },
  amber: {
    value: "text-amber-300",
    ring: "border-amber-400/20 hover:border-amber-400/40",
    bg: "bg-amber-500/10",
  },
};

function StatCard({
  label,
  icon,
  value,
  total,
  accent,
  loading,
  href,
}: {
  label: string;
  icon: string;
  value: number;
  total?: number;
  accent: Accent;
  loading: boolean;
  href?: string;
}) {
  const styles = ACCENT_STYLES[accent];

  const inner = (
    <div
      className={`rounded-2xl border ${styles.ring} bg-white/5 p-5 shadow-2xl backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/[0.08]`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm text-white/70">{label}</p>
        <span className={`rounded-lg ${styles.bg} px-2 py-1 text-lg`}>
          {icon}
        </span>
      </div>

      {loading ? (
        <div className="mt-3 h-9 w-20 animate-pulse rounded bg-white/10" />
      ) : (
        <div className="mt-2 flex items-baseline gap-2">
          <p className={`text-3xl font-bold ${styles.value}`}>
            {Number.isFinite(value) ? value : 0}
          </p>
          {typeof total === "number" && total !== value && (
            <span className="text-xs text-white/40">of {total}</span>
          )}
        </div>
      )}
    </div>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

function StatusPill({ status }: { status?: string }) {
  const map: Record<string, string> = {
    published: "bg-emerald-500/15 text-emerald-300 border-emerald-400/20",
    draft: "bg-gray-500/15 text-gray-300 border-gray-400/20",
    closed: "bg-red-500/15 text-red-300 border-red-400/20",
  };
  const cls =
    map[status || ""] || "bg-white/10 text-white/60 border-white/10";

  return (
    <span
      className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${cls}`}
    >
      {status || "—"}
    </span>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] p-4"
        >
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 animate-pulse rounded bg-white/10" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-white/10" />
          </div>
          <div className="h-6 w-16 animate-pulse rounded-full bg-white/10" />
        </div>
      ))}
    </div>
  );
}

function EmptyMini({
  icon,
  text,
  ctaLabel,
  ctaHref,
}: {
  icon: string;
  text: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
      <div className="mb-2 text-3xl opacity-60">{icon}</div>
      <p className="text-sm text-white/60">{text}</p>
      <Link
        href={ctaHref}
        className="mt-3 inline-block text-sm font-medium text-violet-300 transition hover:text-violet-200"
      >
        {ctaLabel} →
      </Link>
    </div>
  );
}