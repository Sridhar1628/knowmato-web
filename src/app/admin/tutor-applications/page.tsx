"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getTutorApplications } from "@/services/v1Service";
import AdminLayout from "@/app/admin/AdminLayout";
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
// Status helpers (dark theme)
// ---------------------------------------------------------------------------
const statusConfig: Record<string, { label: string; colors: string; emoji: string }> = {
  pending: {
    label: "Pending",
    colors: "bg-amber-400/20 text-amber-300 border-amber-400/40",
    emoji: "🕒",
  },
  approved: {
    label: "Approved",
    colors: "bg-emerald-400/20 text-emerald-300 border-emerald-400/40",
    emoji: "✅",
  },
  rejected: {
    label: "Rejected",
    colors: "bg-rose-400/20 text-rose-300 border-rose-400/40",
    emoji: "❌",
  },
};

const statusOptions = ["All", "pending", "approved", "rejected"] as const;

// ---------------------------------------------------------------------------
// Skeleton (dark)
// ---------------------------------------------------------------------------
const SkeletonCard = () => (
  <div className="animate-pulse rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6">
    <div className="flex items-center gap-4">
      <div className="h-12 w-12 rounded-full bg-white/10" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 rounded bg-white/10" />
        <div className="h-3 w-1/2 rounded bg-white/10" />
      </div>
    </div>
    <div className="mt-4 space-y-2">
      <div className="h-3 w-2/3 rounded bg-white/10" />
      <div className="h-3 w-full rounded bg-white/10" />
    </div>
    <div className="mt-4 h-10 w-full rounded-xl bg-white/10" />
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
      <AdminLayout>
        <div className="flex min-h-[50vh] items-center justify-center px-4">
          <div className="text-center">
            <span className="text-4xl">⚠️</span>
            <p className="mt-3 text-lg font-medium text-white">{error}</p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={fetchData}
              className="mt-4 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-2 font-bold text-white shadow-lg shadow-violet-500/25"
            >
              Try Again
            </motion.button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="relative p-4 sm:p-6 lg:p-8">
        {/* Animated blobs */}
        <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob pointer-events-none" />
        <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000 pointer-events-none" />
        <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000 pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-7xl">
          {/* ---- Header ---- */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 sm:text-4xl">
              🧑‍🏫 Tutor Applications
            </h1>
            <p className="mt-2 text-white/70">
              Review and manage onboarding requests from aspiring tutors.
            </p>
          </motion.div>

          {/* ---- Filters ---- */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 rounded-2xl bg-white/5 backdrop-blur-xl p-4 border border-white/10 shadow-2xl sm:flex sm:items-center sm:gap-4"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name, email, skills…"
                className="w-full rounded-xl bg-gray-900/60 border-2 border-white/20 py-3 pl-4 pr-10 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-4 focus:ring-violet-500/50 focus:border-violet-400 transition"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40">
                🔍
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2 sm:mt-0">
              <span className="text-sm font-medium text-white/70">Filter:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl bg-gray-900/60 border-2 border-white/20 px-4 py-3 text-sm font-medium text-white focus:outline-none focus:ring-4 focus:ring-violet-500/50 focus:border-violet-400 appearance-none cursor-pointer"
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s} className="bg-gray-900">
                    {s === "All" ? "All Status" : s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </motion.div>

          {/* ---- Content ---- */}
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 text-center bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 shadow-lg"
            >
              <span className="text-5xl">📭</span>
              <h2 className="mt-4 text-xl font-bold text-white">No applications found</h2>
              <p className="mt-2 text-white/60">
                {applications.length === 0
                  ? "No tutor applications have been submitted yet."
                  : "No applications match your current filters."}
              </p>
            </motion.div>
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
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -4, borderColor: "rgba(167,139,250,0.6)" }}
                    className="group rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-xl transition-all hover:shadow-2xl"
                  >
                    {/* Avatar & Info */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-lg font-bold text-white shadow-lg shadow-violet-500/25">
                          {initials}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">
                            {app.full_name}
                          </h3>
                          <p className="text-sm text-white/60">{app.email}</p>
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
                      <p className="text-sm font-medium text-white/80">
                        🛠️ Skills
                      </p>
                      <p className="mt-1 text-sm text-white/60">{app.skills}</p>
                    </div>

                    {/* Action */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() =>
                        router.push(`/admin/tutor-applications/${app.id}`)
                      }
                      className="mt-6 w-full rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-2.5 font-bold text-white shadow-lg shadow-violet-500/25 hover:from-violet-600 hover:to-fuchsia-600 transition-all active:scale-[0.98]"
                    >
                      View Details
                    </motion.button>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}