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

export default function JobsPage() {
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
        const [jobsData, appsData] = await Promise.all([
          getJobs(),
          getMyJobApplications(),
        ]);
        setJobs(jobsData);
        setApplications(appsData);
      } catch (err: any) {
        setError(err?.response?.data?.detail || err?.message || 'Failed to load data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
      // The response may contain the new application object; we'll add it to state
      if (result && result.data) {
        setApplications((prev) => [...prev, result.data]);
      } else {
        // If the API doesn't return the application, re‑fetch
        const updatedApps = await getMyJobApplications();
        setApplications(updatedApps);
      }
      setApplyMessage({
        type: 'success',
        text: 'Application submitted successfully!',
      });
      // Keep modal open to show success; user can close manually
    } catch (err: any) {
      const detail = err?.response?.data?.detail || err?.message || 'Something went wrong';
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
      // Remove the withdrawn application from local state
      setApplications((prev) => prev.filter((app) => app.id !== selectedApplication.id));
      // Optionally show a success toast
      setDetailModalOpen(false); // or keep open and show apply again
    } catch (err: any) {
      const detail = err?.response?.data?.detail || err?.message || 'Withdraw failed';
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

  // --- Render ---
  return (
    <div className="min-h-screen bg-[#0B0C10] p-6 text-white">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300">
            Job Openings
          </h1>
          <p className="mt-2 text-white/70">
            Explore the latest job opportunities tailored for you.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="search-title" className="mb-1.5 block text-sm font-medium text-white/60">
              Search
            </label>
            <input
              id="search-title"
              type="text"
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
              placeholder="Job title..."
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/30 backdrop-blur-xl focus:border-violet-500/50 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="filter-location" className="mb-1.5 block text-sm font-medium text-white/60">
              Location
            </label>
            <input
              id="filter-location"
              type="text"
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              placeholder="City or remote..."
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/30 backdrop-blur-xl focus:border-violet-500/50 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="filter-type" className="mb-1.5 block text-sm font-medium text-white/60">
              Type
            </label>
            <select
              id="filter-type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white backdrop-blur-xl focus:border-violet-500/50 focus:outline-none"
            >
              <option value="">All</option>
              <option value="full_time">Full-time</option>
              <option value="part_time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="remote">Remote</option>
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
              Retry
            </button>
          </div>
        )}

        {/* Empty API data */}
        {!loading && !error && jobs.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-12 text-center text-white/50">
            <p className="text-lg">No job openings available at the moment.</p>
          </div>
        )}

        {/* Filtered empty */}
        {!loading && !error && jobs.length > 0 && filteredJobs.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-12 text-center text-white/50">
            <p>No jobs match your filters.</p>
            <button
              onClick={() => {
                setSearchTitle('');
                setFilterLocation('');
                setFilterType('');
              }}
              className="mt-2 text-sm text-violet-400 underline hover:text-violet-300"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Job cards */}
        {!loading && !error && filteredJobs.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredJobs.map((job) => {
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
                    <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-violet-200 capitalize">
                      {job.job_type.replace('_', ' ')}
                    </span>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-white/60">
                      {job.location}
                    </span>
                    {job.experience_level && (
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-white/60 capitalize">
                        {job.experience_level.replace('_', ' ')}
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
                      {formatSalary(job.salary_min, job.salary_max) || 'Negotiable'}
                    </span>
                    {job.application_deadline && (
                      <span className="text-xs text-white/40">
                        Deadline: {formatDeadline(job.application_deadline)}
                      </span>
                    )}
                  </div>

                  {/* Application status badge (instead of Apply button) */}
                  {application ? (
                    <div className="mt-4 w-full rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 text-center text-sm font-medium text-emerald-300">
                      {application.status.replace('_', ' ').toUpperCase()}
                    </div>
                  ) : (
                    <div className="mt-4 w-full rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-center text-sm font-bold text-white">
                      View & Apply
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
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/20 bg-gray-900/90 backdrop-blur-xl p-6 shadow-2xl">
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
              <span className="rounded-full bg-violet-500/20 px-3 py-1 text-violet-200 capitalize">
                {selectedJob.job_type.replace('_', ' ')}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-white/60">
                {selectedJob.location}
              </span>
              {selectedJob.experience_level && (
                <span className="rounded-full bg-white/10 px-3 py-1 text-white/60 capitalize">
                  {selectedJob.experience_level.replace('_', ' ')}
                </span>
              )}
              {selectedJob.vacancies && (
                <span className="rounded-full bg-white/10 px-3 py-1 text-white/60">
                  {selectedJob.vacancies} open position{selectedJob.vacancies > 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="font-semibold text-white/80">Salary</h3>
                <p className="mt-1 text-emerald-400 text-lg font-bold">
                  {formatSalary(selectedJob.salary_min, selectedJob.salary_max) || 'Not disclosed'}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-white/80">Deadline</h3>
                <p className="mt-1 text-white/80">
                  {selectedJob.application_deadline
                    ? formatDeadline(selectedJob.application_deadline)
                    : 'Ongoing'}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="mt-6">
              <h3 className="font-semibold text-white/80">Description</h3>
              <p className="mt-2 text-white/70 whitespace-pre-line">{selectedJob.description}</p>
            </div>

            {/* Skills */}
            {selectedJob.skills && selectedJob.skills.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-white/80">Required Skills</h3>
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
                    <h3 className="text-lg font-semibold text-white">Your Application</h3>
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-medium ${
                        selectedApplication.status === 'applied'
                          ? 'bg-blue-500/20 text-blue-300'
                          : selectedApplication.status === 'shortlisted'
                          ? 'bg-yellow-500/20 text-yellow-300'
                          : selectedApplication.status === 'interview'
                          ? 'bg-purple-500/20 text-purple-300'
                          : selectedApplication.status === 'offered'
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}
                    >
                      {selectedApplication.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-white/50">
                    Applied on {new Date(selectedApplication.applied_at).toLocaleDateString()}
                  </p>
                  {selectedApplication.cover_letter && (
                    <div className="mt-4 p-4 rounded-lg bg-white/5 border border-white/10">
                      <h4 className="text-sm font-medium text-white/70">Cover Letter</h4>
                      <p className="mt-1 text-white/60 text-sm">{selectedApplication.cover_letter}</p>
                    </div>
                  )}
                  <button
                    onClick={handleWithdraw}
                    disabled={withdrawing}
                    className="mt-6 w-full rounded-lg bg-red-500/20 border border-red-500/30 px-4 py-2.5 text-sm font-medium text-red-300 hover:bg-red-500/30 disabled:opacity-50"
                  >
                    {withdrawing ? 'Withdrawing...' : 'Withdraw Application'}
                  </button>
                </div>
              ) : (
                // Apply form
                <div>
                  <h3 className="text-lg font-semibold text-white">Apply for this position</h3>

                  <div className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="cover-letter" className="block text-sm text-white/70">
                        Cover Letter <span className="text-xs text-white/40">(optional)</span>
                      </label>
                      <textarea
                        id="cover-letter"
                        rows={4}
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        placeholder="Tell us why you are a great fit..."
                        className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 p-3 text-white placeholder:text-white/30 focus:border-violet-500/50 focus:outline-none resize-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="resume-url" className="block text-sm text-white/70">
                        Resume URL <span className="text-xs text-white/40">(optional)</span>
                      </label>
                      <input
                        id="resume-url"
                        type="url"
                        value={resumeUrl}
                        onChange={(e) => setResumeUrl(e.target.value)}
                        placeholder="https://drive.google.com/..."
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
                    {applying ? 'Submitting...' : 'Submit Application'}
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