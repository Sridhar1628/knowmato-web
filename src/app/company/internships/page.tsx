"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getInternships,
  getMyCompanyProfile,
  deleteInternship,
  type Internship,
  type CompanyUser,
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

export default function CompanyInternshipsPage() {
  const router = useRouter();

  const user = useSelector((state: RootState) => state.auth.user);
  // Fallback if the auth payload carries a `company` id
  const fallbackCompanyId = (user as any)?.company as number | undefined;

  const [companyProfile, setCompanyProfile] = useState<CompanyUser | null>(null);
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    id: number | null;
    title?: string;
  }>({
    open: false,
    id: null,
  });

  const [deleting, setDeleting] = useState(false);

  /* ------------------------------------------------------------------------ */
  /*  Fetch internships                                                       */
  /* ------------------------------------------------------------------------ */

  const fetchInternships = useCallback(async () => {
      setLoading(true);
      setError(null);

      try {
          console.log("CALLING INTERNSHIPS ENDPOINT...");

          const res = await getInternships();

          console.log("INTERNSHIPS API RESPONSE:", res);

          const data = toArray<Internship>(res);

          setInternships(data);
      } catch (err: any) {
          console.error("COMPANY INTERNSHIPS LOAD ERROR:", err);

          const detail =
              err?.response?.data?.detail ||
              err?.response?.data?.message ||
              err?.response?.data?.error ||
              err?.message ||
              "Failed to load internships";

          setError(detail);

          AlertService.error(
              "Load Failed",
              detail,
          );
      } finally {
          setLoading(false);
      }
  }, []);

  useEffect(() => {
    fetchInternships();
  }, [fetchInternships]);

  /* ------------------------------------------------------------------------ */
  /*  Delete internship                                                       */
  /* ------------------------------------------------------------------------ */

  const handleDelete = async () => {
    if (!deleteModal.id) return;

    setDeleting(true);

    try {
      await deleteInternship(deleteModal.id);

      AlertService.success(
        "Internship Deleted",
        "The internship has been deleted."
      );

      setInternships((prev) =>
        (Array.isArray(prev) ? prev : []).filter(
          (internship) => internship.id !== deleteModal.id
        )
      );
    } catch (err: any) {
      console.error("DELETE INTERNSHIP ERROR:", err);

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

  /* ------------------------------------------------------------------------ */
  /*  Filter                                                                  */
  /* ------------------------------------------------------------------------ */

  const filteredInternships = useMemo(() => {
    const safe = Array.isArray(internships) ? internships : [];
    const query = search.trim().toLowerCase();

    return safe.filter((internship) => {
      const matchesSearch = query
        ? (internship.title || "").toLowerCase().includes(query)
        : true;

      const matchesType = typeFilter
        ? internship.internship_type === typeFilter
        : true;

      return matchesSearch && matchesType;
    });
  }, [internships, search, typeFilter]);

  /* ------------------------------------------------------------------------ */
  /*  Helpers                                                                 */
  /* ------------------------------------------------------------------------ */

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

  const formatStipend = (stipend?: number | string | null) => {
    if (stipend === null || stipend === undefined || stipend === "") {
      return "Unpaid / Not disclosed";
    }
    const num = typeof stipend === "string" ? Number(stipend) : stipend;
    if (Number.isFinite(num)) {
      return `₹${num.toLocaleString()}`;
    }
    return String(stipend);
  };

  const translateInternshipType = (type?: string) => {
    if (!type) return "";
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const formatSkills = (skills?: string | string[]) => {
    if (!skills) return [];
    if (Array.isArray(skills)) return skills;
    return skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  };

  /* ------------------------------------------------------------------------ */
  /*  Render                                                                  */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="relative z-10">
      {/* ============================== HEADER ============================== */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300 backdrop-blur-xl">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
            Company Internships
          </div>

          <h1 className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-3xl font-extrabold text-transparent sm:text-4xl">
            Your Internships
          </h1>

          <p className="mt-2 text-white/70">
            Manage internship opportunities, review applications, and keep
            listings up to date.
          </p>
        </div>

        <Link
          href="/company/internships/new"
          className="inline-flex w-fit items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/10 transition hover:opacity-90 hover:shadow-violet-500/20"
        >
          <span className="text-lg leading-none">+</span>
          New Internship
        </Link>
      </div>

      {/* ============================== FILTERS ============================= */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="internship-search"
              className="mb-1.5 block text-sm font-medium text-white/60"
            >
              Search
            </label>
            <input
              id="internship-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by internship title..."
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/30 transition focus:border-violet-400/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </div>

          <div>
            <label
              htmlFor="internship-type"
              className="mb-1.5 block text-sm font-medium text-white/60"
            >
              Type
            </label>
            <select
              id="internship-type"
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
              <option value="remote" className="bg-[#1b1738]">
                Remote
              </option>
              <option value="hybrid" className="bg-[#1b1738]">
                Hybrid
              </option>
            </select>
          </div>
        </div>
      </div>

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
            onClick={fetchInternships}
            className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 hover:text-red-200"
          >
            Retry
          </button>
        </div>
      )}

      {/* ============================== EMPTY =============================== */}
      {!loading && !error && internships.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center text-white/50 shadow-2xl backdrop-blur-xl">
          <div className="mb-4 text-5xl">🎓</div>
          <p className="text-lg">No internships posted yet</p>
          <Link
            href="/company/internships/new"
            className="mt-4 inline-block rounded-xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/10 transition hover:opacity-90"
          >
            + Post your first internship
          </Link>
        </div>
      )}

      {/* ========================= FILTER EMPTY ============================= */}
      {!loading &&
        !error &&
        internships.length > 0 &&
        filteredInternships.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center text-white/50 shadow-2xl backdrop-blur-xl">
            <div className="mb-4 text-5xl">🔍</div>
            <p>No internships match your filters</p>
            <button
              onClick={() => {
                setSearch("");
                setTypeFilter("");
              }}
              className="mt-3 rounded-lg px-4 py-2 text-sm font-medium text-violet-300 transition hover:bg-violet-500/10 hover:text-violet-200"
            >
              Clear filters
            </button>
          </div>
        )}

      {/* ========================= INTERNSHIP CARDS ========================= */}
      {!loading && !error && filteredInternships.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredInternships.map((internship) => {
            const skills = formatSkills(internship.skills);

            return (
              <div
                key={internship.id}
                className="group flex flex-col rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-violet-400/30 hover:bg-white/[0.08]"
              >
                {/* Title */}
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold text-white transition-colors group-hover:text-violet-200">
                    {internship.title}
                  </h3>

                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${
                      internship.status === "published"
                        ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-300"
                        : internship.status === "closed"
                          ? "border-red-400/20 bg-red-500/15 text-red-300"
                          : "border-yellow-400/20 bg-yellow-500/15 text-yellow-300"
                    }`}
                  >
                    {internship.status}
                  </span>
                </div>

                {/* Meta */}
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/60">
                  <span>📍 {internship.location}</span>
                  <span className="h-1 w-1 rounded-full bg-white/20" />
                  <span>
                    {translateInternshipType(internship.internship_type)}
                  </span>
                  <span className="h-1 w-1 rounded-full bg-white/20" />
                  <span>
                    ⏱️ {internship.duration_months}{" "}
                    {internship.duration_months === 1 ? "month" : "months"}
                  </span>
                </div>

                {/* Details */}
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/60">
                  <span>💰 {formatStipend(internship.stipend)}</span>
                  <span className="h-1 w-1 rounded-full bg-white/20" />
                  <span>
                    👥 {internship.vacancies}{" "}
                    {internship.vacancies === 1 ? "vacancy" : "vacancies"}
                  </span>

                  {internship.application_deadline && (
                    <>
                      <span className="h-1 w-1 rounded-full bg-white/20" />
                      <span>
                        Deadline:{" "}
                        {formatDeadline(internship.application_deadline)}
                      </span>
                    </>
                  )}
                </div>

                {/* Skills */}
                {skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {skills.slice(0, 4).map((skill, idx) => (
                      <span
                        key={idx}
                        className="rounded-full border border-cyan-400/15 bg-cyan-500/10 px-2.5 py-1 text-xs text-cyan-300"
                      >
                        {skill}
                      </span>
                    ))}
                    {skills.length > 4 && (
                      <span className="px-1 py-1 text-xs text-white/40">
                        +{skills.length - 4}
                      </span>
                    )}
                  </div>
                )}

                {/* Badges */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {internship.ppo_available && (
                    <span className="rounded-lg bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">
                      PPO Available
                    </span>
                  )}
                  {internship.certificate_provided && (
                    <span className="rounded-lg bg-cyan-500/10 px-2 py-1 text-xs text-cyan-300">
                      Certificate
                    </span>
                  )}
                </div>

                {/* Description */}
                {internship.description && (
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/60">
                    {internship.description}
                  </p>
                )}

                {/* Actions */}
                <div className="mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-4">
                  <button
                    onClick={() =>
                      router.push(`/company/internships/${internship.id}`)
                    }
                    className="rounded-lg border border-violet-400/20 bg-violet-500/10 px-3.5 py-1.5 text-sm font-medium text-violet-200 transition hover:bg-violet-500/20"
                  >
                    ✏️ Edit
                  </button>

                  <button
                    onClick={() =>
                      router.push(
                        `/company/internships/${internship.id}/applications`
                      )
                    }
                    className="rounded-lg border border-cyan-400/20 bg-cyan-500/10 px-3.5 py-1.5 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/20"
                  >
                    📨 Applications
                  </button>

                  <button
                    onClick={() =>
                      setDeleteModal({
                        open: true,
                        id: internship.id,
                        title: internship.title,
                      })
                    }
                    className="ml-auto rounded-lg border border-red-400/20 bg-red-500/10 px-3.5 py-1.5 text-sm font-medium text-red-300 transition hover:bg-red-500/20 hover:text-red-200"
                  >
                    🗑 Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================ DELETE MODAL ========================== */}
      <ConfirmModal
        open={deleteModal.open}
        title="Delete Internship"
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