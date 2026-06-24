"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getTutorApplications } from "@/services/v1Service";
import toast from "react-hot-toast";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Application {
  id: number;
  full_name: string;
  email: string;
  skills: string;
  status: "pending" | "approved" | "rejected";
  created_at?: string;
}

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------
const statusConfig: Record<string, { label: string; colors: string; emoji: string }> = {
  pending: {
    label: "Pending",
    colors: "bg-amber-100 text-amber-700 border-amber-200",
    emoji: "🕒",
  },
  approved: {
    label: "Approved",
    colors: "bg-emerald-100 text-emerald-700 border-emerald-200",
    emoji: "✅",
  },
  rejected: {
    label: "Rejected",
    colors: "bg-rose-100 text-rose-700 border-rose-200",
    emoji: "❌",
  },
};

const statusOptions = ["All", "pending", "approved", "rejected"] as const;

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
const SkeletonCard = () => (
  <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
    <div className="flex items-center gap-4">
      <div className="h-12 w-12 rounded-full bg-gray-200" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 rounded bg-gray-200" />
        <div className="h-3 w-1/2 rounded bg-gray-200" />
      </div>
    </div>
    <div className="mt-4 space-y-2">
      <div className="h-3 w-2/3 rounded bg-gray-200" />
      <div className="h-3 w-full rounded bg-gray-200" />
    </div>
    <div className="mt-4 h-10 w-full rounded-xl bg-gray-200" />
  </div>
);

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function TutorApplicationsPage() {
  const router = useRouter();

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // ---------- fetch ----------
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getTutorApplications();
      const data = res?.data ?? res ?? [];
      setApplications(Array.isArray(data) ? data : data?.data ?? []);
    } catch (err: any) {
      const message = err?.message || "Failed to load applications";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ---------- filtering & sorting ----------
  const filtered = useMemo(() => {
    let result = [...applications];
    if (statusFilter !== "All") {
      result = result.filter((a) => a.status === statusFilter);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (a) =>
          a.full_name.toLowerCase().includes(term) ||
          a.email.toLowerCase().includes(term) ||
          a.skills.toLowerCase().includes(term)
      );
    }
    // newest first
    result.sort((a, b) => {
      const da = a.created_at ? new Date(a.created_at).getTime() : 0;
      const db = b.created_at ? new Date(b.created_at).getTime() : 0;
      return db - da;
    });
    return result;
  }, [applications, searchTerm, statusFilter]);

  // ---------- error state ----------
  if (error) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="text-center">
          <span className="text-4xl">⚠️</span>
          <p className="mt-3 text-lg font-medium text-gray-700">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 rounded-full bg-indigo-600 px-6 py-2 font-semibold text-white hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ---- Header ---- */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            🧑‍🏫 Tutor Applications
          </h1>
          <p className="mt-2 text-lg text-indigo-100">
            Review and manage onboarding requests from aspiring tutors.
          </p>
        </div>
      </div>

      {/* ---- Filters ---- */}
      <div className="mx-auto -mt-5 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-white p-4 shadow-lg sm:flex sm:items-center sm:gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search name, email, skills…"
              className="w-full rounded-xl border border-gray-200 py-3 pl-4 pr-10 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>
          </div>
          <div className="mt-3 flex items-center gap-2 sm:mt-0">
            <span className="text-sm font-medium text-gray-600">Filter:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s === "All" ? "All Status" : s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ---- Content ---- */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <span className="text-5xl">📭</span>
            <h2 className="mt-4 text-xl font-bold text-gray-800">No applications found</h2>
            <p className="mt-2 text-gray-500">
              {applications.length === 0
                ? "No tutor applications have been submitted yet."
                : "No applications match your current filters."}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((app) => {
              const status = statusConfig[app.status] ?? statusConfig.pending;
              const initials = app.full_name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

              return (
                <div
                  key={app.id}
                  className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                >
                  {/* Avatar & Info */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-lg font-bold text-white shadow">
                        {initials}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {app.full_name}
                        </h3>
                        <p className="text-sm text-gray-500">{app.email}</p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${status.colors}`}
                    >
                      {status.emoji} {status.label}
                    </span>
                  </div>

                  {/* Skills */}
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700">
                      🛠️ Skills
                    </p>
                    <p className="mt-1 text-sm text-gray-600">{app.skills}</p>
                  </div>

                  {/* Action */}
                  <button
                    onClick={() =>
                      router.push(`/admin/tutor-applications/${app.id}`)
                    }
                    className="mt-6 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-2.5 font-semibold text-white transition-all hover:from-indigo-700 hover:to-purple-700 active:scale-[0.98]"
                  >
                    View Details
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}