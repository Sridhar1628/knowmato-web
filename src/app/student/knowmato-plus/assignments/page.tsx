'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  getAssignments,
  Assignment,
  startAssessment,
  getStudentDashboard,
} from '@/services/assessmentService';
import { useTranslation } from 'react-i18next';

// Status filter tabs
const TABS_KEYS = ['all', 'active', 'expired'] as const;

// Helper to safely extract an array from any API response shape
function extractArray<T = any>(response: any): T[] {
  if (Array.isArray(response)) return response;
  if (response?.data && Array.isArray(response.data)) return response.data;
  if (response?.results && Array.isArray(response.results)) return response.results;
  return [];
}

export default function AssignmentsListPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [startingId, setStartingId] = useState<number | null>(null);
  const [attemptedAssignments, setAttemptedAssignments] = useState<Record<number, number>>({}); // assignmentId -> attemptId

  // Fetch assignments and attempted status
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assignmentsRes, dashboardRes] = await Promise.all([
          getAssignments(),
          getStudentDashboard(),
        ]);

        const assignmentsData = extractArray<Assignment>(assignmentsRes);

        // Sort by expiry date – nearest deadline first
        const sorted = [...assignmentsData].sort(
          (a, b) =>
            new Date(a.date_of_expiry).getTime() -
            new Date(b.date_of_expiry).getTime()
        );
        setAssignments(sorted);

        // Extract recent_assessments from dashboard to map assignment IDs to attempt IDs
        const dashboard = dashboardRes?.data ?? dashboardRes;
        const recent = dashboard?.recent_assessments ?? [];
        const attemptMap: Record<number, number> = {};
        if (Array.isArray(recent)) {
          recent.forEach((item: any) => {
            if (item.assignment_id && item.attempt_id) {
              // If multiple attempts, keep the latest? For now, any attempt marks it as attempted
              if (!attemptMap[item.assignment_id]) {
                attemptMap[item.assignment_id] = item.attempt_id;
              }
            }
          });
        }
        setAttemptedAssignments(attemptMap);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error(t('assignments.loadError') || 'Could not load assignments.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [t]);

  // Filter logic
  const filteredAssignments = useMemo(() => {
    const now = new Date();
    return assignments.filter((a) => {
      const isExpired =
        a.status?.toLowerCase() === 'expired' ||
        new Date(a.date_of_expiry) < now;
      if (activeTab === 'active') return !isExpired;
      if (activeTab === 'expired') return isExpired;
      return true; // all
    });
  }, [assignments, activeTab]);

  // Start assessment via new engine
  const handleStart = async (assignmentId: number) => {
    setStartingId(assignmentId);
    try {
      const response = await startAssessment(assignmentId);
      router.push(`/student/knowmato-plus/assignments/${response.data.id}`);
    } catch (error: any) {
      console.error('Start assessment error:', error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        t('assignments.startError', 'Could not start assessment.');
      toast.error(errorMessage);
    } finally {
      setStartingId(null);
    }
  };

  // View result handler
  const handleViewResult = (attemptId: number) => {
    router.push(`/student/knowmato-plus/assignments/${attemptId}/result`);
  };

  // Loading skeleton
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
              const isStarting = startingId === assignment.id;
              const isAttempted = !!attemptedAssignments[assignment.id];
              const attemptId = attemptedAssignments[assignment.id];

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
                      {isExpired
                        ? t('assignments.statusExpired')
                        : t('assignments.statusActive')}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-white">
                    {t('assignments.idLabel', { id: assignment.id })}
                  </h3>

                  {/* Total score */}
                  <p className="mt-1 text-sm text-white/50">
                    {t('assignments.totalScore', {
                      score: assignment.total_marks || t('assignments.notAvailable'),
                    })}
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

                  <div className="flex-1" />

                  {/* Action button */}
                  {isExpired ? (
                    isAttempted && attemptId ? (
                      <button
                        onClick={() => handleViewResult(attemptId)}
                        className="mt-4 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-600 hover:to-blue-600 transition-all"
                      >
                        {t('assignments.viewResult', 'View Result')}
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          router.push(`/student/knowmato-plus/assignments/${assignment.id}/review/`)
                        }
                        className="mt-4 w-full rounded-xl border border-white/20 bg-white/10 py-2.5 text-sm font-bold text-white/70 hover:bg-white/20 transition-all"
                      >
                        {t('assignments.viewHistory', 'View History')}
                      </button>
                    )
                  ) : isAttempted ? (
                    <button
                      onClick={() => handleViewResult(attemptId)}
                      className="mt-4 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-600 hover:to-blue-600 transition-all"
                    >
                      {t('assignments.viewResult', 'View Result')}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStart(assignment.id)}
                      disabled={isStarting}
                      className={`mt-4 w-full rounded-xl py-2.5 text-sm font-bold transition-all ${
                        isStarting
                          ? 'cursor-wait bg-violet-500/50 text-white/80'
                          : 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25 hover:from-violet-600 hover:to-fuchsia-600'
                      }`}
                    >
                      {isStarting ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          {t('assignments.starting')}
                        </span>
                      ) : (
                        t('assignments.attemptNow')
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}