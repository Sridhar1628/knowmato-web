
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

import AlertService from '@/services/alertService';
import {
  getAssignments,
  type Assignment,
  startAssessment,
} from '@/services/assessmentService';

const TABS_KEYS = ['all', 'active', 'expired'] as const;

type AttemptStatus =
  | 'in_progress'
  | 'submitted'
  | 'expired'
  | 'abandoned'
  | 'completed'
  | 'graded';

function extractArray<T>(response: unknown): T[] {
  if (Array.isArray(response)) return response as T[];

  if (!response || typeof response !== 'object') return [];

  const result = response as Record<string, unknown>;

  if (Array.isArray(result.data)) return result.data as T[];
  if (Array.isArray(result.results)) return result.results as T[];

  // Support API clients that return a nested response envelope.
  if (result.data && typeof result.data === 'object') {
    const nested = result.data as Record<string, unknown>;

    if (Array.isArray(nested.data)) return nested.data as T[];
    if (Array.isArray(nested.results)) return nested.results as T[];
  }

  return [];
}

function getExpiryDate(value: string | null | undefined): Date | null {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isAssignmentExpired(
  assignment: Assignment,
  now: Date,
): boolean {
  if (assignment.status?.toLowerCase() === 'expired') return true;

  const expiryDate = getExpiryDate(assignment.date_of_expiry);

  return expiryDate !== null && expiryDate < now;
}

export default function AssignmentsListPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] =
    useState<(typeof TABS_KEYS)[number]>('all');
  const [startingId, setStartingId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const response = await getAssignments();
        const assignmentsData = extractArray<Assignment>(response);

        const sorted = [...assignmentsData].sort((a, b) => {
          const dateA = getExpiryDate(a.date_of_expiry);
          const dateB = getExpiryDate(b.date_of_expiry);

          if (!dateA && !dateB) return a.id - b.id;
          if (!dateA) return 1;
          if (!dateB) return -1;

          return dateA.getTime() - dateB.getTime();
        });

        if (!cancelled) setAssignments(sorted);
      } catch (error: unknown) {
        console.error('Error fetching assignments:', error);

        if (!cancelled) {
          const err = error as {
            response?: { data?: { message?: string } };
            message?: string;
          };

          AlertService.error(
            'Unable to Load Assignments',
            err.response?.data?.message ||
              err.message ||
              t('assignments.loadError', 'Could not load assignments.'),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchData();

    return () => {
      cancelled = true;
    };
  }, [t]);

  const filteredAssignments = useMemo(() => {
    const now = new Date();

    return assignments.filter((assignment) => {
      const expired = isAssignmentExpired(assignment, now);

      if (activeTab === 'active') return !expired;
      if (activeTab === 'expired') return expired;

      return true;
    });
  }, [assignments, activeTab]);

  const handleStart = async (assignmentId: number) => {
    if (startingId !== null) return;

    setStartingId(assignmentId);

    try {
      const response: unknown = await startAssessment(assignmentId);

      const envelope =
        response && typeof response === 'object'
          ? (response as Record<string, unknown>)
          : {};

      const attempt =
        envelope.data && typeof envelope.data === 'object'
          ? (envelope.data as Record<string, unknown>)
          : envelope;

      const attemptId = Number(attempt.id);

      if (
        envelope.success === false ||
        !Number.isSafeInteger(attemptId) ||
        attemptId <= 0
      ) {
        throw new Error(
          String(
            envelope.message ||
              t('assignments.startError', 'Could not start assessment.'),
          ),
        );
      }

      router.push(
        `/student/knowmato-plus/assignments/${attemptId}/assessment`,
      );
    } catch (error: unknown) {
      console.error('Start assessment error:', error);

      const err = error as {
        response?: {
          data?: {
            message?: string;
            detail?: string;
            error?: string;
          };
        };
        message?: string;
      };

      AlertService.error(
        'Unable to Start Assessment',
        err.response?.data?.message ||
          err.response?.data?.detail ||
          err.response?.data?.error ||
          err.message ||
          t('assignments.startError', 'Could not start assessment.'),
      );
    } finally {
      setStartingId(null);
    }
  };

  const handleViewResult = (attemptId: number | undefined) => {
    if (!attemptId || !Number.isSafeInteger(attemptId)) {
      AlertService.error(
        'Invalid Attempt',
        'Assessment attempt could not be found.',
      );
      return;
    }

    router.push(
      `/student/knowmato-plus/assignments/${attemptId}/result`,
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-violet-400 border-t-transparent" />
          <p className="mt-2 text-sm text-white/70">
            {t('common.loading')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
      {/* Animated background */}
      <div className="absolute -left-20 top-0 h-72 w-72 animate-blob rounded-full bg-purple-500/20 blur-3xl filter mix-blend-multiply" />
      <div className="animation-delay-2000 absolute -right-20 top-0 h-72 w-72 animate-blob rounded-full bg-fuchsia-500/20 blur-3xl filter mix-blend-multiply" />
      <div className="animation-delay-4000 absolute -bottom-20 left-40 h-72 w-72 animate-blob rounded-full bg-cyan-500/20 blur-3xl filter mix-blend-multiply" />

      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-2xl font-bold leading-tight text-transparent md:text-3xl lg:text-4xl">
            📋 {t('assignments.title')}
          </h1>
          <p className="mt-2 text-sm text-white/70">
            {t('assignments.subtitle')}
          </p>
        </div>

        {/* Filter tabs */}
        <div className="mb-6 flex gap-2">
          {TABS_KEYS.map((tab) => (
            <button
              key={tab}
              type="button"
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

        {/* Assignment cards */}
        {filteredAssignments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-12 text-center backdrop-blur-xl">
            <div className="text-4xl">📭</div>
            <p className="mt-4 text-sm text-white/50">
              {t('assignments.empty', {
                tab: activeTab === 'all' ? '' : activeTab,
              })}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredAssignments.map((assignment) => {
              const now = new Date();
              const isExpired = isAssignmentExpired(assignment, now);
              const isStarting = startingId === assignment.id;

              const attempt = assignment.my_attempt;
              const attemptId = attempt?.id;
              const attemptStatus = String(
                attempt?.status ?? '',
              ).toLowerCase() as AttemptStatus;

              const isSubmitted = [
                'submitted',
                'completed',
                'graded',
              ].includes(attemptStatus);

              const hasAttempt = !!attemptId;
              const isInProgress =
                hasAttempt && attemptStatus === 'in_progress';

              const canViewResult =
                hasAttempt &&
                (isSubmitted || attemptStatus === 'expired');

              return (
                <div
                  key={assignment.id}
                  className="group relative flex flex-col rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-violet-400/40 hover:shadow-xl"
                >
                  {/* Status badges */}
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <span className="rounded-full border border-violet-400/30 bg-violet-400/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-violet-300">
                      {t('assignments.batchLabel', {
                        batch: assignment.batch,
                      })}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-bold ${
                        isExpired
                          ? 'border border-red-400/30 bg-red-400/20 text-red-300'
                          : 'border border-emerald-400/30 bg-emerald-400/20 text-emerald-300'
                      }`}
                    >
                      {isExpired
                        ? t('assignments.statusExpired')
                        : t('assignments.statusActive')}
                    </span>
                  </div>

                  {/* Assignment title */}
                  <h3 className="text-lg font-bold text-white">
                    {t('assignments.idLabel', { id: assignment.id })}
                  </h3>

                  {/* Total score */}
                  <p className="mt-1 text-sm text-white/50">
                    {t('assignments.totalScore', {
                      score:
                        assignment.total_marks ||
                        t('assignments.notAvailable'),
                    })}
                  </p>

                  {/* Deadline */}
                  <div className="mt-3 flex items-center gap-1 text-xs text-white/40">
                    <span>⏳</span>
                    <span>
                      {getExpiryDate(assignment.date_of_expiry)
                        ?.toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        }) ?? t('assignments.notAvailable')}

                      {assignment.time &&
                        ` ${t('assignments.atTime')} ${assignment.time}`}
                    </span>
                  </div>

                  <div className="flex-1" />

                  {/* Action button */}
                  {isExpired ? (
                    canViewResult ? (
                      <button
                        type="button"
                        onClick={() => handleViewResult(attemptId)}
                        className="mt-4 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/25 transition-all hover:from-cyan-600 hover:to-blue-600"
                      >
                        {t('assignments.viewResult', 'View Result')}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            `/student/knowmato-plus/assignments/${assignment.id}/review/`,
                          )
                        }
                        className="mt-4 w-full rounded-xl border border-white/20 bg-white/10 py-2.5 text-sm font-bold text-white/70 transition-all hover:bg-white/20"
                      >
                        {t('assignments.viewHistory', 'View History')}
                      </button>
                    )
                  ) : canViewResult ? (
                    <button
                      type="button"
                      onClick={() => handleViewResult(attemptId)}
                      className="mt-4 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/25 transition-all hover:from-cyan-600 hover:to-blue-600"
                    >
                      {t('assignments.viewResult', 'View Result')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleStart(assignment.id)}
                      disabled={startingId !== null}
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
                      ) : isInProgress ? (
                        t(
                          'assignments.continueAssessment',
                          'Continue Assessment',
                        )
                      ) : attemptStatus === 'abandoned' ? (
                        t('assignments.attemptNow', 'Attempt Now')
                      ) : (
                        t('assignments.attemptNow', 'Attempt Now')
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
