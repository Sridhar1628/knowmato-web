'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { getAssignments, Assignment } from '@/services/assessmentService';
import { useTranslation } from 'react-i18next'; // ✅ added

// Status filter tabs – labels moved to translation
const TABS_KEYS = ['all', 'active', 'expired'] as const;

export default function AssignmentsListPage() {
  const { t } = useTranslation(); // ✅ added
  const router = useRouter();

  // ─── state ────────────────────────────────────────────────
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');

  // ─── fetch assignments ───────────────────────────────────
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const data = await getAssignments();
        // sort by expiry – nearest deadline first
        const sorted = (data || []).sort(
          (a, b) =>
            new Date(a.date_of_expiry).getTime() -
            new Date(b.date_of_expiry).getTime()
        );
        setAssignments(sorted);
      } catch (error) {
        console.error('Error fetching assignments:', error);
        toast.error(t('assignments.loadError') || 'Could not load assignments.');
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, [t]);

  // ─── filter logic ────────────────────────────────────────
  const filteredAssignments = useMemo(() => {
    const now = new Date();
    return assignments.filter((a) => {
      const isExpired =
        a.status?.toLowerCase() === 'expired' ||
        new Date(a.date_of_expiry) < now;
      if (activeTab === 'active') return !isExpired;
      if (activeTab === 'expired') return isExpired;
      return true; // 'all'
    });
  }, [assignments, activeTab]);

  // ─── loading skeleton ────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-violet-400 border-t-transparent" />
          <p className="mt-2 text-sm text-white/70">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // ─── main render ────────────────────────────────────────
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
      {/* Animated background blobs */}
      <div className="absolute -left-20 top-0 h-72 w-72 animate-blob rounded-full bg-purple-500/20 blur-3xl filter mix-blend-multiply" />
      <div className="animation-delay-2000 absolute -right-20 top-0 h-72 w-72 animate-blob rounded-full bg-fuchsia-500/20 blur-3xl filter mix-blend-multiply" />
      <div className="animation-delay-4000 absolute -bottom-20 left-40 h-72 w-72 animate-blob rounded-full bg-cyan-500/20 blur-3xl filter mix-blend-multiply" />

      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold leading-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 md:text-3xl lg:text-4xl">
            📋 {t('assignments.title')}
          </h1>
          <p className="mt-2 text-sm text-white/70">
            {t('assignments.subtitle')}
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2">
          {TABS_KEYS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25'
                  : 'border border-white/20 text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              {t(`assignments.tabs.${tab}`)}
            </button>
          ))}
        </div>

        {/* Assignments Grid */}
        {filteredAssignments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 backdrop-blur-xl p-12 text-center">
            <div className="text-4xl">📭</div>
            <p className="mt-4 text-sm text-white/50">
              {t('assignments.empty', { tab: activeTab === 'all' ? '' : activeTab })}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredAssignments.map((assignment) => {
              const isExpired =
                assignment.status?.toLowerCase() === 'expired' ||
                new Date(assignment.date_of_expiry) < new Date();
              return (
                <div
                  key={assignment.id}
                  className="group relative flex flex-col rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-lg transition-all hover:-translate-y-1 hover:border-violet-400/40 hover:shadow-xl"
                >
                  {/* Status badge */}
                  <div className="mb-3 flex items-start justify-between">
                    <span className="rounded-full bg-violet-400/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-violet-300 border border-violet-400/30">
                      {t('assignments.batchLabel', { batch: assignment.batch })}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-bold ${
                        isExpired
                          ? 'bg-red-400/20 text-red-300 border border-red-400/30'
                          : 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                      }`}
                    >
                      {isExpired ? t('assignments.statusExpired') : t('assignments.statusActive')}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-white">
                    {t('assignments.idLabel', { id: assignment.id })}
                  </h3>

                  {/* Score */}
                  <p className="mt-1 text-sm text-white/50">
                    {t('assignments.totalScore', { score: assignment.total_score || t('assignments.notAvailable') })}
                  </p>

                  {/* Deadline */}
                  <div className="mt-3 flex items-center gap-1 text-xs text-white/40">
                    <span>⏳</span>
                    <span>
                      {new Date(assignment.date_of_expiry).toLocaleDateString(
                        undefined,
                        { month: 'short', day: 'numeric', year: 'numeric' }
                      )}
                      {assignment.time && ` ${t('assignments.atTime')} ${assignment.time}`}
                    </span>
                  </div>

                  {/* Spacer to push button to bottom */}
                  <div className="flex-1" />

                  {/* Action */}
                  <button
                    onClick={() => {
                      if (!isExpired) {
                        router.push(`/student/knowmato-plus/assignments/${assignment.id}`);
                      }
                    }}
                    disabled={isExpired}
                    className={`mt-4 w-full rounded-xl py-2.5 text-sm font-bold transition-all ${
                      isExpired
                        ? 'cursor-not-allowed bg-white/10 text-white/30'
                        : 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25 hover:from-violet-600 hover:to-fuchsia-600'
                    }`}
                  >
                    {isExpired ? t('assignments.expiredButton') : t('assignments.attemptNow')}
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