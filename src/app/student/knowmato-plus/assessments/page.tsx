'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { getStudentDashboard } from '@/services/assessmentService';

// ---------- Type definitions for the new dashboard response ----------
export interface DashboardSummary {
  total_assessments: number;
  completed: number;
  passed: number;
  failed: number;
  average_percentage: number;
  highest_percentage: number;
}

export interface RecentAssessment {
  id: number;
  assignment_id: number;
  assignment_title: string;
  status: string;
  submitted_at: string | null;
  percentage: number;
  is_passed: boolean;
}

export interface Performance {
  labels: string[];
  percentages: number[];
  scores: number[];
  pass_status: boolean[];
}

export interface McqStats {
  answered: number;
  correct: number;
  incorrect: number;
  accuracy: number;
  total_marks: number;
  obtained_marks: number;
  negative_marks: number;
}

export interface ProgrammingStats {
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

export interface TimeStats {
  total_attempts: number;
  average_minutes: number;
  fastest_minutes: number;
  slowest_minutes: number;
  total_learning_hours: number;
}

export interface StudentDashboardData {
  summary: DashboardSummary;
  recent_assessments: RecentAssessment[];
  performance: Performance;
  mcq: McqStats;
  programming: ProgrammingStats;
  time: TimeStats;
}

// ----------------------------------------------------------------------
// Helper: format a decimal number as percentage
// ----------------------------------------------------------------------
const formatPercentage = (val: number | null | undefined): string => {
  if (val === null || val === undefined) return '—';
  return `${Number(val).toFixed(0)}%`;
};

const formatDecimal = (val: number, decimals = 1): string => {
  return Number(val).toFixed(decimals);
};

// ----------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------
export default function AssessmentDashboard() {
  const { t } = useTranslation();
  const router = useRouter();

  const [dashboard, setDashboard] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const response = await getStudentDashboard();
      // Safely extract the data: the service might return { data: { ... } } or directly the payload.
      const data = response?.data ?? response;
      setDashboard(data as StudentDashboardData);
    } catch (error: any) {
      console.error('Dashboard fetch error:', error);
      toast.error(
        error?.response?.data?.message ??
          t('assessmentDashboard.loadError', 'Failed to load dashboard')
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // ─── loading skeleton ────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-violet-400 border-t-transparent" />
          <p className="mt-2 text-sm text-white/70">
            {t('assessmentDashboard.loading', 'Loading dashboard…')}
          </p>
        </div>
      </div>
    );
  }

  // In case of no data (should not happen if API is okay)
  if (!dashboard) {
    return (
      <div className="flex h-64 items-center justify-center text-white/60">
        {t('assessmentDashboard.noData', 'No dashboard data available.')}
      </div>
    );
  }

  const { summary, recent_assessments, performance, mcq, programming, time } = dashboard;

  // ─── main render ────────────────────────────────────────
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
      {/* Animated background blobs */}
      <div className="absolute -left-20 top-0 h-72 w-72 animate-blob rounded-full bg-purple-500/20 blur-3xl filter mix-blend-multiply" />
      <div className="animation-delay-2000 absolute -right-20 top-0 h-72 w-72 animate-blob rounded-full bg-fuchsia-500/20 blur-3xl filter mix-blend-multiply" />
      <div className="animation-delay-4000 absolute -bottom-20 left-40 h-72 w-72 animate-blob rounded-full bg-cyan-500/20 blur-3xl filter mix-blend-multiply" />

      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold leading-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 md:text-3xl lg:text-4xl">
              {t('assessmentDashboard.title', 'Assessment Dashboard')}
            </h1>
            <p className="mt-2 text-sm text-white/70">
              {t('assessmentDashboard.subtitle', 'Track your progress and performance')}
            </p>
          </div>
          {/* 🔥 NEW: View Assignments button */}
          <button
            onClick={() => router.push('/student/knowmato-plus/assignments')}
            className="rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-violet-500/25 hover:from-violet-600 hover:to-fuchsia-600 transition-all"
          >
            {t('assessmentDashboard.viewAssignments', 'View Assignments')}
          </button>
        </div>


