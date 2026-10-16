"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  getInternships,
  applyForInternship,
  getMyInternshipApplications,
  withdrawInternshipApplication,
  type Internship,
  type InternshipApplication,
} from "@/services/v2Service";
import { useTranslation } from "react-i18next";
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

/** `stipend` may be a number OR a numeric string like "15000.00". */
function parseStipend(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** `skills` is a comma-separated string per the service type. */
function parseSkills(value: string | string[] | null | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Extract a single application from an apply response, or null. */
function normalizeSingleApplication(
  response: unknown
): InternshipApplication | null {
  if (!response || typeof response !== "object") return null;
  const value = response as Record<string, any>;

  if (value.id !== undefined && value.internship !== undefined) {
    return value as InternshipApplication;
  }
  if (
    value.data &&
    typeof value.data === "object" &&
    !Array.isArray(value.data) &&
    value.data.id !== undefined &&
    value.data.internship !== undefined
  ) {
    return value.data as InternshipApplication;
  }
  if (
    value.result &&
    typeof value.result === "object" &&
    !Array.isArray(value.result) &&
    value.result.id !== undefined &&
    value.result.internship !== undefined
  ) {
    return value.result as InternshipApplication;
  }
  if (
    value.application &&
    typeof value.application === "object" &&
    !Array.isArray(value.application) &&
    value.application.id !== undefined &&
    value.application.internship !== undefined
  ) {
    return value.application as InternshipApplication;
  }
  return null;
}

const HISTORY_STATUSES = [
  "applied",
  "shortlisted",
  "interview",
  "selected",
  "rejected",
  "withdrawn",
] as const;

type HistoryStatus = (typeof HISTORY_STATUSES)[number];

type TabKey = "live" | "history";

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export default function InternshipsPage() {
  const { t } = useTranslation();

  /* ------------------------------- Tabs --------------------------------- */
  const [activeTab, setActiveTab] = useState<TabKey>("live");

  /* ------------------------------- Data --------------------------------- */
  const [internships, setInternships] = useState<Internship[]>([]);
  const [applications, setApplications] = useState<InternshipApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ------------------------------ Filters ------------------------------- */
  const [searchTitle, setSearchTitle] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterType, setFilterType] = useState("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState<
    HistoryStatus | ""
  >("");

  /* ---------------------------- Detail modal ---------------------------- */
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedInternship, setSelectedInternship] =
    useState<Internship | null>(null);

  /* -------------------------- Apply form state -------------------------- */
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [applying, setApplying] = useState(false);
  const [applyMessage, setApplyMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  /* ----------------------------- Withdraw ------------------------------- */
  const [withdrawing, setWithdrawing] = useState(false);

  /* ------------------------------ Fetch --------------------------------- */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [internshipsRes, appsRes] = await Promise.all([
          getInternships(),
          getMyInternshipApplications(),
        ]);

        setInternships(toArray<Internship>(internshipsRes));
        setApplications(toArray<InternshipApplication>(appsRes));
      } catch (err: any) {
        console.error("INTERNSHIPS LOAD ERROR:", err);

        const errorMessage =
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          t("internships.loadError");

        setError(errorMessage);
        setInternships([]);
        setApplications([]);

        AlertService.error("Unable to Load Internships", errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [t]);

  /* ---------------------------- Filtered data --------------------------- */
  const filteredInternships = useMemo(() => {
    return internships.filter((internship) => {
      const title = internship.title || "";
      const location = internship.location || "";

      const matchesTitle = title
        .toLowerCase()
        .includes(searchTitle.toLowerCase());

      const matchesLocation = filterLocation
        ? location.toLowerCase().includes(filterLocation.toLowerCase())
        : true;

      const matchesType = filterType
        ? internship.internship_type === filterType
        : true;

      return matchesTitle && matchesLocation && matchesType;
    });
  }, [internships, searchTitle, filterLocation, filterType]);

  /** Applications filtered by status dropdown in History tab. */
  const filteredApplications = useMemo(() => {
    if (!historyStatusFilter) return applications;
    return applications.filter((app) => app.status === historyStatusFilter);
  }, [applications, historyStatusFilter]);

  /** Count of applications per status, for the filter pill badges. */
  const historyCounts = useMemo(() => {
    const counts: Record<string, number> = { "": applications.length };
    HISTORY_STATUSES.forEach((s) => {
      counts[s] = applications.filter((a) => a.status === s).length;
    });
    return counts;
  }, [applications]);

  /* --------------------------- Open modal ------------------------------- */
  const openDetailModal = (internship: Internship) => {
    setSelectedInternship(internship);
    setCoverLetter("");
    setResumeUrl("");
    setApplyMessage(null);
    setDetailModalOpen(true);
  };

  /** Open modal from a History-tab card. Falls back to a minimal stub
   *  internship if the internship is no longer in the loaded list. */
  const openDetailFromApplication = useCallback(
    (app: InternshipApplication) => {
      const found = internships.find(
        (i) => Number(i.id) === Number(app.internship)
      );

      if (found) {
        openDetailModal(found);
        return;
      }

      const anyApp = app as any;
      const stub: Internship = {
        id: Number(app.internship),
        company: 0,
        title: anyApp.internship_title || "Internship",
        description: "",
        skills: "",
        location: "",
        internship_type: "",
        duration_months: 0,
        stipend: 0,
        vacancies: 0,
        ppo_available: false,
        certificate_provided: false,
        status: "closed",
        is_active: false,
        created_at: "",
        updated_at: "",
        company_name: <></>
      };

      openDetailModal(stub);
    },
    [internships]
  );

  /* ---------------------- Selected application -------------------------- */
  const selectedApplication = useMemo(() => {
    if (!selectedInternship) return null;
    return (
      applications.find(
        (app) => Number(app.internship) === Number(selectedInternship.id)
      ) || null
    );
  }, [selectedInternship, applications]);

  /* ---------------------------- Apply ----------------------------------- */
  const handleApply = async () => {
    if (!selectedInternship || applying) return;

    setApplying(true);
    setApplyMessage(null);

    try {
      const result = await applyForInternship({
        internship: selectedInternship.id,
        cover_letter: coverLetter || undefined,
        resume_url: resumeUrl || undefined,
      });

      const newApplication = normalizeSingleApplication(result);

      if (newApplication) {
        setApplications((prev) => {
          const alreadyExists = prev.some(
            (app) => Number(app.id) === Number(newApplication.id)
          );
          if (alreadyExists) return prev;
          return [...prev, newApplication];
        });
      } else {
        const updatedApps = await getMyInternshipApplications();
        setApplications(toArray<InternshipApplication>(updatedApps));
      }

      const successMessage = t("internships.applicationSuccess");

      setApplyMessage({ type: "success", text: successMessage });
      AlertService.success("Application Submitted", successMessage);
    } catch (err: any) {
      console.error("INTERNSHIP APPLICATION ERROR:", err);

      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        t("internships.somethingWentWrong");

      setApplyMessage({ type: "error", text: detail });
      AlertService.error("Application Failed", detail);
    } finally {
      setApplying(false);
    }
  };

  /* --------------------------- Withdraw --------------------------------- */
  const handleWithdraw = async () => {
    if (!selectedApplication || withdrawing) return;

    setWithdrawing(true);

    try {
      await withdrawInternshipApplication(selectedApplication.id);

      setApplications((prev) =>
        prev.filter(
          (app) => Number(app.id) !== Number(selectedApplication.id)
        )
      );

      setDetailModalOpen(false);
      setSelectedInternship(null);
      setApplyMessage(null);

      AlertService.success(
        "Application Withdrawn",
        t(
          "internships.withdrawSuccess",
          "Your internship application has been withdrawn successfully."
        )
      );
    } catch (err: any) {
      console.error("INTERNSHIP WITHDRAW ERROR:", err);

      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        t("internships.withdrawFailed");

      setApplyMessage({ type: "error", text: detail });
      AlertService.error("Withdrawal Failed", detail);
    } finally {
      setWithdrawing(false);
    }
  };

  /* ----------------------------- Helpers -------------------------------- */
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

  const formatAppliedAt = (dateString?: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "applied":
        return "bg-blue-500/20 text-blue-300 border border-blue-400/20";
      case "shortlisted":
        return "bg-yellow-500/20 text-yellow-300 border border-yellow-400/20";
      case "interview":
        return "bg-purple-500/20 text-purple-300 border border-purple-400/20";
      case "selected":
        return "bg-green-500/20 text-green-300 border border-green-400/20";
      case "rejected":
        return "bg-red-500/20 text-red-300 border border-red-400/20";
      case "withdrawn":
        return "bg-gray-500/20 text-gray-300 border border-gray-400/20";
      default:
        return "bg-white/10 text-white/60 border border-white/10";
    }
  };

  const translateInternshipType = (type: string) => {
    const keys: Record<string, string> = {
      full_time: "internships.types.full_time",
      part_time: "internships.types.part_time",
      remote: "internships.types.remote",
      hybrid: "internships.types.hybrid",
    };
    return t(keys[type] || type);
  };

  const translateApplicationStatus = (status: string) => {
    const keys: Record<string, string> = {
      applied: "internships.status.applied",
      shortlisted: "internships.status.shortlisted",
      interview: "internships.status.interview",
      selected: "internships.status.selected",
      rejected: "internships.status.rejected",
      withdrawn: "internships.status.withdrawn",
    };
    return t(keys[status] || status);
  };

  /* ---------------------------------------------------------------------- */
  /*  Render                                                                */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] p-4 text-white sm:p-6 lg:p-8">
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-0 h-72 w-72 animate-blob rounded-full bg-purple-500/20 mix-blend-multiply blur-3xl" />
        <div className="animation-delay-2000 absolute -right-20 top-0 h-72 w-72 animate-blob rounded-full bg-fuchsia-500/20 mix-blend-multiply blur-3xl" />
        <div className="animation-delay-4000 absolute -bottom-20 left-40 h-72 w-72 animate-blob rounded-full bg-cyan-500/20 mix-blend-multiply blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300 backdrop-blur-xl">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
            {t("internships.title")}
          </div>

          <h1 className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-3xl font-extrabold text-transparent sm:text-4xl">
            {t("internships.title")}
          </h1>

          <p className="mt-2 max-w-2xl text-white/70">
            {t("internships.subtitle")}
          </p>
        </div>

        {/* -------------------------- Tabs ---------------------------- */}
        <div className="mb-8 inline-flex rounded-2xl border border-white/10 bg-white/5 p-1.5 backdrop-blur-xl">
          <button
            onClick={() => setActiveTab("live")}
            className={`relative flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
              activeTab === "live"
                ? "bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 text-white shadow-lg shadow-violet-500/20"
                : "text-white/60 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span>🌐</span>
            {t("internships.liveTab", "Live")}
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                activeTab === "live"
                  ? "bg-white/20 text-white"
                  : "bg-white/10 text-white/60"
              }`}
            >
              {internships.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`relative flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
              activeTab === "history"
                ? "bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 text-white shadow-lg shadow-violet-500/20"
                : "text-white/60 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span>📜</span>
            {t("internships.historyTab", "History")}
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                activeTab === "history"
                  ? "bg-white/20 text-white"
                  : "bg-white/10 text-white/60"
              }`}
            >
              {applications.length}
            </span>
          </button>
        </div>

        {/* ========================== LIVE TAB ========================== */}
        {activeTab === "live" && (
          <>
            {/* Filters */}
            <div className="mb-8 grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-xl sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label
                  htmlFor="search-title"
                  className="mb-1.5 block text-sm font-medium text-white/60"
                >
                  {t("internships.search")}
                </label>
                <input
                  id="search-title"
                  type="text"
                  value={searchTitle}
                  onChange={(e) => setSearchTitle(e.target.value)}
                  placeholder={t("internships.searchPlaceholder")}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/30 backdrop-blur-xl transition focus:border-violet-400/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
              </div>

              <div>
                <label
                  htmlFor="filter-location"
                  className="mb-1.5 block text-sm font-medium text-white/60"
                >
                  {t("internships.location")}
                </label>
                <input
                  id="filter-location"
                  type="text"
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value)}
                  placeholder={t("internships.locationPlaceholder")}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/30 backdrop-blur-xl transition focus:border-violet-400/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
              </div>

              <div>
                <label
                  htmlFor="filter-type"
                  className="mb-1.5 block text-sm font-medium text-white/60"
                >
                  {t("internships.type")}
                </label>
                <select
                  id="filter-type"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white backdrop-blur-xl transition focus:border-violet-400/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                >
                  <option value="" className="bg-[#1b1738]">
                    {t("internships.typeAll")}
                  </option>
                  <option value="full_time" className="bg-[#1b1738]">
                    {t("internships.types.full_time")}
                  </option>
                  <option value="part_time" className="bg-[#1b1738]">
                    {t("internships.types.part_time")}
                  </option>
                  <option value="remote" className="bg-[#1b1738]">
                    {t("internships.types.remote")}
                  </option>
                  <option value="hybrid" className="bg-[#1b1738]">
                    {t("internships.types.hybrid")}
                  </option>
                </select>
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl"
                  >
                    <div className="mb-4 h-6 w-3/4 rounded bg-white/10" />
                    <div className="mb-2 h-4 w-1/2 rounded bg-white/10" />
                    <div className="mb-4 h-4 w-full rounded bg-white/10" />
                    <div className="flex justify-between">
                      <div className="h-5 w-20 rounded bg-white/10" />
                      <div className="h-5 w-16 rounded bg-white/10" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center shadow-2xl backdrop-blur-xl">
                <p className="text-red-300">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-3 rounded-lg border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm text-red-300 transition hover:bg-red-500/20"
                >
                  {t("internships.retry")}
                </button>
              </div>
            )}

            {/* Empty — no internships */}
            {!loading && !error && internships.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center text-white/50 shadow-2xl backdrop-blur-xl">
                <div className="mb-3 text-5xl">📭</div>
                <p className="text-lg">{t("internships.noInternships")}</p>
              </div>
            )}

            {/* Empty — filters */}
            {!loading &&
              !error &&
              internships.length > 0 &&
              filteredInternships.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center text-white/50 shadow-2xl backdrop-blur-xl">
                  <div className="mb-3 text-5xl">🔍</div>
                  <p>{t("internships.noMatchingInternships")}</p>
                  <button
                    onClick={() => {
                      setSearchTitle("");
                      setFilterLocation("");
                      setFilterType("");
                    }}
                    className="mt-3 rounded-lg px-4 py-2 text-sm font-medium text-violet-300 transition hover:bg-violet-500/10 hover:text-violet-200"
                  >
                    {t("internships.clearFilters")}
                  </button>
                </div>
              )}

            {/* Internship cards */}
            {!loading && !error && filteredInternships.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredInternships.map((internship) => {
                  const application =
                    applications.find(
                      (app) =>
                        Number(app.internship) === Number(internship.id)
                    ) || null;

                  const stipendNum = parseStipend(internship.stipend);
                  const skills = parseSkills(internship.skills);

                  return (
                    <div
                      key={internship.id}
                      onClick={() => openDetailModal(internship)}
                      className="group flex cursor-pointer flex-col rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/30 hover:bg-white/[0.07] hover:shadow-violet-500/10"
                    >
                      <h3 className="line-clamp-2 text-lg font-bold text-white transition-colors group-hover:text-violet-200">
                        {internship.title}
                      </h3>

                      {internship.company_name && (
                        <p className="mt-1 text-sm font-medium text-violet-300">
                          {internship.company_name}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-violet-400/20 bg-violet-500/20 px-2.5 py-1 text-violet-200">
                          {translateInternshipType(internship.internship_type)}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-white/60">
                          📍 {internship.location}
                        </span>
                        {internship.duration_months > 0 && (
                          <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-white/60">
                            ⏱️ {internship.duration_months}{" "}
                            {internship.duration_months === 1 ? "mo" : "mos"}
                          </span>
                        )}
                      </div>

                      {internship.description && (
                        <p className="mt-4 line-clamp-3 text-sm leading-6 text-white/70">
                          {internship.description}
                        </p>
                      )}

                      {skills.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {skills.slice(0, 3).map((skill, idx) => (
                            <span
                              key={idx}
                              className="rounded-full border border-cyan-400/10 bg-cyan-500/10 px-2.5 py-1 text-xs text-cyan-300"
                            >
                              {skill}
                            </span>
                          ))}
                          {skills.length > 3 && (
                            <span className="px-1 py-1 text-xs text-white/40">
                              +{skills.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                        <span className="text-sm font-bold text-emerald-400">
                          {stipendNum > 0
                            ? `₹${stipendNum.toLocaleString()}/mo`
                            : t("internships.unpaid")}
                        </span>
                        {internship.application_deadline && (
                          <span className="text-right text-xs text-white/40">
                            {t("internships.deadline", "Deadline")}:{" "}
                            {formatDeadline(internship.application_deadline)}
                          </span>
                        )}
                      </div>

                      {application ? (
                        <div
                          className={`mt-4 w-full rounded-xl px-4 py-2.5 text-center text-sm font-semibold ${getStatusColor(
                            application.status
                          )}`}
                        >
                          {translateApplicationStatus(
                            application.status
                          ).toUpperCase()}
                        </div>
                      ) : (
                        <div className="mt-4 w-full rounded-xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 px-4 py-2.5 text-center text-sm font-bold text-white shadow-lg shadow-violet-500/10 transition-all group-hover:shadow-violet-500/20">
                          {t("internships.viewAndApply")}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ========================= HISTORY TAB ========================= */}
        {activeTab === "history" && (
          <>
            {/* Status filter pills */}
            <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-lg">🎯</span>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-white/60">
                  Filter by status
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusFilterPill
                  label="All"
                  count={historyCounts[""]}
                  active={historyStatusFilter === ""}
                  onClick={() => setHistoryStatusFilter("")}
                  accent="white"
                />
                {HISTORY_STATUSES.map((s) => (
                  <StatusFilterPill
                    key={s}
                    label={s.charAt(0).toUpperCase() + s.slice(1)}
                    count={historyCounts[s] ?? 0}
                    active={historyStatusFilter === s}
                    onClick={() => setHistoryStatusFilter(s)}
                    accent={s}
                  />
                ))}
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
                    <div className="mb-3 h-5 w-2/3 rounded bg-white/10" />
                    <div className="mb-2 h-4 w-1/3 rounded bg-white/10" />
                    <div className="h-6 w-24 rounded-full bg-white/10" />
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center shadow-2xl backdrop-blur-xl">
                <p className="text-red-300">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-3 rounded-lg border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm text-red-300 transition hover:bg-red-500/20"
                >
                  {t("internships.retry")}
                </button>
              </div>
            )}

            {/* Empty — no applications */}
            {!loading && !error && applications.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center text-white/50 shadow-2xl backdrop-blur-xl">
                <div className="mb-3 text-5xl">📜</div>
                <p className="text-lg">
                  {t(
                    "internships.noApplications",
                    "You haven't applied to any internships yet."
                  )}
                </p>
                <button
                  onClick={() => setActiveTab("live")}
                  className="mt-4 rounded-xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/10 transition hover:opacity-90"
                >
                  Browse live internships →
                </button>
              </div>
            )}

            {/* Empty — no matches for filter */}
            {!loading &&
              !error &&
              applications.length > 0 &&
              filteredApplications.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center text-white/50 shadow-2xl backdrop-blur-xl">
                  <div className="mb-3 text-5xl">🔍</div>
                  <p>
                    {t(
                      "internships.noApplicationsWithStatus",
                      "No applications with this status."
                    )}
                  </p>
                  <button
                    onClick={() => setHistoryStatusFilter("")}
                    className="mt-3 rounded-lg px-4 py-2 text-sm font-medium text-violet-300 transition hover:bg-violet-500/10 hover:text-violet-200"
                  >
                    Show all
                  </button>
                </div>
              )}

            {/* Applications list */}
            {!loading && !error && filteredApplications.length > 0 && (
              <div className="space-y-3">
                {filteredApplications.map((app) => {
                  const anyApp = app as any;
                  const internshipTitle =
                    anyApp.internship_title || "Internship";
                  const companyName = anyApp.company_name || "";

                  return (
                    <div
                      key={app.id}
                      onClick={() => openDetailFromApplication(app)}
                      className="group flex cursor-pointer flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-violet-400/30 hover:bg-white/[0.07] sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-500 text-lg">
                          🎓
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate text-base font-semibold text-white transition-colors group-hover:text-violet-200">
                            {internshipTitle}
                          </h3>
                          {companyName && (
                            <p className="mt-0.5 truncate text-sm text-violet-300">
                              {companyName}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-white/50">
                            Applied {formatAppliedAt(app.applied_at)}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${getStatusColor(
                            app.status
                          )}`}
                        >
                          {translateApplicationStatus(app.status)}
                        </span>
                        <span className="text-white/30 transition group-hover:translate-x-0.5 group-hover:text-violet-300">
                          →
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* ================================================================== */}
      {/* Detail / Apply / Status Modal                                     */}
      {/* ================================================================== */}
      {detailModalOpen && selectedInternship && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#070711]/80 p-4 backdrop-blur-md"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !applying &&
              !withdrawing
            ) {
              setDetailModalOpen(false);
              setSelectedInternship(null);
              setApplyMessage(null);
            }
          }}
        >
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/15 bg-gradient-to-br from-[#15122f]/95 via-[#211d45]/95 to-[#17152f]/95 p-6 shadow-2xl shadow-violet-950/40 backdrop-blur-2xl sm:p-7">
            <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-fuchsia-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -left-20 bottom-20 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />

            {/* Close */}
            <button
              onClick={() => {
                if (applying || withdrawing) return;
                setDetailModalOpen(false);
                setSelectedInternship(null);
                setApplyMessage(null);
              }}
              className="absolute right-5 top-5 z-10 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50 transition hover:bg-white/10 hover:text-white"
            >
              ✕
            </button>

            <div className="relative z-10">
              {/* Title */}
              <div className="pr-10">
                <div className="mb-3 inline-flex rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300">
                  🎓{" "}
                  {selectedInternship.internship_type
                    ? translateInternshipType(
                        selectedInternship.internship_type
                      )
                    : "Internship"}
                </div>
                <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
                  {selectedInternship.title}
                </h2>
                {selectedInternship.company_name && (
                  <p className="mt-1 text-lg font-medium text-violet-300">
                    {selectedInternship.company_name}
                  </p>
                )}
              </div>

              {/* Tags */}
              <div className="mt-5 flex flex-wrap gap-2.5 text-sm">
                {selectedInternship.internship_type && (
                  <span className="rounded-full border border-violet-400/20 bg-violet-500/15 px-3 py-1.5 text-violet-200">
                    {translateInternshipType(
                      selectedInternship.internship_type
                    )}
                  </span>
                )}
                {selectedInternship.location && (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-white/60">
                    📍 {selectedInternship.location}
                  </span>
                )}
                {selectedInternship.duration_months > 0 && (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-white/60">
                    ⏱️ {selectedInternship.duration_months}{" "}
                    {selectedInternship.duration_months === 1 ? "mo" : "mos"}
                  </span>
                )}
                {selectedInternship.vacancies > 0 && (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-white/60">
                    👥 {selectedInternship.vacancies}{" "}
                    {selectedInternship.vacancies === 1
                      ? "vacancy"
                      : "vacancies"}
                  </span>
                )}
              </div>

              {/* Stipend / Deadline */}
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                  <div className="mb-2 text-2xl">💰</div>
                  <h3 className="font-semibold text-white/70">
                    {t("internships.stipend")}
                  </h3>
                  <p className="mt-1 text-lg font-bold text-emerald-400">
                    {parseStipend(selectedInternship.stipend) > 0
                      ? `₹${parseStipend(
                          selectedInternship.stipend
                        ).toLocaleString()}/mo`
                      : t("internships.unpaid")}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                  <div className="mb-2 text-2xl">📅</div>
                  <h3 className="font-semibold text-white/70">
                    {t("internships.applicationDeadline")}
                  </h3>
                  <p className="mt-1 text-white/80">
                    {selectedInternship.application_deadline
                      ? formatDeadline(
                          selectedInternship.application_deadline
                        )
                      : t("internships.ongoing")}
                  </p>
                </div>
              </div>

              {/* Description */}
              {selectedInternship.description && (
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h3 className="font-semibold text-white/80">
                    {t("internships.description")}
                  </h3>
                  <p className="mt-2 whitespace-pre-line leading-7 text-white/70">
                    {selectedInternship.description}
                  </p>
                </div>
              )}

              {/* Responsibilities */}
              {selectedInternship.responsibilities && (
                <div className="mt-6">
                  <h3 className="font-semibold text-white/80">
                    {t("internships.responsibilities")}
                  </h3>
                  <p className="mt-2 whitespace-pre-line leading-7 text-white/70">
                    {selectedInternship.responsibilities}
                  </p>
                </div>
              )}

              {/* Requirements */}
              {selectedInternship.requirements && (
                <div className="mt-6">
                  <h3 className="font-semibold text-white/80">
                    {t("internships.requirements")}
                  </h3>
                  <p className="mt-2 whitespace-pre-line leading-7 text-white/70">
                    {selectedInternship.requirements}
                  </p>
                </div>
              )}

              {/* Skills */}
              {parseSkills(selectedInternship.skills).length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-white/80">
                    {t("internships.requiredSkills")}
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {parseSkills(selectedInternship.skills).map(
                      (skill, idx) => (
                        <span
                          key={idx}
                          className="rounded-full border border-cyan-400/15 bg-cyan-500/10 px-3 py-1.5 text-sm text-cyan-300"
                        >
                          {skill}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Additional info */}
              {(selectedInternship.ppo_available ||
                selectedInternship.certificate_provided) && (
                <div className="mt-6 flex flex-wrap gap-3 text-sm">
                  {selectedInternship.ppo_available && (
                    <span className="rounded-lg bg-emerald-500/10 px-3 py-1.5 text-emerald-300">
                      🚀 PPO Available
                    </span>
                  )}
                  {selectedInternship.certificate_provided && (
                    <span className="rounded-lg bg-cyan-500/10 px-3 py-1.5 text-cyan-300">
                      🏅 Certificate Provided
                    </span>
                  )}
                </div>
              )}

              {/* Application section */}
              <div className="mt-8 border-t border-white/10 pt-6">
                {selectedApplication ? (
                  /* Already applied */
                  <div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="text-lg font-semibold text-white">
                        {t("internships.yourApplication")}
                      </h3>
                      <span
                        className={`w-fit rounded-full px-3 py-1.5 text-sm font-medium ${getStatusColor(
                          selectedApplication.status
                        )}`}
                      >
                        {translateApplicationStatus(
                          selectedApplication.status
                        ).toUpperCase()}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-white/50">
                      {t("internships.appliedOn", {
                        date: formatAppliedAt(selectedApplication.applied_at),
                      })}
                    </p>

                    {selectedApplication.cover_letter && (
                      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                        <h4 className="text-sm font-medium text-white/70">
                          {t("internships.coverLetter")}
                        </h4>
                        <p className="mt-2 text-sm leading-6 text-white/60">
                          {selectedApplication.cover_letter}
                        </p>
                      </div>
                    )}

                    <button
                      onClick={handleWithdraw}
                      disabled={
                        withdrawing ||
                        selectedApplication.status === "withdrawn"
                      }
                      className="mt-6 w-full rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {selectedApplication.status === "withdrawn"
                        ? "Application withdrawn"
                        : withdrawing
                          ? t("internships.withdrawing")
                          : t("internships.withdrawApplication")}
                    </button>
                  </div>
                ) : (
                  /* Apply form */
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {t("internships.applyForThisInternship")}
                    </h3>

                    <div className="mt-4 space-y-4">
                      <div>
                        <label
                          htmlFor="cover-letter"
                          className="block text-sm font-medium text-white/70"
                        >
                          {t("internships.coverLetter")}{" "}
                          <span className="text-xs text-white/40">
                            {t("internships.optional")}
                          </span>
                        </label>
                        <textarea
                          id="cover-letter"
                          rows={4}
                          value={coverLetter}
                          onChange={(e) => setCoverLetter(e.target.value)}
                          placeholder={t(
                            "internships.coverLetterPlaceholder"
                          )}
                          disabled={applying}
                          className="mt-1 w-full resize-none rounded-xl border border-white/10 bg-white/5 p-3 text-white placeholder:text-white/30 transition focus:border-violet-400/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="resume-url"
                          className="block text-sm font-medium text-white/70"
                        >
                          {t("internships.resumeUrl")}{" "}
                          <span className="text-xs text-white/40">
                            {t("internships.optional")}
                          </span>
                        </label>
                        <input
                          id="resume-url"
                          type="url"
                          value={resumeUrl}
                          onChange={(e) => setResumeUrl(e.target.value)}
                          placeholder={t(
                            "internships.resumeUrlPlaceholder"
                          )}
                          disabled={applying}
                          className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/30 transition focus:border-violet-400/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50"
                        />
                      </div>

                      {applyMessage && (
                        <div
                          className={`rounded-xl border px-4 py-3 text-sm ${
                            applyMessage.type === "success"
                              ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                              : "border-red-400/20 bg-red-500/10 text-red-300"
                          }`}
                        >
                          {applyMessage.text}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleApply}
                      disabled={applying}
                      className="mt-6 w-full rounded-xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-500/10 transition hover:opacity-90 hover:shadow-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {applying
                        ? t("internships.submitting")
                        : t("internships.submitApplication")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Status filter pill                                                        */
/* -------------------------------------------------------------------------- */

type PillAccent =
  | "white"
  | "applied"
  | "shortlisted"
  | "interview"
  | "selected"
  | "rejected"
  | "withdrawn";

const PILL_ACCENTS: Record<
  PillAccent,
  { active: string; inactive: string }
> = {
  white: {
    active: "border-white/30 bg-white/15 text-white",
    inactive: "border-white/10 bg-white/5 text-white/60 hover:bg-white/10",
  },
  applied: {
    active: "border-blue-400/30 bg-blue-500/20 text-blue-200",
    inactive: "border-white/10 bg-white/5 text-white/60 hover:bg-white/10",
  },
  shortlisted: {
    active: "border-yellow-400/30 bg-yellow-500/20 text-yellow-200",
    inactive: "border-white/10 bg-white/5 text-white/60 hover:bg-white/10",
  },
  interview: {
    active: "border-purple-400/30 bg-purple-500/20 text-purple-200",
    inactive: "border-white/10 bg-white/5 text-white/60 hover:bg-white/10",
  },
  selected: {
    active: "border-emerald-400/30 bg-emerald-500/20 text-emerald-200",
    inactive: "border-white/10 bg-white/5 text-white/60 hover:bg-white/10",
  },
  rejected: {
    active: "border-red-400/30 bg-red-500/20 text-red-200",
    inactive: "border-white/10 bg-white/5 text-white/60 hover:bg-white/10",
  },
  withdrawn: {
    active: "border-gray-400/30 bg-gray-500/20 text-gray-200",
    inactive: "border-white/10 bg-white/5 text-white/60 hover:bg-white/10",
  },
};

function StatusFilterPill({
  label,
  count,
  active,
  onClick,
  accent,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  accent: PillAccent;
}) {
  const styles = PILL_ACCENTS[accent];
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
        active ? styles.active : styles.inactive
      }`}
    >
      <span>{label}</span>
      <span
        className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
          active ? "bg-white/20" : "bg-white/10"
        }`}
      >
        {count}
      </span>
    </button>
  );
}