
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { getStudentDashboard } from '@/services/assessmentService';
import AlertService from '@/services/alertService';

interface DashboardSummary {
  total_assessments: number;
  completed: number;
  passed: number;
  failed: number;
  average_percentage: number;
  highest_percentage: number;
}

interface RecentAssessment {
  attempt_id: number;
  assignment_id: number;
  batch_id: number;
  assignment_status: string;
  percentage: number;
  score: number;
  passed: boolean;
  submitted_at: string | null;
}

interface Performance {
  labels: string[];
  percentages: number[];
  scores: number[];
  pass_status: boolean[];
}

interface McqStats {
  answered: number;
  correct: number;
  incorrect: number;
  accuracy: number;
  total_marks: number;
  obtained_marks: number;
  negative_marks: number;
}

interface ProgrammingStats {
  attempted: number;
  accepted: number;
  partially_accepted: number;
  failed: number;
  acceptance_rate: number;
  average_marks: number;
  total_marks: number;
  passed_test_cases: number;
  total_test_cases: number;
  pass_rate: number;
}

interface TimeStats {
  total_attempts: number;
  average_minutes: number;
  fastest_minutes: number;
  slowest_minutes: number;
  total_learning_hours: number;
}

interface StudentDashboardData {
  summary: DashboardSummary;
  recent_assessments: RecentAssessment[];
  performance: Performance;
  mcq: McqStats;
  programming: ProgrammingStats;
  time: TimeStats;
}

const emptyDashboard: StudentDashboardData = {
  summary: {
    total_assessments: 0,
    completed: 0,
    passed: 0,
    failed: 0,
    average_percentage: 0,
    highest_percentage: 0,
  },
  recent_assessments: [],
  performance: {
    labels: [],
    percentages: [],
    scores: [],
    pass_status: [],
  },
  mcq: {
    answered: 0,
    correct: 0,
    incorrect: 0,
    accuracy: 0,
    total_marks: 0,
    obtained_marks: 0,
    negative_marks: 0,
  },
  programming: {
    attempted: 0,
    accepted: 0,
    partially_accepted: 0,
    failed: 0,
    acceptance_rate: 0,
    average_marks: 0,
    total_marks: 0,
    passed_test_cases: 0,
    total_test_cases: 0,
    pass_rate: 0,
  },
  time: {
    total_attempts: 0,
    average_minutes: 0,
    fastest_minutes: 0,
    slowest_minutes: 0,
    total_learning_hours: 0,
  },
};

function getDashboardData(response: unknown): StudentDashboardData {
  if (!response || typeof response !== 'object') {
    throw new Error('Invalid dashboard response.');
  }

  let data = response as Record<string, unknown>;

  // Unwrap the API envelope: { success, status, message, data }.
  if (data.success === false) {
    throw new Error(
      typeof data.message === 'string'
        ? data.message
        : 'Unable to load assessment dashboard.',
    );
  }

  if (data.data && typeof data.data === 'object') {
    data = data.data as Record<string, unknown>;
  }

  if (!data.summary || !data.performance) {
    throw new Error('Dashboard response is missing required data.');
  }

  return {
    summary: {
      ...emptyDashboard.summary,
      ...(data.summary as Partial<DashboardSummary>),
    },
    recent_assessments: Array.isArray(data.recent_assessments)
      ? (data.recent_assessments as RecentAssessment[])
      : [],
    performance: {
      ...emptyDashboard.performance,
      ...(data.performance as Partial<Performance>),
    },
    mcq: {
      ...emptyDashboard.mcq,
      ...(data.mcq as Partial<McqStats>),
    },
    programming: {
      ...emptyDashboard.programming,
      ...(data.programming as Partial<ProgrammingStats>),
    },
    time: {
      ...emptyDashboard.time,
      ...(data.time as Partial<TimeStats>),
    },
  };
}

function formatPercentage(value: number | null | undefined): string {
  const number = Number(value);
  return Number.isFinite(number) ? `${number.toFixed(0)}%` : '—';
}

function formatDecimal(
  value: number | null | undefined,
  decimals = 1,
): string {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(decimals) : '—';
}

function formatDate(value: string | null): string {
  if (!value) return 'Date unavailable';

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
}

function formatDuration(value: number): string {
  if (!Number.isFinite(value) || value < 0) return '—';

  if (value < 60) return `${formatDecimal(value)} min`;

  const hours = Math.floor(value / 60);
  const minutes = Math.round(value % 60);

  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}

