"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  getInternshipApplications,
  updateInternshipApplicationStatus,
  type InternshipApplication,
} from "@/services/v2Service";
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

const STATUS_FLOW = [
  "shortlisted",
  "interview",
  "selected",
  "rejected",
] as const;

type StatusKey = (typeof STATUS_FLOW)[number];

const ALL_STATUSES = ["applied", ...STATUS_FLOW, "withdrawn"] as const;

function statusStyle(status: string): string {
  switch (status) {
    case "applied":
      return "border-blue-400/20 bg-blue-500/15 text-blue-300";
    case "shortlisted":
      return "border-yellow-400/20 bg-yellow-500/15 text-yellow-300";
    case "interview":
      return "border-purple-400/20 bg-purple-500/15 text-purple-300";
    case "selected":
      return "border-emerald-400/20 bg-emerald-500/15 text-emerald-300";
    case "rejected":
      return "border-red-400/20 bg-red-500/15 text-red-300";
    case "withdrawn":
      return "border-gray-400/20 bg-gray-500/15 text-gray-300";
    default:
      return "border-white/10 bg-white/5 text-white/60";
  }
}

function formatDate(dateString?: string) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function initials(studentId: number) {
  return `S${studentId}`;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export default function CompanyInternshipApplicationsPage() {
  const params = useParams();
  const rawId = params?.id;
  const internshipId = Array.isArray(rawId) ? rawId[0] : rawId;

  const parsedInternshipId = internshipId
    ? Number(internshipId)
    : NaN;

  const numericInternshipId = Number.isInteger(parsedInternshipId)
    ? parsedInternshipId
    : null;

  const [apps, setApps] = useState<InternshipApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [notesDraft, setNotesDraft] = useState<Record<number, string>>({});

  /* ------------------------------ Fetch ---------------------------------- */
  const fetchApps = useCallback(async () => {
    if (!numericInternshipId) {
      setApps([]);
      setError("Invalid internship ID.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(
        "GET /api/v2/internship-applications/",
        "internship:",
        numericInternshipId,
      );

      const res = await getInternshipApplications({
        internship: numericInternshipId,
      });

      console.log("INTERNSHIP APPLICATIONS API RESPONSE:", res);

      setApps(toArray<InternshipApplication>(res));
    } catch (err: any) {
      console.error("LOAD INTERNSHIP APPLICATIONS ERROR:", err);

      const responseData = err?.response?.data;

      const detail =
        responseData?.detail ||
        responseData?.message ||
        responseData?.error ||
        (typeof responseData === "string" ? responseData : null) ||
        err?.message ||
        "Failed to load applications";

      setError(detail);
      AlertService.error("Load Failed", detail);
    } finally {
      setLoading(false);
    }
  }, [numericInternshipId]);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  /* ------------------------------ Update --------------------------------- */
  const updateStatus = async (appId: number, status: string) => {
    setUpdatingId(appId);

    try {
      const notes = notesDraft[appId] ?? "";
      await updateInternshipApplicationStatus(appId, status, notes);

      // Optimistic local update — no refetch needed
      setApps((prev) =>
        (Array.isArray(prev) ? prev : []).map((a) =>
          a.id === appId
            ? { ...a, status, company_notes: notes || a.company_notes }
            : a
        )
      );

      AlertService.success(
        "Status Updated",
        `Application marked as ${status}.`
      );
    } catch (err: any) {
      console.error("UPDATE STATUS ERROR:", err);
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to update status";
      AlertService.error("Update Failed", detail);
    } finally {
      setUpdatingId(null);
    }
  };

  /* ------------------------------ Derived -------------------------------- */
  const safeApps = useMemo(
    () => (Array.isArray(apps) ? apps : []),
    [apps]
  );

  const filteredApps = useMemo(() => {
    const q = search.trim().toLowerCase();

    return safeApps.filter((a) => {
      const matchesStatus = statusFilter ? a.status === statusFilter : true;
      const matchesSearch = q
        ? String(a.student).includes(q) ||
          (a.cover_letter || "").toLowerCase().includes(q)
        : true;
      return matchesStatus && matchesSearch;
    });
  }, [safeApps, statusFilter, search]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { total: safeApps.length };
    ALL_STATUSES.forEach((s) => {
      c[s] = safeApps.filter((a) => a.status === s).length;
    });
    return c;
  }, [safeApps]);

  /* ------------------------------ Render --------------------------------- */
  return (
    <div className="relative z-10">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300 backdrop-blur-xl">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
          Applications
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-3xl font-extrabold text-transparent sm:text-4xl">
              Internship Applications
            </h1>
            <p className="mt-2 text-white/70">
              Review applicants, update their status, and leave notes for your
              team.
            </p>
          </div>

          <Link
            href="/company/internships"
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            ← Back to Internships
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatPill label="Total" value={counts.total} accent="white" />
        <StatPill label="Applied" value={counts.applied} accent="blue" />
        <StatPill label="Shortlisted" value={counts.shortlisted} accent="yellow" />
        <StatPill label="Interview" value={counts.interview} accent="purple" />
        <StatPill label="Selected" value={counts.selected} accent="emerald" />
        <StatPill label="Rejected" value={counts.rejected} accent="red" />
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="app-search"
              className="mb-1.5 block text-sm font-medium text-white/60"
            >
              Search
            </label>
            <input
              id="app-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student ID or cover letter..."
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/30 transition focus:border-violet-400/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </div>

          <div>
            <label
              htmlFor="app-status"
              className="mb-1.5 block text-sm font-medium text-white/60"
            >
              Status
            </label>
            <select
              id="app-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white transition focus:border-violet-400/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            >
              <option value="" className="bg-[#1b1738]">
                All statuses
              </option>
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s} className="bg-[#1b1738]">
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-xl"
            >
              <div className="mb-3 h-4 w-32 rounded bg-white/10" />
              <div className="mb-4 h-4 w-full rounded bg-white/10" />
              <div className="flex gap-2">
                <div className="h-8 w-20 rounded-lg bg-white/10" />
                <div className="h-8 w-20 rounded-lg bg-white/10" />
                <div className="h-8 w-20 rounded-lg bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="mb-3 text-4xl">⚠️</div>
          <p className="text-red-300">{error}</p>
          <button
            onClick={fetchApps}
            className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 hover:text-red-200"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty — no applications at all */}
      {!loading && !error && safeApps.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center text-white/50 shadow-2xl backdrop-blur-xl">
          <div className="mb-4 text-5xl">📭</div>
          <p className="text-lg">No applications yet</p>
          <p className="mt-1 text-sm text-white/40">
            Applications will appear here once students apply.
          </p>
        </div>
      )}

      {/* Empty — filters returned nothing */}
      {!loading &&
        !error &&
        safeApps.length > 0 &&
        filteredApps.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center text-white/50 shadow-2xl backdrop-blur-xl">
            <div className="mb-4 text-5xl">🔍</div>
            <p>No applications match your filters</p>
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("");
              }}
              className="mt-3 rounded-lg px-4 py-2 text-sm font-medium text-violet-300 transition hover:bg-violet-500/10 hover:text-violet-200"
            >
              Clear filters
            </button>
          </div>
        )}

      {/* Applications list */}
      {!loading && !error && filteredApps.length > 0 && (
        <div className="space-y-3">
          {filteredApps.map((app) => {
            const isExpanded = expandedId === app.id;
            const isUpdating = updatingId === app.id;
            const notesValue = notesDraft[app.id] ?? app.company_notes ?? "";

            return (
              <div
                key={app.id}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl transition hover:border-violet-400/20"
              >
                {/* Row header */}
                <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-500 text-xs font-bold text-white">
                      {initials(app.student)}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-semibold text-white">
                        Student #{app.student}
                      </p>
                      <p className="text-xs text-white/50">
                        Applied {formatDate(app.applied_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${statusStyle(
                        app.status
                      )}`}
                    >
                      {app.status}
                    </span>

                    <button
                      onClick={() =>
                        setExpandedId(isExpanded ? null : app.id)
                      }
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
                    >
                      {isExpanded ? "Hide details" : "View details"}
                    </button>
                  </div>
                </div>

                {/* Expanded body */}
                {isExpanded && (
                  <div className="border-t border-white/10 p-5">
                    {/* Cover letter */}
                    <div className="mb-4">
                      <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/50">
                        Cover Letter
                      </h4>
                      <p className="whitespace-pre-line text-sm leading-6 text-white/70">
                        {app.cover_letter?.trim() || (
                          <span className="text-white/40 italic">
                            No cover letter provided.
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Resume */}
                    <div className="mb-4">
                      <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-white/50">
                        Resume
                      </h4>
                      {app.resume_url ? (
                        <a
                          href={app.resume_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/20 bg-cyan-500/10 px-3 py-1.5 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20"
                        >
                          📄 Open resume ↗
                        </a>
                      ) : (
                        <p className="text-sm italic text-white/40">
                          No resume attached.
                        </p>
                      )}
                    </div>

                    {/* Notes */}
                    <div className="mb-4">
                      <label
                        htmlFor={`notes-${app.id}`}
                        className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/50"
                      >
                        Internal Notes
                      </label>
                      <textarea
                        id={`notes-${app.id}`}
                        rows={2}
                        value={notesValue}
                        onChange={(e) =>
                          setNotesDraft((prev) => ({
                            ...prev,
                            [app.id]: e.target.value,
                          }))
                        }
                        placeholder="Add notes visible to your team..."
                        className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 transition focus:border-violet-400/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                      />
                    </div>

                    {/* Status actions */}
                    <div>
                      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">
                        Update Status
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {STATUS_FLOW.map((s) => {
                          const isActive = app.status === s;
                          return (
                            <button
                              key={s}
                              onClick={() => updateStatus(app.id, s)}
                              disabled={isUpdating || isActive}
                              className={`rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition disabled:cursor-not-allowed ${
                                isActive
                                  ? statusStyle(s) + " opacity-90"
                                  : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-50"
                              }`}
                            >
                              {isUpdating && !isActive
                                ? "…"
                                : s.charAt(0).toUpperCase() + s.slice(1)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Stat pill                                                                 */
/* -------------------------------------------------------------------------- */

type PillAccent =
  | "white"
  | "blue"
  | "yellow"
  | "purple"
  | "emerald"
  | "red";

const PILL_STYLES: Record<PillAccent, { text: string; bg: string }> = {
  white: { text: "text-white", bg: "bg-white/10" },
  blue: { text: "text-blue-300", bg: "bg-blue-500/15" },
  yellow: { text: "text-yellow-300", bg: "bg-yellow-500/15" },
  purple: { text: "text-purple-300", bg: "bg-purple-500/15" },
  emerald: { text: "text-emerald-300", bg: "bg-emerald-500/15" },
  red: { text: "text-red-300", bg: "bg-red-500/15" },
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