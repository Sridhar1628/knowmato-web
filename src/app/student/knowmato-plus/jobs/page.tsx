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
        setError(err?.response?.data?.detail || err?.message || t('jobs.loadError'));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [t]);

  // --- Client‑side filtering ---
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesTitle = job.title.toLowerCase().includes(searchTitle.toLowerCase());
      const matchesLocation = filterLocation
        ? job.location.toLowerCase().includes(filterLocation.toLowerCase())
        : true;
      const matchesType = filterType ? job.job_type === filterType : true;
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
    return applications.find((app) => app.job === selectedJob.id) || null;
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
        setApplications((prev) => [...prev, result.data]);
      } else {
        const updatedApps = await getMyJobApplications();

        setApplications(updatedApps);
      }
      setApplyMessage({
        type: 'success',
        text: t('jobs.applicationSuccess'),
      });
    } catch (err: any) {
      const detail = err?.response?.data?.detail || err?.message || t('jobs.somethingWentWrong');
      setApplyMessage({ type: 'error', text: detail });
    } finally {
      setApplying(false);
    }
  };

  // --- Withdraw application ---
  const handleWithdraw = async () => {
    if (!selectedApplication) return;
    setWithdrawing(true);
    try {
      await withdrawJobApplication(selectedApplication.id);
      setApplications((prev) => prev.filter((app) => app.id !== selectedApplication.id));
      setDetailModalOpen(false);
    } catch (err: any) {
      const detail = err?.response?.data?.detail || err?.message || t('jobs.withdrawFailed');
      setApplyMessage({ type: 'error', text: detail });
    } finally {
      setWithdrawing(false);
    }
  };

  // --- Helpers ---
  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return null;
    if (min && max) return `₹${min.toLocaleString()} - ₹${max.toLocaleString()}`;
    if (min) return `From ₹${min.toLocaleString()}`;
    return `Up to ₹${max?.toLocaleString()}`;
  };

  const formatDeadline = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // --- Translation helpers ---
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
      entry: 'jobs.experience.entry',
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
      case 'applied': return 'bg-blue-500/20 text-blue-300';
      case 'shortlisted': return 'bg-yellow-500/20 text-yellow-300';
      case 'interview': return 'bg-purple-500/20 text-purple-300';
      case 'offered': return 'bg-green-500/20 text-green-300';
      case 'rejected': return 'bg-red-500/20 text-red-300';
      case 'withdrawn': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-white/10 text-white/60';
    }
  };

  // --- Render ---
  return (
    <div className="min-h-screen bg-[#0B0C10] p-6 text-white">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300">
            {t('jobs.title')}
          </h1>
          <p className="mt-2 text-white/70">
            {t('jobs.subtitle')}
          </p>
        </div>

        {/* Filters */}
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="search-title" className="mb-1.5 block text-sm font-medium text-white/60">
              {t('jobs.search')}
            </label>
            <input
              id="search-title"
              type="text"
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
              placeholder={t('jobs.searchPlaceholder')}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/30 backdrop-blur-xl focus:border-violet-500/50 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="filter-location" className="mb-1.5 block text-sm font-medium text-white/60">
              {t('jobs.location')}
            </label>
            <input
              id="filter-location"
              type="text"
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              placeholder={t('jobs.locationPlaceholder')}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/30 backdrop-blur-xl focus:border-violet-500/50 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="filter-type" className="mb-1.5 block text-sm font-medium text-white/60">
              {t('jobs.type')}
            </label>
            <select
              id="filter-type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white backdrop-blur-xl focus:border-violet-500/50 focus:outline-none"
            >
              <option value="">{t('jobs.typeAll')}</option>
              <option value="full_time">{t('jobs.types.full_time')}</option>
              <option value="part_time">{t('jobs.types.part_time')}</option>
              <option value="contract">{t('jobs.types.contract')}</option>
              <option value="remote">{t('jobs.types.remote')}</option>
            </select>
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6"
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

        {/* Error state */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center">
            <p className="text-red-300">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 text-sm underline hover:text-white"
            >
              {t('jobs.retry')}
            </button>
          </div>
        )}

        {/* Empty API data */}
        {!loading && !error && jobs.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-12 text-center text-white/50">
            <p className="text-lg">{t('jobs.noJobs')}</p>
          </div>
        )}

        {/* Filtered empty */}
        {!loading && !error && jobs.length > 0 && filteredJobs.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-12 text-center text-white/50">
            <p>{t('jobs.noMatchingJobs')}</p>
            <button
              onClick={() => {
                setSearchTitle('');
                setFilterLocation('');
                setFilterType('');
              }}
              className="mt-2 text-sm text-violet-400 underline hover:text-violet-300"
            >
              {t('jobs.clearFilters')}
            </button>
          </div>
        )}

        {/* Job cards */}
        {!loading && !error && filteredJobs.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredJobs.map((job) => {
              // ✅ applications is now guaranteed to be an array, so .find works
              const application = applications.find((app) => app.job === job.id);
              return (
                <div
                  key={job.id}
                  onClick={() => openDetailModal(job)}
                  className="flex flex-col rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl transition hover:border-violet-500/30 hover:shadow-violet-500/5 cursor-pointer"
                >
                  {/* Title & Company */}
                  <h3 className="text-lg font-bold text-white line-clamp-2">{job.title}</h3>
                  {job.company_name && (
                    <p className="mt-1 text-sm text-violet-300">{job.company_name}</p>
                  )}

                  {/* Tags */}
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-violet-200">
                      {translateJobType(job.job_type)}
                    </span>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-white/60">
                      {job.location}
                    </span>
                    {job.experience_level && (
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-white/60">
                        {translateExperienceLevel(job.experience_level)}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="mt-4 text-sm text-white/70 line-clamp-3">
                    {job.description}
                  </p>

                  {/* Skills */}
                  {job.skills && job.skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {job.skills.slice(0, 3).map((skill, idx) => (
                        <span
                          key={idx}
                          className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-300"
                        >
                          {skill}
                        </span>
                      ))}
                      {job.skills.length > 3 && (
                        <span className="text-xs text-white/40">+{job.skills.length - 3}</span>
                      )}
                    </div>
                  )}

                  {/* Salary & Deadline */}
                  <div className="mt-auto pt-4 flex items-center justify-between">
                    <span className="text-sm font-semibold text-emerald-400">
                      {formatSalary(job.salary_min, job.salary_max) || t('jobs.negotiable')}
                    </span>
                    {job.application_deadline && (
                      <span className="text-xs text-white/40">
                        {t('jobs.deadline')}: {formatDeadline(job.application_deadline)}
                      </span>
                    )}
                  </div>

                  {/* Application status badge */}
                  {application ? (
                    <div className={`mt-4 w-full rounded-lg px-4 py-2 text-center text-sm font-medium ${getStatusColor(application.status)}`}>
                      {translateApplicationStatus(application.status).toUpperCase()}
                    </div>
                  ) : (
                    <div className="mt-4 w-full rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-center text-sm font-bold text-white">
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
      {detailModalOpen && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/20 bg-gray-900/90 backdrop-blur-xl p-6 shadow-2xl relative">
            {/* Close button */}
            <button
              onClick={() => setDetailModalOpen(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white"
            >
              ✕
            </button>

            {/* Job details */}
            <h2 className="text-2xl font-bold text-white pr-8">{selectedJob.title}</h2>
            {selectedJob.company_name && (
              <p className="mt-1 text-lg text-violet-300">{selectedJob.company_name}</p>
            )}

            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <span className="rounded-full bg-violet-500/20 px-3 py-1 text-violet-200">
                {translateJobType(selectedJob.job_type)}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-white/60">
                {selectedJob.location}
              </span>
              {selectedJob.experience_level && (
                <span className="rounded-full bg-white/10 px-3 py-1 text-white/60">
                  {translateExperienceLevel(selectedJob.experience_level)}
                </span>
              )}
              {selectedJob.vacancies && (
                <span className="rounded-full bg-white/10 px-3 py-1 text-white/60">
                  {t('jobs.openPositions', { count: selectedJob.vacancies })}
                </span>
              )}
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="font-semibold text-white/80">{t('jobs.salary')}</h3>
                <p className="mt-1 text-emerald-400 text-lg font-bold">
                  {formatSalary(selectedJob.salary_min, selectedJob.salary_max) || t('jobs.notDisclosed')}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-white/80">{t('jobs.deadline')}</h3>
                <p className="mt-1 text-white/80">
                  {selectedJob.application_deadline
                    ? formatDeadline(selectedJob.application_deadline)
                    : t('jobs.ongoing')}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="mt-6">
              <h3 className="font-semibold text-white/80">{t('jobs.description')}</h3>
              <p className="mt-2 text-white/70 whitespace-pre-line">{selectedJob.description}</p>
            </div>

            {/* Skills */}
            {selectedJob.skills && selectedJob.skills.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-white/80">{t('jobs.requiredSkills')}</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedJob.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="rounded-full bg-cyan-500/10 px-3 py-1 text-sm text-cyan-300"
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
                // Already applied
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">{t('jobs.yourApplication')}</h3>
                    <span className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(selectedApplication.status)}`}>
                      {translateApplicationStatus(selectedApplication.status).toUpperCase()}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-white/50">
                    {t('jobs.appliedOn', { date: new Date(selectedApplication.applied_at).toLocaleDateString() })}
                  </p>
                  {selectedApplication.cover_letter && (
                    <div className="mt-4 p-4 rounded-lg bg-white/5 border border-white/10">
                      <h4 className="text-sm font-medium text-white/70">{t('jobs.coverLetter')}</h4>
                      <p className="mt-1 text-white/60 text-sm">{selectedApplication.cover_letter}</p>
                    </div>
                  )}
                  <button
                    onClick={handleWithdraw}
                    disabled={withdrawing}
                    className="mt-6 w-full rounded-lg bg-red-500/20 border border-red-500/30 px-4 py-2.5 text-sm font-medium text-red-300 hover:bg-red-500/30 disabled:opacity-50"
                  >
                    {withdrawing ? t('jobs.withdrawing') : t('jobs.withdrawApplication')}
                  </button>
                </div>
              ) : (
                // Apply form
                <div>
                  <h3 className="text-lg font-semibold text-white">{t('jobs.applyForThisPosition')}</h3>

                  <div className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="cover-letter" className="block text-sm text-white/70">
                        {t('jobs.coverLetter')} <span className="text-xs text-white/40">{t('jobs.optional')}</span>
                      </label>
                      <textarea
                        id="cover-letter"
                        rows={4}
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        placeholder={t('jobs.coverLetterPlaceholder')}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 p-3 text-white placeholder:text-white/30 focus:border-violet-500/50 focus:outline-none resize-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="resume-url" className="block text-sm text-white/70">
                        {t('jobs.resumeUrl')} <span className="text-xs text-white/40">{t('jobs.optional')}</span>
                      </label>
                      <input
                        id="resume-url"
                        type="url"
                        value={resumeUrl}
                        onChange={(e) => setResumeUrl(e.target.value)}
                        placeholder={t('jobs.resumeUrlPlaceholder')}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder:text-white/30 focus:border-violet-500/50 focus:outline-none"
                      />
                    </div>

                    {applyMessage && (
                      <p
                        className={`text-sm ${
                          applyMessage.type === 'success' ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {applyMessage.text}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={handleApply}
                    disabled={applying}
                    className="mt-6 w-full rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                  >
                    {applying ? t('jobs.submitting') : t('jobs.submitApplication')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}