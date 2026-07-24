'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  getInternships,
  applyForInternship,
  getMyInternshipApplications,
  withdrawInternshipApplication,
  type Internship,
  type InternshipApplication,
} from '@/services/v2Service';
import { useTranslation } from 'react-i18next';

export default function InternshipsPage() {
  const { t } = useTranslation();

  // --- Data & loading states ---
  const [internships, setInternships] = useState<Internship[]>([]);
  const [applications, setApplications] = useState<InternshipApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Filters ---
  const [searchTitle, setSearchTitle] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterType, setFilterType] = useState('');

  // --- Detail modal ---
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedInternship, setSelectedInternship] = useState<Internship | null>(null);

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

  // --- Fetch internships and my applications on mount ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [internshipsData, myApps] = await Promise.all([
          getInternships(),
          getMyInternshipApplications(),
        ]);

        // Safely extract arrays from possible API envelope objects
        const internshipArray = Array.isArray(internshipsData)
          ? internshipsData
          : internshipsData?.data ?? internshipsData?.results ?? [];
        const applicationsArray = Array.isArray(myApps)
          ? myApps
          : myApps?.data ?? myApps?.applications ?? myApps?.results ?? [];

        setInternships(internshipArray);
        setApplications(applicationsArray);
      } catch (err: any) {
        setError(err?.response?.data?.detail || err?.message || t('internships.loadError'));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [t]);

  // --- Client‑side filtering ---
  const filteredInternships = useMemo(() => {
    return internships.filter((internship) => {
      const matchesTitle = internship.title.toLowerCase().includes(searchTitle.toLowerCase());
      const matchesLocation = filterLocation
        ? internship.location.toLowerCase().includes(filterLocation.toLowerCase())
        : true;
      const matchesType = filterType ? internship.internship_type === filterType : true;
      return matchesTitle && matchesLocation && matchesType;
    });
  }, [internships, searchTitle, filterLocation, filterType]);

  // --- Open detail modal ---
  const openDetailModal = (internship: Internship) => {
    setSelectedInternship(internship);
    setCoverLetter('');
    setResumeUrl('');
    setApplyMessage(null);
    setDetailModalOpen(true);
  };

  // --- Get application for selected internship (if any) ---
  const selectedApplication = useMemo(() => {
    if (!selectedInternship) return null;
    return applications.find((app) => app.internship === selectedInternship.id) || null;
  }, [selectedInternship, applications]);

  // --- Submit application ---
  const handleApply = async () => {
    if (!selectedInternship) return;
    setApplying(true);
    setApplyMessage(null);
    try {
      const result = await applyForInternship({
        internship: selectedInternship.id,
        cover_letter: coverLetter || undefined,
        resume_url: resumeUrl || undefined,
      });
      if (result && result.data) {
        setApplications((prev) => [...prev, result.data]);
      } else {
        const updatedApps = await getMyInternshipApplications();
        // Apply the same extraction logic when refreshing the list
        const updatedArray = Array.isArray(updatedApps)
          ? updatedApps
          : updatedApps?.data ?? updatedApps?.applications ?? updatedApps?.results ?? [];
        setApplications(updatedArray);
      }
      setApplyMessage({
        type: 'success',
        text: t('internships.applicationSuccess'),
      });
    } catch (err: any) {
      const detail = err?.response?.data?.detail || err?.message || t('internships.somethingWentWrong');
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
      await withdrawInternshipApplication(selectedApplication.id);
      setApplications((prev) => prev.filter((app) => app.id !== selectedApplication.id));
      setDetailModalOpen(false);
    } catch (err: any) {
      const detail = err?.response?.data?.detail || err?.message || t('internships.withdrawFailed');
      setApplyMessage({ type: 'error', text: detail });
    } finally {
      setWithdrawing(false);
    }
  };

  // --- Helpers ---
  const formatDeadline = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied': return 'bg-blue-500/20 text-blue-300';
      case 'shortlisted': return 'bg-yellow-500/20 text-yellow-300';
      case 'interview': return 'bg-purple-500/20 text-purple-300';
      case 'selected': return 'bg-green-500/20 text-green-300';
      case 'rejected': return 'bg-red-500/20 text-red-300';
      case 'withdrawn': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-white/10 text-white/60';
    }
  };

  // --- Translate type and status ---
  const translateInternshipType = (type: string) => {
    const keys: Record<string, string> = {
      full_time: 'internships.types.full_time',
      part_time: 'internships.types.part_time',
      remote: 'internships.types.remote',
      hybrid: 'internships.types.hybrid',
    };
    return t(keys[type] || type);
  };

  const translateApplicationStatus = (status: string) => {
    const keys: Record<string, string> = {
      applied: 'internships.status.applied',
      shortlisted: 'internships.status.shortlisted',
      interview: 'internships.status.interview',
      selected: 'internships.status.selected',
      rejected: 'internships.status.rejected',
      withdrawn: 'internships.status.withdrawn',
    };
    return t(keys[status] || status);
  };

  // --- Render ---
  return (
    <div className="min-h-screen bg-[#0B0C10] p-6 text-white">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300">
            {t('internships.title')}
          </h1>
          <p className="mt-2 text-white/70">
            {t('internships.subtitle')}
          </p>
        </div>

        {/* Filters */}
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="search-title" className="mb-1.5 block text-sm font-medium text-white/60">
              {t('internships.search')}
            </label>
            <input
              id="search-title"
              type="text"
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
              placeholder={t('internships.searchPlaceholder')}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/30 backdrop-blur-xl focus:border-violet-500/50 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="filter-location" className="mb-1.5 block text-sm font-medium text-white/60">
              {t('internships.location')}
            </label>
            <input
              id="filter-location"
              type="text"
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              placeholder={t('internships.locationPlaceholder')}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/30 backdrop-blur-xl focus:border-violet-500/50 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="filter-type" className="mb-1.5 block text-sm font-medium text-white/60">
              {t('internships.type')}
            </label>
            <select
              id="filter-type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-white backdrop-blur-xl focus:border-violet-500/50 focus:outline-none"
            >
              <option value="">{t('internships.typeAll')}</option>
              <option value="full_time">{t('internships.types.full_time')}</option>
              <option value="part_time">{t('internships.types.part_time')}</option>
              <option value="remote">{t('internships.types.remote')}</option>
              <option value="hybrid">{t('internships.types.hybrid')}</option>
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
              {t('internships.retry')}
            </button>
          </div>
        )}

        {/* Empty API data */}
        {!loading && !error && internships.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-12 text-center text-white/50">
            <p className="text-lg">{t('internships.noInternships')}</p>
          </div>
        )}

        {/* Filtered empty */}
        {!loading && !error && internships.length > 0 && filteredInternships.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-12 text-center text-white/50">
            <p>{t('internships.noMatchingInternships')}</p>
            <button
              onClick={() => {
                setSearchTitle('');
                setFilterLocation('');
                setFilterType('');
              }}
              className="mt-2 text-sm text-violet-400 underline hover:text-violet-300"
            >
              {t('internships.clearFilters')}
            </button>
          </div>
        )}

        {/* Internship cards */}
        {!loading && !error && filteredInternships.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredInternships.map((internship) => {
              const application = applications.find((app) => app.internship === internship.id);
              return (
                <div
                  key={internship.id}
                  onClick={() => openDetailModal(internship)}
                  className="flex flex-col rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl transition hover:border-violet-500/30 hover:shadow-violet-500/5 cursor-pointer"
                >
                  {/* Title & Company */}
                  <h3 className="text-lg font-bold text-white line-clamp-2">{internship.title}</h3>
                  {internship.company_name && (
                    <p className="mt-1 text-sm text-violet-300">{internship.company_name}</p>
                  )}

                  {/* Tags */}
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-violet-200">
                      {translateInternshipType(internship.internship_type)}
                    </span>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-white/60">
                      {internship.location}
                    </span>
                    {internship.duration_months && (
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-white/60">
                        {t('internships.months', { count: internship.duration_months })}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="mt-4 text-sm text-white/70 line-clamp-3">
                    {internship.description}
                  </p>

                  {/* Skills */}
                  {internship.skills && internship.skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {internship.skills.slice(0, 3).map((skill, idx) => (
                        <span key={idx} className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-300">
                          {skill}
                        </span>
                      ))}
                      {internship.skills.length > 3 && (
                        <span className="text-xs text-white/40">+{internship.skills.length - 3}</span>
                      )}
                    </div>
                  )}

                  {/* Stipend & Deadline */}
                  <div className="mt-auto pt-4 flex items-center justify-between">
                    <span className="text-sm font-semibold text-emerald-400">
                      {internship.stipend > 0 ? `₹${internship.stipend.toLocaleString()}/mo` : t('internships.unpaid')}
                    </span>
                    {internship.application_deadline && (
                      <span className="text-xs text-white/40">
                        DL: {formatDeadline(internship.application_deadline)}
                      </span>
                    )}
                  </div>

                  {/* Status badge or action prompt */}
                  {application ? (
                    <div className={`mt-4 w-full rounded-lg px-4 py-2 text-center text-sm font-medium ${getStatusColor(application.status)}`}>
                      {translateApplicationStatus(application.status).toUpperCase()}
                    </div>
                  ) : (
                    <div className="mt-4 w-full rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-center text-sm font-bold text-white">
                      {t('internships.viewAndApply')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail / Apply / Status Modal */}
      {detailModalOpen && selectedInternship && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/20 bg-gray-900/90 backdrop-blur-xl p-6 shadow-2xl relative">
            {/* Close button */}
            <button
              onClick={() => setDetailModalOpen(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white text-xl leading-none"
            >
              ✕
            </button>

            {/* Internship details */}
            <h2 className="text-2xl font-bold text-white pr-8">{selectedInternship.title}</h2>
            {selectedInternship.company_name && (
              <p className="mt-1 text-lg text-violet-300">{selectedInternship.company_name}</p>
            )}

            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <span className="rounded-full bg-violet-500/20 px-3 py-1 text-violet-200">
                {translateInternshipType(selectedInternship.internship_type)}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-white/60">
                {selectedInternship.location}
              </span>
              {selectedInternship.duration_months && (
                <span className="rounded-full bg-white/10 px-3 py-1 text-white/60">
                  {t('internships.months', { count: selectedInternship.duration_months })}
                </span>
              )}
              {selectedInternship.vacancies && (
                <span className="rounded-full bg-white/10 px-3 py-1 text-white/60">
                  {t('internships.openVacancy', { count: selectedInternship.vacancies })}
                </span>
              )}
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="font-semibold text-white/80">{t('internships.stipend')}</h3>
                <p className="mt-1 text-emerald-400 text-lg font-bold">
                  {selectedInternship.stipend > 0
                    ? `₹${selectedInternship.stipend.toLocaleString()}/mo`
                    : t('internships.unpaid')}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-white/80">{t('internships.applicationDeadline')}</h3>
                <p className="mt-1 text-white/80">
                  {selectedInternship.application_deadline
                    ? formatDeadline(selectedInternship.application_deadline)
                    : t('internships.ongoing')}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="mt-6">
              <h3 className="font-semibold text-white/80">{t('internships.description')}</h3>
              <p className="mt-2 text-white/70 whitespace-pre-line">{selectedInternship.description}</p>
            </div>

            {/* Responsibilities */}
            {selectedInternship.responsibilities && (
              <div className="mt-6">
                <h3 className="font-semibold text-white/80">{t('internships.responsibilities')}</h3>
                <p className="mt-2 text-white/70 whitespace-pre-line">{selectedInternship.responsibilities}</p>
              </div>
            )}

            {/* Requirements */}
            {selectedInternship.requirements && (
              <div className="mt-6">
                <h3 className="font-semibold text-white/80">{t('internships.requirements')}</h3>
                <p className="mt-2 text-white/70 whitespace-pre-line">{selectedInternship.requirements}</p>
              </div>
            )}

            {/* Skills */}
            {selectedInternship.skills && selectedInternship.skills.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-white/80">{t('internships.requiredSkills')}</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedInternship.skills.map((skill, idx) => (
                    <span key={idx} className="rounded-full bg-cyan-500/10 px-3 py-1 text-sm text-cyan-300">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Additional info */}
            <div className="mt-6 flex flex-wrap gap-4 text-sm text-white/60">
              {selectedInternship.ppo_available && (
                <span className="flex items-center gap-1">{t('internships.ppoAvailable')}</span>
              )}
              {selectedInternship.certificate_provided && (
                <span className="flex items-center gap-1">{t('internships.certificateProvided')}</span>
              )}
            </div>

            {/* Application section */}
            <div className="mt-8 border-t border-white/10 pt-6">
              {selectedApplication ? (
                // Already applied
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">{t('internships.yourApplication')}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedApplication.status)}`}>
                      {translateApplicationStatus(selectedApplication.status).toUpperCase()}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-white/50">
                    {t('internships.appliedOn', { date: new Date(selectedApplication.applied_at).toLocaleDateString() })}
                  </p>
                  {selectedApplication.cover_letter && (
                    <div className="mt-4 p-4 rounded-lg bg-white/5 border border-white/10">
                      <h4 className="text-sm font-medium text-white/70">{t('internships.coverLetter')}</h4>
                      <p className="mt-1 text-white/60 text-sm">{selectedApplication.cover_letter}</p>
                    </div>
                  )}
                  <button
                    onClick={handleWithdraw}
                    disabled={withdrawing}
                    className="mt-6 w-full rounded-lg bg-red-500/20 border border-red-500/30 px-4 py-2.5 text-sm font-medium text-red-300 hover:bg-red-500/30 disabled:opacity-50"
                  >
                    {withdrawing ? t('internships.withdrawing') : t('internships.withdrawApplication')}
                  </button>
                </div>
              ) : (
                // Apply form
                <div>
                  <h3 className="text-lg font-semibold text-white">{t('internships.applyForThisInternship')}</h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="cover-letter" className="block text-sm text-white/70">
                        {t('internships.coverLetter')} <span className="text-xs text-white/40">{t('internships.optional')}</span>
                      </label>
                      <textarea
                        id="cover-letter"
                        rows={4}
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        placeholder={t('internships.coverLetterPlaceholder')}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 p-3 text-white placeholder:text-white/30 focus:border-violet-500/50 focus:outline-none resize-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="resume-url" className="block text-sm text-white/70">
                        {t('internships.resumeUrl')} <span className="text-xs text-white/40">{t('internships.optional')}</span>
                      </label>
                      <input
                        id="resume-url"
                        type="url"
                        value={resumeUrl}
                        onChange={(e) => setResumeUrl(e.target.value)}
                        placeholder={t('internships.resumeUrlPlaceholder')}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder:text-white/30 focus:border-violet-500/50 focus:outline-none"
                      />
                    </div>
                    {applyMessage && (
                      <p className={`text-sm ${applyMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                        {applyMessage.text}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleApply}
                    disabled={applying}
                    className="mt-6 w-full rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                  >
                    {applying ? t('internships.submitting') : t('internships.submitApplication')}
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