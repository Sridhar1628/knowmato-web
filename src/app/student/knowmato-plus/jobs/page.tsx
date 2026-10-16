'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getJobs,
  getMyJobApplications,
  applyForJob,
  withdrawJobApplication,
  type Job,
  type JobApplication,
} from '@/services/v2Service';
import { useTranslation } from 'react-i18next';
import AlertService from '@/services/alertService';

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

/** `salary_min/max` may be number | string | null. Coerce safely. */
function toSalaryNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** `skills` is typed string[] but guard against a CSV string. */
function parseSkills(value: string | string[] | null | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Extract a single application from an apply response. */
function normalizeSingleApplication(
  response: unknown
): JobApplication | null {
  if (!response || typeof response !== 'object') return null;
  const value = response as Record<string, any>;

  if (value.id !== undefined && value.job !== undefined) {
    return value as JobApplication;
  }
  if (
    value.data &&
    typeof value.data === 'object' &&
    !Array.isArray(value.data) &&
    value.data.id !== undefined &&
    value.data.job !== undefined
  ) {
    return value.data as JobApplication;
  }
  if (
    value.result &&
    typeof value.result === 'object' &&
    !Array.isArray(value.result) &&
    value.result.id !== undefined &&
    value.result.job !== undefined
  ) {
    return value.result as JobApplication;
  }
  if (
    value.application &&
    typeof value.application === 'object' &&
    !Array.isArray(value.application) &&
    value.application.id !== undefined &&
    value.application.job !== undefined
  ) {
    return value.application as JobApplication;
  }
  return null;
}

const HISTORY_STATUSES = [
  'applied',
  'shortlisted',
  'interview',
  'offered',
  'rejected',
  'withdrawn',
] as const;

type HistoryStatus = (typeof HISTORY_STATUSES)[number];
type TabKey = 'live' | 'history';

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export default function JobsPage() {
  const { t } = useTranslation();

  /* ------------------------------- Tabs --------------------------------- */
  const [activeTab, setActiveTab] = useState<TabKey>('live');

  /* ------------------------------- Data --------------------------------- */
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ------------------------------ Filters ------------------------------- */
  const [searchTitle, setSearchTitle] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterType, setFilterType] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<
    HistoryStatus | ''
  >('');

  /* ---------------------------- Detail modal ---------------------------- */
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  /* -------------------------- Apply form state -------------------------- */
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [applying, setApplying] = useState(false);
  const [applyMessage, setApplyMessage] = useState<{
    type: 'success' | 'error';
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

        const [jobsRes, appsRes] = await Promise.all([
          getJobs(),
          getMyJobApplications(),
        ]);

        setJobs(toArray<Job>(jobsRes));
        setApplications(toArray<JobApplication>(appsRes));
      } catch (err: any) {
        console.error('JOBS LOAD ERROR:', err);

        const errorMessage =
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          t('jobs.loadError');

        setError(errorMessage);
        setJobs([]);
        setApplications([]);

        AlertService.error('Unable to Load Jobs', errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [t]);

  /* ---------------------------- Filtered data --------------------------- */
  const filteredJobs = useMemo(() => {
    const safeJobs = Array.isArray(jobs) ? jobs : [];

    return safeJobs.filter((job) => {
      const matchesTitle = (job.title || '')
        .toLowerCase()
        .includes(searchTitle.toLowerCase());

      const matchesLocation = filterLocation
        ? (job.location || '').toLowerCase().includes(filterLocation.toLowerCase())
        : true;

      const matchesType = filterType ? job.job_type === filterType : true;

      return matchesTitle && matchesLocation && matchesType;
    });
  }, [jobs, searchTitle, filterLocation, filterType]);

  const filteredApplications = useMemo(() => {
    if (!historyStatusFilter) return applications;
    return applications.filter((app) => app.status === historyStatusFilter);
  }, [applications, historyStatusFilter]);

  const historyCounts = useMemo(() => {
    const counts: Record<string, number> = { '': applications.length };
    HISTORY_STATUSES.forEach((s) => {
      counts[s] = applications.filter((a) => a.status === s).length;
    });
    return counts;
  }, [applications]);

  /* --------------------------- Open modal ------------------------------- */
  const openDetailModal = (job: Job) => {
    setSelectedJob(job);
    setCoverLetter('');
    setResumeUrl('');
    setApplyMessage(null);
    setDetailModalOpen(true);
  };

  /** Open the modal from a History-tab card. Falls back to a minimal stub
   *  if the job is no longer in the loaded list. */
  const openDetailFromApplication = useCallback(
    (app: JobApplication) => {
      const found = jobs.find((j) => Number(j.id) === Number(app.job));

      if (found) {
        openDetailModal(found);
        return;
      }

      const anyApp = app as any;
      const stub: Job = {
        id: Number(app.job),
        company: 0,
        company_name: anyApp.company_name,
        title: anyApp.job_title || 'Job',
        description: '',
        skills: [],
        location: '',
        job_type: '',
        experience_level: '',
        salary_min: 0,
        salary_max: 0,
        vacancies: 0,
        status: 'closed',
        is_active: false,
        created_at: '',
        updated_at: '',
      };

      openDetailModal(stub);
    },
    [jobs]
  );

  /* ---------------------- Selected application -------------------------- */
  const selectedApplication = useMemo(() => {
    if (!selectedJob) return null;
    if (!Array.isArray(applications)) return null;

    return (
      applications.find((app) => Number(app.job) === Number(selectedJob.id)) ||
      null
    );
  }, [selectedJob, applications]);

  /* ------------------------------ Apply --------------------------------- */
  const handleApply = async () => {
    if (!selectedJob || applying) return;

    setApplying(true);
    setApplyMessage(null);

    try {
      const result = await applyForJob({
        job: selectedJob.id,
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
        const updatedApps = await getMyJobApplications();
        setApplications(toArray<JobApplication>(updatedApps));
      }

      const successMessage = t('jobs.applicationSuccess');

      setApplyMessage({ type: 'success', text: successMessage });
      AlertService.success('Application Submitted', successMessage);
    } catch (err: any) {
      console.error('JOB APPLICATION ERROR:', err);

      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        t('jobs.somethingWentWrong');

      setApplyMessage({ type: 'error', text: detail });
      AlertService.error('Application Failed', detail);
    } finally {
      setApplying(false);
    }
  };

  /* ----------------------------- Withdraw ------------------------------- */
  const handleWithdraw = async () => {
    if (!selectedApplication || withdrawing) return;

    setWithdrawing(true);

    try {
      await withdrawJobApplication(selectedApplication.id);

      setApplications((prev) =>
        (Array.isArray(prev) ? prev : []).filter(
          (app) => Number(app.id) !== Number(selectedApplication.id)
        )
      );

      setDetailModalOpen(false);
      setSelectedJob(null);
      setApplyMessage(null);

      AlertService.success(
        'Application Withdrawn',
        t(
          'jobs.withdrawSuccess',
          'Your job application has been withdrawn successfully.'
        )
      );
    } catch (err: any) {
      console.error('JOB WITHDRAW ERROR:', err);

      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        t('jobs.withdrawFailed');

      setApplyMessage({ type: 'error', text: detail });
      AlertService.error('Withdrawal Failed', detail);
    } finally {
      setWithdrawing(false);
    }
  };

  /* ----------------------------- Helpers -------------------------------- */
  const formatSalary = (
    min?: number | string | null,
    max?: number | string | null
  ) => {
    const minNum = toSalaryNumber(min);
    const maxNum = toSalaryNumber(max);

    if (!minNum && !maxNum) return null;
    if (minNum && maxNum)
      return `₹${minNum.toLocaleString()} – ₹${maxNum.toLocaleString()}`;
    if (minNum) return `From ₹${minNum.toLocaleString()}`;
    return `Up to ₹${maxNum.toLocaleString()}`;
  };

  const formatDeadline = (dateString?: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatAppliedAt = (dateString?: string) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  /* ------------------------ Translation helpers ------------------------- */
  const translateJobType = (type: string) => {
    const keyMap: Record<string, string> = {
      full_time: 'jobs.types.full_time',
      part_time: 'jobs.types.part_time',
      contract: 'jobs.types.contract',
      remote: 'jobs.types.remote',
    };
    return t(keyMap[type] || type);
  };

  const translateExperienceLevel = (level: string) => {
    const keyMap: Record<string, string> = {
      fresher: 'jobs.experience.fresher',
      entry: 'jobs.experience.entry',
      '0_1': 'jobs.experience.0_1',
      '1_3': 'jobs.experience.1_3',
      '3_plus': 'jobs.experience.3_plus',
      mid: 'jobs.experience.mid',
      senior: 'jobs.experience.senior',
      lead: 'jobs.experience.lead',
    };
    return t(keyMap[level] || level);
  };

  const translateApplicationStatus = (status: string) => {
    const keyMap: Record<string, string> = {
      applied: 'jobs.status.applied',
      shortlisted: 'jobs.status.shortlisted',
      interview: 'jobs.status.interview',
      offered: 'jobs.status.offered',
      rejected: 'jobs.status.rejected',
      withdrawn: 'jobs.status.withdrawn',
    };
    return t(keyMap[status] || status);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied':
        return 'bg-blue-500/20 text-blue-300 border border-blue-400/20';
      case 'shortlisted':
        return 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/20';
      case 'interview':
        return 'bg-purple-500/20 text-purple-300 border border-purple-400/20';
      case 'offered':
        return 'bg-green-500/20 text-green-300 border border-green-400/20';
      case 'rejected':
        return 'bg-red-500/20 text-red-300 border border-red-400/20';
      case 'withdrawn':
        return 'bg-gray-500/20 text-gray-400 border border-gray-400/20';
      default:
        return 'bg-white/10 text-white/60 border border-white/10';
    }
  };

  /* ---------------------------------------------------------------------- */
  /*  Render                                                                */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] p-4 text-white sm:p-6 lg:p-8">
      {/* Background blobs */}
      <div className="pointer-events-none absolute -left-20 top-0 h-72 w-72 animate-blob rounded-full bg-purple-500/20 blur-3xl" />
      <div className="animation-delay-2000 pointer-events-none absolute -right-20 top-0 h-72 w-72 animate-blob rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="animation-delay-4000 pointer-events-none absolute -bottom-20 left-40 h-72 w-72 animate-blob rounded-full bg-cyan-500/20 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300 backdrop-blur-xl">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
            {t('jobs.title')}
          </div>

          <h1 className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-3xl font-extrabold text-transparent sm:text-4xl">
            {t('jobs.title')}
          </h1>

          <p className="mt-2 max-w-2xl text-white/70">{t('jobs.subtitle')}</p>
        </div>

        {/* -------------------------- Tabs ---------------------------- */}
        <div className="mb-8 inline-flex rounded-2xl border border-white/10 bg-white/5 p-1.5 backdrop-blur-xl">
          <button
            onClick={() => setActiveTab('live')}
            className={`relative flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
              activeTab === 'live'
                ? 'bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 text-white shadow-lg shadow-violet-500/20'
                : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span>🌐</span>
            {t('jobs.liveTab', 'Live')}
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                activeTab === 'live'
                  ? 'bg-white/20 text-white'
                  : 'bg-white/10 text-white/60'
              }`}
            >
              {jobs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`relative flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 text-white shadow-lg shadow-violet-500/20'
                : 'text-white/60 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span>📜</span>
            {t('jobs.historyTab', 'History')}
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                activeTab === 'history'
                  ? 'bg-white/20 text-white'
                  : 'bg-white/10 text-white/60'
              }`}
            >
              {applications.length}
            </span>
          </button>
        </div>

        {/* ========================== LIVE TAB ========================== */}
        {activeTab === 'live' && (
          <>
            {/* Filters */}
            <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <span className="text-lg">🔎</span>
                <h2 className="font-semibold text-white">
                  {t('jobs.search')}
                </h2>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label
                    htmlFor="search-title"
                    className="mb-1.5 block text-sm font-medium text-white/60"
                  >
                    {t('jobs.search')}
                  </label>
                  <input
                    id="search-title"
                    type="text"
                    value={searchTitle}
                    onChange={(e) => setSearchTitle(e.target.value)}
                    placeholder={t('jobs.searchPlaceholder')}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/30 backdrop-blur-xl transition focus:border-violet-400/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>

                <div>
                  <label
                    htmlFor="filter-location"
                    className="mb-1.5 block text-sm font-medium text-white/60"
                  >
                    {t('jobs.location')}
                  </label>
                  <input
                    id="filter-location"
                    type="text"
                    value={filterLocation}
                    onChange={(e) => setFilterLocation(e.target.value)}
                    placeholder={t('jobs.locationPlaceholder')}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/30 backdrop-blur-xl transition focus:border-violet-400/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>

                <div>
                  <label
                    htmlFor="filter-type"
                    className="mb-1.5 block text-sm font-medium text-white/60"
                  >
                    {t('jobs.type')}
                  </label>
                  <select
                    id="filter-type"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white backdrop-blur-xl transition focus:border-violet-400/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  >
                    <option value="" className="bg-[#1b1738]">
                      {t('jobs.typeAll')}
                    </option>
                    <option value="full_time" className="bg-[#1b1738]">
                      {t('jobs.types.full_time')}
                    </option>
                    <option value="part_time" className="bg-[#1b1738]">
                      {t('jobs.types.part_time')}
                    </option>
                    <option value="contract" className="bg-[#1b1738]">
                      {t('jobs.types.contract')}
                    </option>
                    <option value="remote" className="bg-[#1b1738]">
                      {t('jobs.types.remote')}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            {/* Loading skeleton */}
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
                    <div className="mb-4 flex gap-2">
                      <div className="h-5 w-20 rounded-full bg-white/10" />
                      <div className="h-5 w-20 rounded-full bg-white/10" />
                    </div>
                    <div className="flex justify-between">
                      <div className="h-5 w-20 rounded bg-white/10" />
                      <div className="h-5 w-16 rounded bg-white/10" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error state */}
            {!loading && error && (
              <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-8 text-center shadow-2xl backdrop-blur-xl">
                <div className="mb-3 text-4xl">⚠️</div>
                <p className="text-red-300">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 hover:text-red-200"
                >
                  {t('jobs.retry')}
                </button>
              </div>
            )}

            {/* Empty API data */}
            {!loading && !error && jobs.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center text-white/50 shadow-2xl backdrop-blur-xl">
                <div className="mb-4 text-5xl">💼</div>
                <p className="text-lg">{t('jobs.noJobs')}</p>
              </div>
            )}

            {/* Filtered empty */}
            {!loading &&
              !error &&
              jobs.length > 0 &&
              filteredJobs.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center text-white/50 shadow-2xl backdrop-blur-xl">
                  <div className="mb-4 text-5xl">🔍</div>
                  <p>{t('jobs.noMatchingJobs')}</p>
                  <button
                    onClick={() => {
                      setSearchTitle('');
                      setFilterLocation('');
                      setFilterType('');
                    }}
                    className="mt-3 rounded-lg px-4 py-2 text-sm font-medium text-violet-300 transition hover:bg-violet-500/10 hover:text-violet-200"
                  >
                    {t('jobs.clearFilters')}
                  </button>
                </div>
              )}

            {/* Job cards */}
            {!loading && !error && filteredJobs.length > 0 && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredJobs.map((job) => {
                  const application = Array.isArray(applications)
                    ? applications.find(
                        (app) => Number(app.job) === Number(job.id)
                      )
                    : undefined;

                  const skills = parseSkills(job.skills);

                  return (
                    <div
                      key={job.id}
                      onClick={() => openDetailModal(job)}
                      className="group flex cursor-pointer flex-col rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/30 hover:bg-white/[0.08] hover:shadow-violet-500/10"
                    >
                      {/* Title & icon */}
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-lg font-bold text-white transition-colors group-hover:text-violet-200">
                          {job.title}
                        </h3>
                        <span className="shrink-0 rounded-lg bg-violet-500/10 px-2 py-1 text-xs text-violet-300">
                          💼
                        </span>
                      </div>

                      {job.company_name && (
                        <p className="mt-1 text-sm font-medium text-violet-300">
                          {job.company_name}
                        </p>
                      )}

                      {/* Tags */}
                      <div className="mt-4 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-violet-400/20 bg-violet-500/20 px-2.5 py-1 text-violet-200">
                          {translateJobType(job.job_type)}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-white/60">
                          📍 {job.location}
                        </span>
                        {job.experience_level && (
                          <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-white/60">
                            {translateExperienceLevel(job.experience_level)}
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="mt-4 line-clamp-3 text-sm leading-6 text-white/70">
                        {job.description}
                      </p>

                      {/* Skills */}
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

                      {/* Salary & Deadline */}
                      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                        <span className="text-sm font-bold text-emerald-400">
                          {formatSalary(job.salary_min, job.salary_max) ||
                            t('jobs.negotiable')}
                        </span>
                        {job.application_deadline && (
                          <span className="text-right text-xs text-white/40">
                            {t('jobs.deadline')}:{' '}
                            {formatDeadline(job.application_deadline)}
                          </span>
                        )}
                      </div>

                      {/* Application status */}
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
                          {t('jobs.viewAndApply')}
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
        {activeTab === 'history' && (
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
                  count={historyCounts['']}
                  active={historyStatusFilter === ''}
                  onClick={() => setHistoryStatusFilter('')}
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
              <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-8 text-center shadow-2xl backdrop-blur-xl">
                <div className="mb-3 text-4xl">⚠️</div>
                <p className="text-red-300">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 hover:text-red-200"
                >
                  {t('jobs.retry')}
                </button>
              </div>
            )}

            {/* Empty — no applications */}
            {!loading && !error && applications.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center text-white/50 shadow-2xl backdrop-blur-xl">
                <div className="mb-3 text-5xl">📜</div>
                <p className="text-lg">
                  {t(
                    'jobs.noApplications',
                    "You haven't applied to any jobs yet."
                  )}
                </p>
                <button
                  onClick={() => setActiveTab('live')}
                  className="mt-4 rounded-xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/10 transition hover:opacity-90"
                >
                  Browse live jobs →
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
                      'jobs.noApplicationsWithStatus',
                      'No applications with this status.'
                    )}
                  </p>
                  <button
                    onClick={() => setHistoryStatusFilter('')}
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
                  const jobTitle = anyApp.job_title || 'Job';
                  const companyName = anyApp.company_name || '';

                  return (
                    <div
                      key={app.id}
                      onClick={() => openDetailFromApplication(app)}
                      className="group flex cursor-pointer flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-violet-400/30 hover:bg-white/[0.07] sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-500 text-lg">
                          💼
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate text-base font-semibold text-white transition-colors group-hover:text-violet-200">
                            {jobTitle}
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
      {detailModalOpen && selectedJob && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#070711]/80 p-4 backdrop-blur-md"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !applying &&
              !withdrawing
            ) {
              setDetailModalOpen(false);
              setSelectedJob(null);
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
                setSelectedJob(null);
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
                  💼{' '}
                  {selectedJob.job_type
                    ? translateJobType(selectedJob.job_type)
                    : 'Job'}
                </div>

                <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
                  {selectedJob.title}
                </h2>

                {selectedJob.company_name && (
                  <p className="mt-1 text-lg font-medium text-violet-300">
                    {selectedJob.company_name}
                  </p>
                )}
              </div>

              {/* Tags */}
              <div className="mt-5 flex flex-wrap gap-2.5 text-sm">
                {selectedJob.job_type && (
                  <span className="rounded-full border border-violet-400/20 bg-violet-500/15 px-3 py-1.5 text-violet-200">
                    {translateJobType(selectedJob.job_type)}
                  </span>
                )}
                {selectedJob.location && (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-white/60">
                    📍 {selectedJob.location}
                  </span>
                )}
                {selectedJob.experience_level && (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-white/60">
                    {translateExperienceLevel(selectedJob.experience_level)}
                  </span>
                )}
                {!!selectedJob.vacancies && selectedJob.vacancies > 0 && (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-white/60">
                    👥 {selectedJob.vacancies}{' '}
                    {selectedJob.vacancies === 1 ? 'vacancy' : 'vacancies'}
                  </span>
                )}
              </div>

              {/* Salary / Deadline */}
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                  <div className="mb-2 text-2xl">💰</div>
                  <h3 className="font-semibold text-white/70">
                    {t('jobs.salary')}
                  </h3>
                  <p className="mt-1 text-lg font-bold text-emerald-400">
                    {formatSalary(
                      selectedJob.salary_min,
                      selectedJob.salary_max
                    ) || t('jobs.notDisclosed')}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                  <div className="mb-2 text-2xl">📅</div>
                  <h3 className="font-semibold text-white/70">
                    {t('jobs.deadline')}
                  </h3>
                  <p className="mt-1 text-white/80">
                    {selectedJob.application_deadline
                      ? formatDeadline(selectedJob.application_deadline)
                      : t('jobs.ongoing')}
                  </p>
                </div>
              </div>

              {/* Description */}
              {selectedJob.description && (
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h3 className="font-semibold text-white/80">
                    {t('jobs.description')}
                  </h3>
                  <p className="mt-2 whitespace-pre-line leading-7 text-white/70">
                    {selectedJob.description}
                  </p>
                </div>
              )}

              {/* Responsibilities */}
              {selectedJob.responsibilities && (
                <div className="mt-6">
                  <h3 className="font-semibold text-white/80">
                    {t('jobs.responsibilities', 'Responsibilities')}
                  </h3>
                  <p className="mt-2 whitespace-pre-line leading-7 text-white/70">
                    {selectedJob.responsibilities}
                  </p>
                </div>
              )}

              {/* Requirements */}
              {selectedJob.requirements && (
                <div className="mt-6">
                  <h3 className="font-semibold text-white/80">
                    {t('jobs.requirements', 'Requirements')}
                  </h3>
                  <p className="mt-2 whitespace-pre-line leading-7 text-white/70">
                    {selectedJob.requirements}
                  </p>
                </div>
              )}

              {/* Skills */}
              {parseSkills(selectedJob.skills).length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-white/80">
                    {t('jobs.requiredSkills')}
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {parseSkills(selectedJob.skills).map((skill, idx) => (
                      <span
                        key={idx}
                        className="rounded-full border border-cyan-400/15 bg-cyan-500/10 px-3 py-1.5 text-sm text-cyan-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Application section */}
              <div className="mt-8 border-t border-white/10 pt-6">
                {selectedApplication ? (
                  /* Already applied */
                  <div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="text-lg font-semibold text-white">
                        {t('jobs.yourApplication')}
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
                      {t('jobs.appliedOn', {
                        date: formatAppliedAt(selectedApplication.applied_at),
                      })}
                    </p>

                    {selectedApplication.cover_letter && (
                      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                        <h4 className="text-sm font-medium text-white/70">
                          {t('jobs.coverLetter')}
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
                        selectedApplication.status === 'withdrawn'
                      }
                      className="mt-6 w-full rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {selectedApplication.status === 'withdrawn'
                        ? 'Application withdrawn'
                        : withdrawing
                          ? t('jobs.withdrawing')
                          : t('jobs.withdrawApplication')}
                    </button>
                  </div>
                ) : (
                  /* Apply form */
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {t('jobs.applyForThisPosition')}
                    </h3>

                    <div className="mt-4 space-y-4">
                      <div>
                        <label
                          htmlFor="cover-letter"
                          className="block text-sm font-medium text-white/70"
                        >
                          {t('jobs.coverLetter')}{' '}
                          <span className="text-xs text-white/40">
                            {t('jobs.optional')}
                          </span>
                        </label>
                        <textarea
                          id="cover-letter"
                          rows={4}
                          value={coverLetter}
                          onChange={(e) => setCoverLetter(e.target.value)}
                          placeholder={t('jobs.coverLetterPlaceholder')}
                          disabled={applying}
                          className="mt-1 w-full resize-none rounded-xl border border-white/10 bg-white/5 p-3 text-white placeholder:text-white/30 transition focus:border-violet-400/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="resume-url"
                          className="block text-sm font-medium text-white/70"
                        >
                          {t('jobs.resumeUrl')}{' '}
                          <span className="text-xs text-white/40">
                            {t('jobs.optional')}
                          </span>
                        </label>
                        <input
                          id="resume-url"
                          type="url"
                          value={resumeUrl}
                          onChange={(e) => setResumeUrl(e.target.value)}
                          placeholder={t('jobs.resumeUrlPlaceholder')}
                          disabled={applying}
                          className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/30 transition focus:border-violet-400/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50"
                        />
                      </div>

                      {applyMessage && (
                        <div
                          className={`rounded-xl border px-4 py-3 text-sm ${
                            applyMessage.type === 'success'
                              ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300'
                              : 'border-red-400/20 bg-red-500/10 text-red-300'
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
                        ? t('jobs.submitting')
                        : t('jobs.submitApplication')}
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
  | 'white'
  | 'applied'
  | 'shortlisted'
  | 'interview'
  | 'offered'
  | 'rejected'
  | 'withdrawn';

const PILL_ACCENTS: Record<
  PillAccent,
  { active: string; inactive: string }
> = {
  white: {
    active: 'border-white/30 bg-white/15 text-white',
    inactive: 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10',
  },
  applied: {
    active: 'border-blue-400/30 bg-blue-500/20 text-blue-200',
    inactive: 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10',
  },
  shortlisted: {
    active: 'border-yellow-400/30 bg-yellow-500/20 text-yellow-200',
    inactive: 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10',
  },
  interview: {
    active: 'border-purple-400/30 bg-purple-500/20 text-purple-200',
    inactive: 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10',
  },
  offered: {
    active: 'border-emerald-400/30 bg-emerald-500/20 text-emerald-200',
    inactive: 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10',
  },
  rejected: {
    active: 'border-red-400/30 bg-red-500/20 text-red-200',
    inactive: 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10',
  },
  withdrawn: {
    active: 'border-gray-400/30 bg-gray-500/20 text-gray-200',
    inactive: 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10',
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
          active ? 'bg-white/20' : 'bg-white/10'
        }`}
      >
        {count}
      </span>
    </button>
  );
}