function SummaryCard({
  label,
  value,
  description,
  color,
}: {
  label: string;
  value: string;
  description?: string;
  color: 'violet' | 'emerald' | 'fuchsia' | 'cyan';
}) {
  const styles = {
    violet: 'border-violet-400/30 from-violet-500/20',
    emerald: 'border-emerald-400/30 from-emerald-500/20',
    fuchsia: 'border-fuchsia-400/30 from-fuchsia-500/20',
    cyan: 'border-cyan-400/30 from-cyan-500/20',
  };

  return (
    <div
      className={`rounded-2xl border bg-gradient-to-br ${styles[color]} to-white/[0.03] p-5 shadow-lg backdrop-blur-xl`}
    >
      <p className="text-sm font-medium text-white/70">{label}</p>
      <p className="mt-2 text-3xl font-extrabold text-white">{value}</p>
      {description && (
        <p className="mt-1 text-xs text-white/50">{description}</p>
      )}
    </div>
  );
}

function StatRow({
  label,
  value,
  valueClass = 'text-white/90',
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] py-2 last:border-0">
      <span className="text-sm text-white/65">{label}</span>
      <span className={`text-right text-sm font-semibold ${valueClass}`}>
        {value}
      </span>
    </div>
  );
}

export default function AssessmentDashboard() {
  const { t } = useTranslation();
  const router = useRouter();

  const [dashboard, setDashboard] =
    useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const response = await getStudentDashboard();
      const data = getDashboardData(response);
      setDashboard(data);
    } catch (error: unknown) {
      console.error('Assessment dashboard error:', error);

      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };

      AlertService.error(
        'Dashboard Error',
        err.response?.data?.message ||
          err.message ||
          t(
            'assessmentDashboard.loadError',
            'Unable to load your assessment dashboard.',
          ),
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-violet-400 border-t-transparent" />
          <p className="mt-3 text-sm text-white/70">
            {t('assessmentDashboard.loading', 'Loading your progress...')}
          </p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-5 text-center">
        <span className="text-4xl">📊</span>
        <h2 className="text-xl font-bold text-white">
          {t('assessmentDashboard.noData', 'Dashboard unavailable')}
        </h2>
        <p className="max-w-md text-sm text-white/60">
          We could not retrieve your assessment results. Please try again.
        </p>
        <button
          type="button"
          onClick={() => {
            setRefreshing(true);
            void fetchDashboard();
          }}
          disabled={refreshing}
          className="rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {refreshing ? 'Refreshing...' : 'Try Again'}
        </button>
      </div>
    );
  }

  const { summary, recent_assessments, performance, mcq, programming, time } =
    dashboard;

  const chartItems = performance.labels.map((label, index) => ({
    label,
    percentage: Math.min(
      100,
      Math.max(0, Number(performance.percentages[index]) || 0),
    ),
    score: Number(performance.scores[index]) || 0,
    passed: Boolean(performance.pass_status[index]),
  }));

  const averageScore =
    mcq.obtained_marks + programming.average_marks;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
      {/* Decorative background */}
      <div className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-purple-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-20 h-72 w-72 rounded-full bg-fuchsia-500/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-violet-300">
              KnowMato+
            </p>
            <h1 className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-2xl font-extrabold text-transparent sm:text-3xl lg:text-4xl">
              📊{' '}
              {t('assessmentDashboard.title', 'Assessment Dashboard')}
            </h1>
            <p className="mt-2 text-sm text-white/65">
              {t(
                'assessmentDashboard.subtitle',
                'Understand your progress, celebrate achievements, and find opportunities to improve.',
              )}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setRefreshing(true);
                void fetchDashboard();
              }}
              disabled={refreshing}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-white/10 disabled:opacity-50"
            >
              {refreshing ? 'Refreshing...' : '↻ Refresh'}
            </button>
            <button
              type="button"
              onClick={() =>
                router.push('/student/knowmato-plus/assignments')
              }
              className="rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/20 transition hover:brightness-110"
            >
              {t(
                'assessmentDashboard.viewAssignments',
                'View Assignments',
              )}
              {' →'}
            </button>
          </div>
        </header>

        {/* Summary */}
        <section aria-label="Assessment summary" className="mb-8">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-white">Your progress</h2>
            <p className="mt-1 text-sm text-white/50">
              A quick overview of your assessment achievements.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="Assessments completed"
              value={String(summary.completed)}
              description={`${summary.total_assessments} total recorded`}
              color="violet"
            />
            <SummaryCard
              label="Assessments passed"
              value={`${summary.passed} / ${summary.completed}`}
              description={`${summary.failed} not passed`}
              color="emerald"
            />
            <SummaryCard
              label="Average score"
              value={formatPercentage(summary.average_percentage)}
              description={`Best score: ${formatPercentage(summary.highest_percentage)}`}
              color="fuchsia"
            />
            <SummaryCard
              label="Pass rate"
              value={formatPercentage(
                summary.completed > 0
                  ? (summary.passed / summary.completed) * 100
                  : 0,
              )}
              description="Of completed assessments"
              color="cyan"
            />
          </div>
        </section>

        {/* Performance chart */}
        <section className="mb-8 rounded-2xl border border-white/10 bg-white/[0.05] p-5 shadow-xl backdrop-blur-xl sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-white">
              Performance over time
            </h2>
            <p className="mt-1 text-sm text-white/55">
              Your percentage score for each recorded attempt.
            </p>
          </div>

          {chartItems.length === 0 ? (
            <div className="flex min-h-36 flex-col items-center justify-center text-center">
              <span className="text-3xl">📈</span>
              <p className="mt-3 text-sm text-white/60">
                Complete an assessment to see your performance here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto pb-2">
              <div className="flex min-w-full items-end gap-4 border-b border-white/15 px-2 pt-6">
                {chartItems.map((item, index) => (
                  <div
                    key={`${item.label}-${index}`}
                    className="flex min-w-16 flex-1 flex-col items-center"
                  >
                    <span className="mb-2 text-xs font-bold text-white/80">
                      {formatPercentage(item.percentage)}
                    </span>
                    <div className="flex h-40 w-full items-end justify-center">
                      <div
                        title={`${item.label}: ${formatPercentage(item.percentage)}`}
                        className={`w-full max-w-24 rounded-t-lg transition-all ${
                          item.passed
                            ? 'bg-gradient-to-t from-emerald-600 to-emerald-300'
                            : 'bg-gradient-to-t from-violet-600 to-fuchsia-400'
                        }`}
                        style={{
                          height : `${Math.max(item.percentage > 0 ? 4 : 0, item.percentage)}%`,
                        }}
                      />
                    </div>
                    <span className="my-3 text-center text-xs text-white/60">
                      {item.label}
                    </span>
                    <span className="mb-2 text-[11px] text-white/40">
                      {item.passed ? 'Passed' : 'Review needed'}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-white/55">
                <span>
                  <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm bg-emerald-400" />
                  Passed
                </span>
                <span>
                  <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm bg-fuchsia-400" />
                  Review needed
                </span>
              </div>
            </div>
          )}
        </section>

        {/* Recent assessments */}
        <section className="mb-8">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white">
                Recent assessments
              </h2>
              <p className="mt-1 text-sm text-white/50">
                Your latest recorded results and scores.
              </p>
            </div>
            {recent_assessments.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  router.push(
                    '/student/knowmato-plus/assessment-history',
                  )
                }
                className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-white/10"
              >
                View history →
              </button>
            )}
          </div>

          {recent_assessments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-10 text-center">
              <span className="text-4xl">📝</span>
              <p className="mt-3 font-semibold text-white">
                No results yet
              </p>
              <p className="mt-1 text-sm text-white/55">
                Your completed assessments will appear here.
              </p>
              <button
                type="button"
                onClick={() =>
                  router.push('/student/knowmato-plus/assignments')
                }
                className="mt-5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-2.5 text-sm font-bold text-white"
              >
                Explore assignments
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {recent_assessments.map((item) => (
                <article
                  key={item.attempt_id}
                  className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 shadow-lg backdrop-blur-xl transition hover:border-violet-400/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-violet-300">
                        Assessment #{item.assignment_id}
                      </p>
                      <h3 className="mt-1 text-base font-bold text-white">
                        Attempt #{item.attempt_id}
                      </h3>
                    </div>

                    <span
                      className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${
                        item.passed
                          ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300'
                          : 'border-amber-400/25 bg-amber-400/10 text-amber-300'
                      }`}
                    >
                      {item.passed ? 'Passed' : 'Review needed'}
                    </span>
                  </div>

                  <div className="mt-5 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs text-white/50">Final score</p>
                      <p className="mt-1 text-3xl font-extrabold text-white">
                        {formatPercentage(item.percentage)}
                      </p>
                      <p className="mt-1 text-sm text-white/55">
                        {formatDecimal(item.score)} marks
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-white/45">Submitted</p>
                      <p className="mt-1 text-sm text-white/75">
                        {formatDate(item.submitted_at)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full ${
                        item.passed
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-300'
                          : 'bg-gradient-to-r from-amber-500 to-orange-300'
                      }`}
                      style={{
                        width : `${Math.min(100, Math.max(0, Number(item.percentage) || 0))}%`,
                      }}
                    />
                  </div>

                  <p className="mt-3 text-xs text-white/45">
                    Batch {item.batch_id}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/student/knowmato-plus/assignments/${item.attempt_id}/result`,
                      )
                    }
                    className="mt-4 w-full rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/15 transition hover:brightness-110"
                  >
                    View detailed result →
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Performance details */}
        <section className="grid gap-6 lg:grid-cols-2">
          {/* MCQ */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 shadow-xl backdrop-blur-xl sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-fuchsia-400/15 text-xl">
                📝
              </div>
              <div>
                <h2 className="font-bold text-white">MCQ performance</h2>
                <p className="text-xs text-white/50">
                  Your multiple-choice question results
                </p>
              </div>
            </div>

            <StatRow label="Questions answered" value={String(mcq.answered)} />
            <StatRow
              label="Correct answers"
              value={String(mcq.correct)}
              valueClass="text-emerald-300"
            />
            <StatRow
              label="Incorrect answers"
              value={String(mcq.incorrect)}
              valueClass="text-red-300"
            />
            <StatRow
              label="Accuracy"
              value={formatPercentage(mcq.accuracy)}
            />
            <StatRow
              label="Marks obtained"
              value={`${formatDecimal(mcq.obtained_marks)} / ${formatDecimal(mcq.total_marks)}`}
              valueClass="text-fuchsia-300"
            />
            <StatRow
              label="Negative marks"
              value={formatDecimal(mcq.negative_marks)}
              valueClass="text-amber-300"
            />

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-300"
                style={{
                  width : `${Math.min(100, Math.max(0, Number(mcq.accuracy) || 0))}%`,
                }}
              />
            </div>
          </div>

          {/* Programming */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 shadow-xl backdrop-blur-xl sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/15 text-xl">
                💻
              </div>
              <div>
                <h2 className="font-bold text-white">
                  Programming performance
                </h2>
                <p className="text-xs text-white/50">
                  Your code execution and test case results
                </p>
              </div>
            </div>

            <StatRow
              label="Programs attempted"
              value={String(programming.attempted)}
            />
            <StatRow
              label="Accepted"
              value={String(programming.accepted)}
              valueClass="text-emerald-300"
            />
            <StatRow
              label="Partially accepted"
              value={String(programming.partially_accepted)}
              valueClass="text-amber-300"
            />
            <StatRow
              label="Failed"
              value={String(programming.failed)}
              valueClass="text-red-300"
            />
            <StatRow
              label="Acceptance rate"
              value={formatPercentage(programming.acceptance_rate)}
            />
            <StatRow
              label="Test cases passed"
              value={`${programming.passed_test_cases} / ${programming.total_test_cases}`}
              valueClass="text-cyan-300"
            />
            <StatRow
              label="Test case pass rate"
              value={formatPercentage(programming.pass_rate)}
            />
            <StatRow
              label="Average marks / available marks"
              value={`${formatDecimal(programming.average_marks)} / ${formatDecimal(programming.total_marks)}`}
            />

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-300"
                style={{
                  width : `${Math.min(100, Math.max(0, Number(programming.pass_rate) || 0))}%`,
                }}
              />
            </div>
          </div>
        </section>

        {/* Time statistics */}
        {time.total_attempts > 0 && (
          <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.05] p-5 shadow-xl backdrop-blur-xl sm:p-6">
            <div className="mb-5">
              <h2 className="font-bold text-white">Learning activity</h2>
              <p className="mt-1 text-sm text-white/50">
                Time spent working on your assessments.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-5">
              <div>
                <p className="text-xs text-white/50">Recorded attempts</p>
                <p className="mt-2 text-xl font-bold text-white">
                  {time.total_attempts}
                </p>
              </div>
              <div>
                <p className="text-xs text-white/50">Average duration</p>
                <p className="mt-2 text-xl font-bold text-violet-300">
                  {formatDuration(time.average_minutes)}
                </p>
              </div>
              <div>
                <p className="text-xs text-white/50">Shortest duration</p>
                <p className="mt-2 text-xl font-bold text-emerald-300">
                  {formatDuration(time.fastest_minutes)}
                </p>
              </div>
              <div>
                <p className="text-xs text-white/50">Longest duration</p>
                <p className="mt-2 text-xl font-bold text-fuchsia-300">
                  {formatDuration(time.slowest_minutes)}
                </p>
              </div>
              <div>
                <p className="text-xs text-white/50">Total learning time</p>
                <p className="mt-2 text-xl font-bold text-cyan-300">
                  {formatDecimal(time.total_learning_hours)} hrs
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
