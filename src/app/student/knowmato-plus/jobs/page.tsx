'use client';

import { useEffect, useState, useMemo } from 'react';
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

export default function JobsPage() {
  const { t } = useTranslation();

  // --- Data & loading states ---
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Filters ---
  const [searchTitle, setSearchTitle] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterType, setFilterType] = useState('');

  // --- Detail/Apply modal ---
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // --- Apply form state ---
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [applying, setApplying] = useState(false);
  const [applyMessage, setApplyMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // --- Withdraw state ---
  const [withdrawing, setWithdrawing] = useState(false);

  // --- Fetch jobs and my applications on mount ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [jobsRes, appsRes] = await Promise.all([
          getJobs(),
          getMyJobApplications(),
        ]);

        setJobs(jobsRes);
        setApplications(appsRes);
      } catch (err: any) {
        console.error('JOBS LOAD ERROR:', err);

        const errorMessage =
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          t('jobs.loadError');

        setError(errorMessage);

        AlertService.error(
          'Unable to Load Jobs',
          errorMessage,
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [t]);

  // --- Client-side filtering ---
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesTitle = job.title
        .toLowerCase()
        .includes(searchTitle.toLowerCase());

      const matchesLocation = filterLocation
        ? job.location
            .toLowerCase()
            .includes(filterLocation.toLowerCase())
        : true;

      const matchesType = filterType
        ? job.job_type === filterType
        : true;

      return matchesTitle && matchesLocation && matchesType;
    });
  }, [jobs, searchTitle, filterLocation, filterType]);

  // --- Open detail modal ---
  const openDetailModal = (job: Job) => {
    setSelectedJob(job);
    setCoverLetter('');
    setResumeUrl('');
    setApplyMessage(null);
    setDetailModalOpen(true);
  };

  // --- Get application for selected job (if any) ---
  const selectedApplication = useMemo(() => {
    if (!selectedJob) return null;

    return (
      applications.find(
        (app) => app.job === selectedJob.id
      ) || null
    );
  }, [selectedJob, applications]);

  // --- Submit application ---
  const handleApply = async () => {
    if (!selectedJob) return;

    setApplying(true);
    setApplyMessage(null);

    try {
      const result = await applyForJob({
        job: selectedJob.id,
        cover_letter: coverLetter || undefined,
        resume_url: resumeUrl || undefined,
      });

      if (result && result.data) {
        setApplications((prev) => [
          ...prev,
          result.data,
        ]);
      } else {
        const updatedApps =
          await getMyJobApplications();

        setApplications(updatedApps);
      }

      const successMessage =
        t('jobs.applicationSuccess');

      setApplyMessage({
        type: 'success',
        text: successMessage,
      });

      AlertService.success(
        'Application Submitted',
        successMessage,
      );
    } catch (err: any) {
      console.error(
        'JOB APPLICATION ERROR:',
        err
      );

      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        t('jobs.somethingWentWrong');

      setApplyMessage({
        type: 'error',
        text: detail,
      });

      AlertService.error(
        'Application Failed',
        detail,
      );
    } finally {
      setApplying(false);
    }
  };

  // --- Withdraw application ---
  const handleWithdraw = async () => {
    if (!selectedApplication) return;

    setWithdrawing(true);

    try {
      await withdrawJobApplication(
        selectedApplication.id
      );

      setApplications((prev) =>
        prev.filter(
          (app) =>
            app.id !== selectedApplication.id
        )
      );

      setDetailModalOpen(false);
      setSelectedJob(null);
      setApplyMessage(null);

      AlertService.success(
        'Application Withdrawn',
        t(
          'jobs.withdrawSuccess',
          'Your job application has been withdrawn successfully.',
        ),
      );
    } catch (err: any) {
      console.error(
        'JOB WITHDRAW ERROR:',
        err
      );

      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        t('jobs.withdrawFailed');

      setApplyMessage({
        type: 'error',
        text: detail,
      });

      AlertService.error(
        'Withdrawal Failed',
        detail,
      );
    } finally {
      setWithdrawing(false);
    }
  };

  // --- Helpers ---
  const formatSalary = (
    min?: number,
    max?: number
  ) => {
    if (!min && !max) return null;

    if (min && max) {
      return `₹${min.toLocaleString()} - ₹${max.toLocaleString()}`;
    }

    if (min) {
      return `From ₹${min.toLocaleString()}`;
    }

    return `Up to ₹${max?.toLocaleString()}`;
  };

  const formatDeadline = (
    dateString?: string
  ) => {
    if (!dateString) return null;

    return new Date(
      dateString
    ).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // --- Translation helpers ---
  const translateJobType = (
    type: string
  ) => {
    const keyMap: Record<string, string> = {
      full_time: 'jobs.types.full_time',
      part_time: 'jobs.types.part_time',
      contract: 'jobs.types.contract',
      remote: 'jobs.types.remote',
    };

    return t(keyMap[type] || type);
  };

  const translateExperienceLevel = (
    level: string
  ) => {
    const keyMap: Record<string, string> = {
      entry: 'jobs.experience.entry',
      mid: 'jobs.experience.mid',
      senior: 'jobs.experience.senior',
      lead: 'jobs.experience.lead',
    };

    return t(keyMap[level] || level);
  };

  const translateApplicationStatus = (
    status: string
  ) => {
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

  const getStatusColor = (
    status: string
  ) => {
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

  // --- Render ---
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] p-4 sm:p-6 lg:p-8 text-white">

      {/* Background blobs */}
      <div className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl animate-blob" />

      <div className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl animate-blob animation-delay-2000" />

      <div className="pointer-events-none absolute -bottom-20 left-40 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl animate-blob animation-delay-4000" />

      <div className="relative z-10 mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-10">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300 backdrop-blur-xl">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
            {t('jobs.title')}
          </div>

          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 sm:text-4xl">
            {t('jobs.title')}
          </h1>

          <p className="mt-2 max-w-2xl text-white/70">
            {t('jobs.subtitle')}
          </p>
        </div>

        {/* Filters */}
        <div className="mb-10 rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-xl sm:p-6">
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
                onChange={(e) =>
                  setSearchTitle(e.target.value)
                }
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
                onChange={(e) =>
                  setFilterLocation(e.target.value)
                }
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
                onChange={(e) =>
                  setFilterType(e.target.value)
                }
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white backdrop-blur-xl transition focus:border-violet-400/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              >
                <option
                  value=""
                  className="bg-[#1b1738]"
                >
                  {t('jobs.typeAll')}
                </option>

                <option
                  value="full_time"
                  className="bg-[#1b1738]"
                >
                  {t('jobs.types.full_time')}
                </option>

                <option
                  value="part_time"
                  className="bg-[#1b1738]"
                >
                  {t('jobs.types.part_time')}
                </option>

                <option
                  value="contract"
                  className="bg-[#1b1738]"
                >
                  {t('jobs.types.contract')}
                </option>

                <option
                  value="remote"
                  className="bg-[#1b1738]"
                >
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
            <div className="mb-3 text-4xl">
              ⚠️
            </div>

            <p className="text-red-300">
              {error}
            </p>

            <button
              onClick={() =>
                window.location.reload()
              }
              className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 hover:text-red-200"
            >
              {t('jobs.retry')}
            </button>
          </div>
        )}

        {/* Empty API data */}
        {!loading &&
          !error &&
          jobs.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center text-white/50 shadow-2xl backdrop-blur-xl">
              <div className="mb-4 text-5xl">
                💼
              </div>

              <p className="text-lg">
                {t('jobs.noJobs')}
              </p>
            </div>
          )}

        {/* Filtered empty */}
        {!loading &&
          !error &&
          jobs.length > 0 &&
          filteredJobs.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center text-white/50 shadow-2xl backdrop-blur-xl">
              <div className="mb-4 text-5xl">
                🔍
              </div>

              <p>
                {t('jobs.noMatchingJobs')}
              </p>

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
        {!loading &&
          !error &&
          filteredJobs.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredJobs.map((job) => {
                const application =
                  applications.find(
                    (app) => app.job === job.id
                  );

                return (
                  <div
                    key={job.id}
                    onClick={() =>
                      openDetailModal(job)
                    }
                    className="group flex cursor-pointer flex-col rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/30 hover:bg-white/[0.08] hover:shadow-violet-500/10"
                  >
                    {/* Title & Company */}
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
                          {translateExperienceLevel(
                            job.experience_level
                          )}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-white/70">
                      {job.description}
                    </p>

                    {/* Skills */}
                    {job.skills &&
                      job.skills.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {job.skills
                            .slice(0, 3)
                            .map((skill, idx) => (
                              <span
                                key={idx}
                                className="rounded-full border border-cyan-400/10 bg-cyan-500/10 px-2.5 py-1 text-xs text-cyan-300"
                              >
                                {skill}
                              </span>
                            ))}

                          {job.skills.length > 3 && (
                            <span className="px-1 py-1 text-xs text-white/40">
                              +{job.skills.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                    {/* Salary & Deadline */}
                    <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                      <span className="text-sm font-bold text-emerald-400">
                        {formatSalary(
                          job.salary_min,
                          job.salary_max
                        ) ||
                          t('jobs.negotiable')}
                      </span>

                      {job.application_deadline && (
                        <span className="text-right text-xs text-white/40">
                          {t('jobs.deadline')}:{' '}
                          {formatDeadline(
                            job.application_deadline
                          )}
                        </span>
                      )}
                    </div>

                    {/* Application status badge */}
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
      </div>

      {/* Detail / Apply / Status Modal */}
      {detailModalOpen &&
        selectedJob && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#070711]/80 p-4 backdrop-blur-md"
            onMouseDown={(event) => {
              if (
                event.target ===
                  event.currentTarget &&
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

              {/* Modal top glow */}
              <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-fuchsia-500/10 blur-3xl" />

              <div className="pointer-events-none absolute -left-20 bottom-20 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />

              {/* Close button */}
              <button
                onClick={() => {
                  if (
                    applying ||
                    withdrawing
                  )
                    return;

                  setDetailModalOpen(false);
                  setSelectedJob(null);
                  setApplyMessage(null);
                }}
                className="absolute right-5 top-5 z-10 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50 transition hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>

              {/* Job details */}
              <div className="relative z-10">
                <div className="pr-10">
                  <div className="mb-3 inline-flex rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300">
                    💼 {translateJobType(
                      selectedJob.job_type
                    )}
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

                <div className="mt-5 flex flex-wrap gap-2.5 text-sm">
                  <span className="rounded-full border border-violet-400/20 bg-violet-500/15 px-3 py-1.5 text-violet-200">
                    {translateJobType(
                      selectedJob.job_type
                    )}
                  </span>

                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-white/60">
                    📍 {selectedJob.location}
                  </span>

                  {selectedJob.experience_level && (
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-white/60">
                      {translateExperienceLevel(
                        selectedJob.experience_level
                      )}
                    </span>
                  )}

                  {selectedJob.vacancies && (
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-white/60">
                      {t(
                        'jobs.openPositions',
                        {
                          count:
                            selectedJob.vacancies,
                        }
                      )}
                    </span>
                  )}
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                    <div className="mb-2 text-2xl">
                      💰
                    </div>

                    <h3 className="font-semibold text-white/70">
                      {t('jobs.salary')}
                    </h3>

                    <p className="mt-1 text-lg font-bold text-emerald-400">
                      {formatSalary(
                        selectedJob.salary_min,
                        selectedJob.salary_max
                      ) ||
                        t('jobs.notDisclosed')}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                    <div className="mb-2 text-2xl">
                      📅
                    </div>

                    <h3 className="font-semibold text-white/70">
                      {t('jobs.deadline')}
                    </h3>

                    <p className="mt-1 text-white/80">
                      {selectedJob.application_deadline
                        ? formatDeadline(
                            selectedJob.application_deadline
                          )
                        : t('jobs.ongoing')}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h3 className="font-semibold text-white/80">
                    {t('jobs.description')}
                  </h3>

                  <p className="mt-2 whitespace-pre-line leading-7 text-white/70">
                    {selectedJob.description}
                  </p>
                </div>

                {/* Skills */}
                {selectedJob.skills &&
                  selectedJob.skills.length >
                    0 && (
                    <div className="mt-6">
                      <h3 className="font-semibold text-white/80">
                        {t(
                          'jobs.requiredSkills'
                        )}
                      </h3>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedJob.skills.map(
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

                {/* Application section */}
                <div className="mt-8 border-t border-white/10 pt-6">
                  {selectedApplication ? (
                    // Already applied
                    <div>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="text-lg font-semibold text-white">
                          {t(
                            'jobs.yourApplication'
                          )}
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
                          date: new Date(
                            selectedApplication.applied_at
                          ).toLocaleDateString(),
                        })}
                      </p>

                      {selectedApplication.cover_letter && (
                        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                          <h4 className="text-sm font-medium text-white/70">
                            {t(
                              'jobs.coverLetter'
                            )}
                          </h4>

                          <p className="mt-2 text-sm leading-6 text-white/60">
                            {
                              selectedApplication.cover_letter
                            }
                          </p>
                        </div>
                      )}

                      <button
                        onClick={handleWithdraw}
                        disabled={withdrawing}
                        className="mt-6 w-full rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {withdrawing
                          ? t(
                              'jobs.withdrawing'
                            )
                          : t(
                              'jobs.withdrawApplication'
                            )}
                      </button>
                    </div>
                  ) : (
                    // Apply form
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {t(
                          'jobs.applyForThisPosition'
                        )}
                      </h3>

                      <div className="mt-4 space-y-4">
                        <div>
                          <label
                            htmlFor="cover-letter"
                            className="block text-sm font-medium text-white/70"
                          >
                            {t(
                              'jobs.coverLetter'
                            )}{' '}
                            <span className="text-xs text-white/40">
                              {t(
                                'jobs.optional'
                              )}
                            </span>
                          </label>

                          <textarea
                            id="cover-letter"
                            rows={4}
                            value={coverLetter}
                            onChange={(e) =>
                              setCoverLetter(
                                e.target.value
                              )
                            }
                            placeholder={t(
                              'jobs.coverLetterPlaceholder'
                            )}
                            className="mt-1 w-full resize-none rounded-xl border border-white/10 bg-white/5 p-3 text-white placeholder:text-white/30 transition focus:border-violet-400/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="resume-url"
                            className="block text-sm font-medium text-white/70"
                          >
                            {t(
                              'jobs.resumeUrl'
                            )}{' '}
                            <span className="text-xs text-white/40">
                              {t(
                                'jobs.optional'
                              )}
                            </span>
                          </label>

                          <input
                            id="resume-url"
                            type="url"
                            value={resumeUrl}
                            onChange={(e) =>
                              setResumeUrl(
                                e.target.value
                              )
                            }
                            placeholder={t(
                              'jobs.resumeUrlPlaceholder'
                            )}
                            className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/30 transition focus:border-violet-400/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                          />
                        </div>

                        {applyMessage && (
                          <div
                            className={`rounded-xl border px-4 py-3 text-sm ${
                              applyMessage.type ===
                              'success'
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
                          ? t(
                              'jobs.submitting'
                            )
                          : t(
                              'jobs.submitApplication'
                            )}
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