        {/* ─── Summary Cards ────────────────────────────────── */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            label={t('assessmentDashboard.totalAssessments', 'Total Assessments')}
            value={summary.total_assessments.toString()}
            color="violet"
          />
          <SummaryCard
            label={t('assessmentDashboard.completed', 'Completed')}
            value={summary.completed.toString()}
            color="emerald"
          />
          <SummaryCard
            label={t('assessmentDashboard.passed', 'Passed')}
            value={`${summary.passed} / ${summary.total_assessments}`}
            color="fuchsia"
          />
          <SummaryCard
            label={t('assessmentDashboard.averagePercent', 'Average %')}
            value={formatPercentage(summary.average_percentage)}
            color="cyan"
          />
        </div>

        {/* ─── Performance Chart (Simple) ─────────────────── */}
        {performance.labels.length > 0 && (
          <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4">
              {t('assessmentDashboard.performanceOverTime', 'Performance Over Time')}
            </h2>
            <div className="flex items-end gap-2 h-32">
              {performance.percentages.map((pct, idx) => (
                <div key={idx} className="flex flex-col items-center flex-1">
                  <div
                    className="w-full bg-gradient-to-t from-violet-500 to-fuchsia-500 rounded-t-md"
                    style={{ height: `${Math.min(pct, 100)}%` }}
                  />
                  <span className="text-xs text-white/50 mt-1">
                    {performance.labels[idx]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Recent Assessments ──────────────────────────── */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">
                {t('assessmentDashboard.recentAssessments', 'Recent Assessments')}
              </h2>
              <p className="text-xs text-white/50">
                {t('assessmentDashboard.recentSubtitle', 'Your latest submission results')}
              </p>
            </div>
            {recent_assessments.length > 0 && (
              <button
                onClick={() => router.push('/student/knowmato-plus/assessment-history')}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold text-cyan-300 hover:bg-white/10 hover:text-cyan-200 transition-all"
              >
                {t('assessmentDashboard.viewAll', 'View All')}
              </button>
            )}
          </div>

          {recent_assessments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 backdrop-blur-xl p-8 text-center">
              <p className="text-sm text-white/50">
                {t('assessmentDashboard.noRecent', 'No recent assessments yet.')}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recent_assessments.map((item) => (
                <div
                  key={item.id}
                  className="group relative rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl shadow-lg transition-all hover:-translate-y-1 hover:border-violet-400/40 hover:shadow-xl"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <span className="rounded-full bg-violet-400/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-violet-300 border border-violet-400/30">
                      {item.assignment_title}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-bold ${
                        item.status === 'submitted'
                          ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                          : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                      }`}
                    >
                      {t(`assessmentDashboard.status_${item.status}`, item.status)}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-white">
                    {formatPercentage(item.percentage)}
                  </p>
                  <p className="text-xs text-white/50">
                    {item.submitted_at
                      ? new Date(item.submitted_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : '—'}
                  </p>
                  <button
                    onClick={() =>
                      router.push(`/student/knowmato-plus/attempt/${item.id}/result`)
                    }
                    className="mt-4 w-full rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-2 text-xs font-bold text-white shadow-lg shadow-violet-500/25 hover:from-violet-600 hover:to-fuchsia-600 transition-all"
                  >
                    {t('assessmentDashboard.viewResult', 'View Result')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── MCQ & Programming Stats ─────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* MCQ Stats */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-3">
              {t('assessmentDashboard.mcqPerformance', 'MCQ Performance')}
            </h3>
            <div className="space-y-2 text-sm text-white/70">
              <div className="flex justify-between">
                <span>{t('assessmentDashboard.answered', 'Answered')}</span>
                <span>{mcq.answered}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('assessmentDashboard.correct', 'Correct')}</span>
                <span className="text-emerald-300">{mcq.correct}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('assessmentDashboard.incorrect', 'Incorrect')}</span>
                <span className="text-red-300">{mcq.incorrect}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('assessmentDashboard.accuracy', 'Accuracy')}</span>
                <span>{formatPercentage(mcq.accuracy)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('assessmentDashboard.totalMarks', 'Total Marks')}</span>
                <span>{formatDecimal(mcq.total_marks)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('assessmentDashboard.obtainedMarks', 'Obtained')}</span>
                <span>{formatDecimal(mcq.obtained_marks)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('assessmentDashboard.negativeMarks', 'Negative Marks')}</span>
                <span className="text-red-300">{formatDecimal(mcq.negative_marks)}</span>
              </div>
            </div>
          </div>

          {/* Programming Stats */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-3">
              {t('assessmentDashboard.programmingPerformance', 'Programming Performance')}
            </h3>
            <div className="space-y-2 text-sm text-white/70">
              <div className="flex justify-between">
                <span>{t('assessmentDashboard.attempted', 'Attempted')}</span>
                <span>{programming.attempted}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('assessmentDashboard.accepted', 'Accepted')}</span>
                <span className="text-emerald-300">{programming.accepted}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('assessmentDashboard.partiallyAccepted', 'Partially Accepted')}</span>
                <span className="text-amber-300">{programming.partially_accepted}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('assessmentDashboard.failed', 'Failed')}</span>
                <span className="text-red-300">{programming.failed}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('assessmentDashboard.acceptanceRate', 'Acceptance Rate')}</span>
                <span>{formatPercentage(programming.acceptance_rate)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('assessmentDashboard.averageMarks', 'Avg Marks')}</span>
                <span>{formatDecimal(programming.average_marks)} / {formatDecimal(programming.total_marks)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t('assessmentDashboard.passRate', 'Test Case Pass Rate')}</span>
                <span>{formatPercentage(programming.pass_rate)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Time Stats (optional) ───────────────────────── */}
        {time.total_attempts > 0 && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-3">
              {t('assessmentDashboard.timeStats', 'Time Statistics')}
            </h3>
            <div className="flex flex-wrap gap-6 text-sm text-white/70">
              <div>
                <span className="block font-semibold">{t('assessmentDashboard.totalAttempts', 'Total Attempts')}</span>
                <span>{time.total_attempts}</span>
              </div>
              <div>
                <span className="block font-semibold">{t('assessmentDashboard.avgTime', 'Avg Time')}</span>
                <span>{formatDecimal(time.average_minutes, 1)} min</span>
              </div>
              <div>
                <span className="block font-semibold">{t('assessmentDashboard.fastest', 'Fastest')}</span>
                <span>{formatDecimal(time.fastest_minutes, 1)} min</span>
              </div>
              <div>
                <span className="block font-semibold">{t('assessmentDashboard.slowest', 'Slowest')}</span>
                <span>{formatDecimal(time.slowest_minutes, 1)} min</span>
              </div>
              <div>
                <span className="block font-semibold">{t('assessmentDashboard.totalLearning', 'Total Learning')}</span>
                <span>{formatDecimal(time.total_learning_hours, 1)} hrs</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Small reusable summary card
// ----------------------------------------------------------------------
function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: 'violet' | 'emerald' | 'fuchsia' | 'cyan';
}) {
  const colorMap = {
    violet: 'from-violet-500/20 to-violet-500/10 border-violet-400/30',
    emerald: 'from-emerald-500/20 to-emerald-500/10 border-emerald-400/30',
    fuchsia: 'from-fuchsia-500/20 to-fuchsia-500/10 border-fuchsia-400/30',
    cyan: 'from-cyan-500/20 to-cyan-500/10 border-cyan-400/30',
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-white/5 p-5 backdrop-blur-xl shadow-2xl ${colorMap[color]}`}
    >
      <div className="relative z-10">
        <p className="text-sm font-semibold text-white/80">{label}</p>
        <p className="mt-2 text-3xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
}