
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import type { RootState } from '@/redux/store';
import { getKnowMatoPlusDashboard } from '@/services/v2Service';
import { getStudentDashboard } from '@/services/assessmentService';
import AlertService from '@/services/alertService';

// -------------------- KnowMato+ API types --------------------

interface DashboardUserInfo {
  id: number;
  username: string;
  email: string;
  display_name: string;
  avatar: string;
}

interface DashboardStats {
  enrolled_courses: number;
  active_enrollments: number;
  completed_enrollments: number;
  wishlist_count: number;
  quiz_attempts: number;
  quiz_passed: number;
  avg_quiz_percentage: number;
  certificates_count: number;
  job_applications_total: number;
  job_shortlisted: number;
  internship_applications_total: number;
  internship_shortlisted: number;
}

interface DashboardEnrollment {
  enrollment_id: number;
  course_id: number;
  course_title: string;
  course_slug: string;
  thumbnail: string;
  status: 'active' | 'completed' | 'cancelled' | 'expired';
  progress_percentage: number;
  last_lecture: string | null;
  last_accessed_at: string | null;
  enrolled_at: string;
  expires_at: string | null;
  certificate_available: boolean;
  category: string | null;
}

interface DashboardQuizAttempt {
  quiz_title: string;
  course_title: string;
  attempt_number: number;
  score: number;
  total_marks: number;
  percentage: number;
  is_passed: boolean;
  submitted_at: string | null;
}

interface ApplicationSummary {
  total: number;
  shortlisted: number;
  interview: number;
  offered?: number;
  selected?: number;
  rejected: number;
}

interface DashboardAnnouncement {
  id: number;
  course_title: string;
  title: string;
  message: string;
  created_at: string;
}

interface DashboardRecommendedCourse {
  id: number;
  title: string;
  slug: string;
  thumbnail: string;
  instructor: string;
  category: string | null;
  rating: number;
  students: number;
  price: number;
  discounted_price: number | null;
  course_type: 'free' | 'paid' | 'premium';
}

interface DashboardData {
  user: DashboardUserInfo;
  stats: DashboardStats;
  enrollments: DashboardEnrollment[];
  recent_quiz_attempts: DashboardQuizAttempt[];
  job_application_summary: ApplicationSummary;
  internship_application_summary: ApplicationSummary;
  recent_announcements: DashboardAnnouncement[];
  recommended_courses: DashboardRecommendedCourse[];
}

// -------------------- Assessment API types --------------------

interface AssessmentSummary {
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

interface AssessmentPerformance {
  labels: string[];
  percentages: number[];
  scores: number[];
  pass_status: boolean[];
}

interface AssessmentMCQ {
  answered: number;
  correct: number;
  incorrect: number;
  accuracy: number;
  total_marks: number;
  obtained_marks: number;
  negative_marks: number;
}

interface AssessmentProgramming {
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

interface AssessmentTime {
  total_attempts: number;
  average_minutes: number;
  fastest_minutes: number;
  slowest_minutes: number;
  total_learning_hours: number;
}

interface AssessmentDashboardData {
  summary: AssessmentSummary;
  recent_assessments: RecentAssessment[];
  performance: AssessmentPerformance;
  mcq: AssessmentMCQ;
  programming: AssessmentProgramming;
  time: AssessmentTime;
}

// -------------------- Helpers --------------------

function asObject(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : null;
}

function unwrapResponse(response: unknown): Record<string, unknown> {
  let current = asObject(response);

  if (!current) {
    throw new Error('The server returned an invalid response.');
  }

  if (current.success === false) {
    throw new Error(
      typeof current.message === 'string'
        ? current.message
        : 'The request failed.',
    );
  }

  // Unwrap the API response envelope without assuming that
  // every service returns the same shape.
  for (let i = 0; i < 3; i += 1) {
    const nested = asObject(current.data);
    if (!nested) break;
    current = nested;
  }

  return current;
}

function formatNumber(value: number | null | undefined, decimals = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(decimals) : '0';
}

function formatPercent(value: number | null | undefined) {
  return `${formatNumber(value)}%`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'Date unavailable';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';

  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDuration(minutes: number | null | undefined) {
  const value = Number(minutes);

  if (!Number.isFinite(value) || value < 0) return '—';
  if (value < 60) return `${Math.round(value)} min`;

  const hours = Math.floor(value / 60);
  const remainingMinutes = Math.round(value % 60);

  return remainingMinutes
    ? `${hours}h ${remainingMinutes}m`
    : `${hours}h`;
}

function normalizeAssessmentDashboard(
  response: unknown,
): AssessmentDashboardData {
  const data = unwrapResponse(response);

  if (!data.summary || !data.performance) {
    throw new Error('Assessment statistics are missing from the response.');
  }

  const summary = data.summary as AssessmentSummary;
  const performance = data.performance as AssessmentPerformance;
  const mcq = data.mcq as AssessmentMCQ;
  const programming = data.programming as AssessmentProgramming;
  const time = data.time as AssessmentTime;

  return {
    summary,
    recent_assessments: Array.isArray(data.recent_assessments)
      ? (data.recent_assessments as RecentAssessment[])
      : [],
    performance: {
      labels: Array.isArray(performance.labels) ? performance.labels : [],
      percentages: Array.isArray(performance.percentages)
        ? performance.percentages
        : [],
      scores: Array.isArray(performance.scores) ? performance.scores : [],
      pass_status: Array.isArray(performance.pass_status)
        ? performance.pass_status
        : [],
    },
    mcq: mcq ?? {
      answered: 0,
      correct: 0,
      incorrect: 0,
      accuracy: 0,
      total_marks: 0,
      obtained_marks: 0,
      negative_marks: 0,
    },
    programming: programming ?? {
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
    time: time ?? {
      total_attempts: 0,
      average_minutes: 0,
      fastest_minutes: 0,
      slowest_minutes: 0,
      total_learning_hours: 0,
    },
  };
}

// -------------------- Reusable UI --------------------

function MetricCard({
  icon,
  label,
  value,
  description,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  description: string;
  color: 'violet' | 'emerald' | 'fuchsia' | 'cyan' | 'amber';
}) {
  const styles = {
    violet: 'border-violet-400/25 from-violet-500/20',
    emerald: 'border-emerald-400/25 from-emerald-500/20',
    fuchsia: 'border-fuchsia-400/25 from-fuchsia-500/20',
    cyan: 'border-cyan-400/25 from-cyan-500/20',
    amber: 'border-amber-400/25 from-amber-500/20',
  };

  return (
    <div
      className={`rounded-2xl border bg-gradient-to-br ${styles[color]} to-white/[0.025] p-5 shadow-lg backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/[0.07]`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-2xl" aria-hidden="true">{icon}</span>
        <span className="text-right text-xs font-medium text-white/55">
          {label}
        </span>
      </div>
      <p className="mt-4 text-3xl font-extrabold text-white">{value}</p>
      <p className="mt-1 text-xs text-white/50">{description}</p>
    </div>
  );
}

function DetailRow({
  label,
  value,
  color = 'text-white/85',
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] py-2.5 last:border-0">
      <span className="text-sm text-white/60">{label}</span>
      <span className={`text-right text-sm font-semibold ${color}`}>
        {value}
      </span>
    </div>
  );
}

function SectionHeading({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5">
      <h2 className="flex items-center gap-2 text-lg font-bold text-white">
        <span>{icon}</span>
        {title}
      </h2>
      <p className="mt-1 text-sm text-white/50">{description}</p>
    </div>
  );
}

// -------------------- Dashboard --------------------

export default function KnowMatoPlusDashboard() {
  const { t } = useTranslation();
  const router = useRouter();
  const reduxUser = useSelector((state: RootState) => state.auth.user);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [assessment, setAssessment] =
    useState<AssessmentDashboardData | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [assessmentError, setAssessmentError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async (showErrors = true) => {
    setDashboardError(null);
    setAssessmentError(null);

    const [mainResult, assessmentResult] = await Promise.allSettled([
      getKnowMatoPlusDashboard(),
      getStudentDashboard(),
    ]);

    if (mainResult.status === 'fulfilled') {
      try {
        const response = mainResult.value;
        const main = unwrapResponse(response) as unknown as DashboardData;

        if (!main.user || !main.stats) {
          throw new Error('The dashboard response is incomplete.');
        }

        setData({
          ...main,
          enrollments: Array.isArray(main.enrollments) ? main.enrollments : [],
          recent_quiz_attempts: Array.isArray(main.recent_quiz_attempts)
            ? main.recent_quiz_attempts
            : [],
          recent_announcements: Array.isArray(main.recent_announcements)
            ? main.recent_announcements
            : [],
          recommended_courses: Array.isArray(main.recommended_courses)
            ? main.recommended_courses
            : [],
        });
      } catch (error) {
        console.error('KnowMato+ dashboard response error:', error);
        setDashboardError(
          error instanceof Error ? error.message : 'Unable to read dashboard data.',
        );
      }
    } else {
      console.error('KnowMato+ dashboard request failed:', mainResult.reason);
      setDashboardError('Unable to load your KnowMato+ dashboard.');
    }

    if (assessmentResult.status === 'fulfilled') {
      try {
        setAssessment(normalizeAssessmentDashboard(assessmentResult.value));
      } catch (error) {
        console.error('Assessment dashboard response error:', error);
        setAssessmentError(
          error instanceof Error
            ? error.message
            : 'Unable to read assessment statistics.',
        );
      }
    } else {
      console.error('Assessment dashboard request failed:', assessmentResult.reason);
      setAssessmentError('Assessment statistics are temporarily unavailable.');
    }

    if (showErrors && mainResult.status === 'rejected') {
      AlertService.error(
        'Dashboard Load Failed',
        'Could not load your main dashboard. Please refresh and try again.',
      );
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);

  const handleRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    void fetchDashboard(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
        <div className="text-center">
          <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-violet-400 border-t-transparent" />
          <p className="mt-4 text-sm text-white/65">
            {t('common.loading', 'Preparing your learning dashboard...')}
          </p>
        </div>
      </div>
    );
  }

  const stats = data?.stats;
  const summary = assessment?.summary;
  const recentAssessments = assessment?.recent_assessments ?? [];
  const activeEnrollments =
    data?.enrollments.filter((item) => item.status === 'active') ?? [];

  const displayName =
    data?.user.display_name ||
    reduxUser?.display_name ||
    reduxUser?.username ||
    'Learner';

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
      <div className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-purple-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-24 h-72 w-72 rounded-full bg-fuchsia-500/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />

      <main className="relative z-10 mx-auto max-w-[1600px] space-y-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        {/* Welcome */}
        <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-violet-300">
              KNOWMATO+
            </p>
            
            <h1 className="text-2xl font-extrabold leading-tight text-white sm:text-3xl lg:text-4xl">
              Welcome back,{' '}
              <span className="text-fuchsia-300">
                {displayName || 'Learner'}
              </span>
              !
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
              Your learning, assessment results, and career progress — all in one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-white/10 disabled:opacity-50"
            >
              {refreshing ? 'Refreshing...' : '↻ Refresh'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/student/knowmato-plus/courses')}
              className="rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/20 transition hover:brightness-110"
            >
              Explore courses →
            </button>
          </div>
        </header>

        {/* Main API error */}
        {dashboardError && (
          <div className="rounded-xl border border-red-400/25 bg-red-400/10 p-4 text-sm text-red-200">
            <p className="font-semibold">Some learning information could not load.</p>
            <p className="mt-1 text-red-200/70">{dashboardError}</p>
            <button
              type="button"
              onClick={handleRefresh}
              className="mt-3 font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Learning overview */}
        <section>
          <SectionHeading
            icon="🎓"
            title="Your learning overview"
            description="A quick summary of your courses, achievements, and learning activity."
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon="📚"
              label="Courses enrolled"
              value={String(stats?.enrolled_courses ?? 0)}
              description={`${stats?.active_enrollments ?? 0} currently active`}
              color="violet"
            />
            <MetricCard
              icon="🏁"
              label="Courses completed"
              value={String(stats?.completed_enrollments ?? 0)}
              description="Completed course enrollments"
              color="emerald"
            />
            <MetricCard
              icon="🏆"
              label="Certificates"
              value={String(stats?.certificates_count ?? 0)}
              description="Certificates earned"
              color="amber"
            />
            <MetricCard
              icon="❤️"
              label="Wishlist"
              value={String(stats?.wishlist_count ?? 0)}
              description="Courses saved for later"
              color="fuchsia"
            />
          </div>
        </section>

        {/* Assessment overview from assessment service */}
        <section className="rounded-2xl border border-violet-300/15 bg-gradient-to-br from-violet-500/[0.10] to-cyan-500/[0.04] p-5 shadow-xl backdrop-blur-xl sm:p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <SectionHeading
              icon="🧠"
              title="Assessment performance"
              description="Your coding challenges, MCQ results, and submitted assignments."
            />
            <button
              type="button"
              onClick={() => router.push('/student/knowmato-plus/assessments')}
              className="shrink-0 rounded-xl border border-violet-300/25 bg-violet-400/10 px-4 py-2.5 text-sm font-bold text-violet-200 transition hover:bg-violet-400/20"
            >
              Open assessment dashboard →
            </button>
          </div>

          {assessmentError ? (
            <div className="rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-4">
              <p className="font-semibold text-amber-200">
                Assessment statistics are temporarily unavailable.
              </p>
              <p className="mt-1 text-sm text-white/55">{assessmentError}</p>
              <button
                type="button"
                onClick={handleRefresh}
                className="mt-3 text-sm font-semibold text-cyan-300 hover:text-cyan-200"
              >
                Retry loading →
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <MetricCard
                  icon="📝"
                  label="Completed"
                  value={String(summary?.completed ?? 0)}
                  description={`${summary?.total_assessments ?? 0} recorded in total`}
                  color="violet"
                />
                <MetricCard
                  icon="✅"
                  label="Passed"
                  value={`${summary?.passed ?? 0} / ${summary?.completed ?? 0}`}
                  description="Completed assessments passed"
                  color="emerald"
                />
                <MetricCard
                  icon="📈"
                  label="Average score"
                  value={formatPercent(summary?.average_percentage ?? 0)}
                  description={`Highest: ${formatPercent(summary?.highest_percentage ?? 0)}`}
                  color="cyan"
                />
                <MetricCard
                  icon="🎯"
                  label="Pass rate"
                  value={formatPercent(
                    summary && summary.completed > 0
                      ? (summary.passed / summary.completed) * 100
                      : 0,
                  )}
                  description="Of completed assessments"
                  color="fuchsia"
                />
              </div>

              {/* Recent assessment results */}
              <div className="mt-7">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-white">Recent assessment results</h3>
                    <p className="mt-1 text-xs text-white/50">
                      Your latest submitted attempts and scores.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push('/student/knowmato-plus/assignments')}
                    className="shrink-0 text-sm font-semibold text-cyan-300 hover:text-cyan-200"
                  >
                    Assignments →
                  </button>
                </div>

                {recentAssessments.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/15 p-6 text-center">
                    <p className="font-semibold text-white/80">
                      No submitted assessment results yet
                    </p>
                    <p className="mt-1 text-sm text-white/50">
                      Start an assignment to track your progress here.
                    </p>
                    <button
                      type="button"
                      onClick={() => router.push('/student/knowmato-plus/assignments')}
                      className="mt-4 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2.5 text-sm font-bold text-white"
                    >
                      Browse assignments
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {recentAssessments.slice(0, 6).map((item) => (
                      <article
                        key={item.attempt_id}
                        className="rounded-xl border border-white/10 bg-[#17152f]/60 p-4 transition hover:border-violet-300/30"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-violet-300">
                              Assessment #{item.assignment_id}
                            </p>
                            <p className="mt-1 text-xs text-white/45">
                              Attempt #{item.attempt_id} · Batch {item.batch_id}
                            </p>
                          </div>
                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-bold ${
                              item.passed
                                ? 'border-emerald-300/20 bg-emerald-300/10 text-emerald-300'
                                : 'border-amber-300/20 bg-amber-300/10 text-amber-200'
                            }`}
                          >
                            {item.passed ? 'Passed' : 'Review needed'}
                          </span>
                        </div>

                        <div className="mt-5 flex items-end justify-between gap-3">
                          <div>
                            <p className="text-xs text-white/45">Your score</p>
                            <p className="mt-1 text-3xl font-extrabold text-white">
                              {formatPercent(item.percentage)}
                            </p>
                            <p className="mt-1 text-sm text-white/55">
                              {formatNumber(item.score, 2)} marks
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-white/45">Submitted</p>
                            <p className="mt-1 text-xs text-white/75">
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
                              width: `${Math.min(100, Math.max(0, Number(item.percentage) || 0))}%`,
                            }}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/student/knowmato-plus/assignments/${item.attempt_id}/result`,
                            )
                          }
                          className="mt-4 w-full rounded-lg bg-white/[0.07] py-2.5 text-sm font-semibold text-white transition hover:bg-violet-400/15"
                        >
                          View detailed result →
                        </button>
                      </article>
                    ))}
                  </div>
                )}
              </div>

              {/* MCQ and programming breakdown */}
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-[#17152f]/50 p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="text-2xl">📝</span>
                    <div>
                      <h3 className="font-bold text-white">MCQ performance</h3>
                      <p className="text-xs text-white/45">Multiple-choice questions</p>
                    </div>
                  </div>
                  <DetailRow label="Questions answered" value={String(assessment?.mcq.answered ?? 0)} />
                  <DetailRow label="Correct answers" value={String(assessment?.mcq.correct ?? 0)} color="text-emerald-300" />
                  <DetailRow label="Incorrect answers" value={String(assessment?.mcq.incorrect ?? 0)} color="text-red-300" />
                  <DetailRow label="Accuracy" value={formatPercent(assessment?.mcq.accuracy ?? 0)} />
                  <DetailRow
                    label="Marks obtained"
                    value={`${formatNumber(assessment?.mcq.obtained_marks, 2)} / ${formatNumber(assessment?.mcq.total_marks, 2)}`}
                  />
                  <DetailRow
                    label="Negative marks"
                    value={formatNumber(assessment?.mcq.negative_marks, 2)}
                    color="text-amber-200"
                  />
                </div>

                <div className="rounded-xl border border-white/10 bg-[#17152f]/50 p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="text-2xl">💻</span>
                    <div>
                      <h3 className="font-bold text-white">Programming performance</h3>
                      <p className="text-xs text-white/45">Coding and test case results</p>
                    </div>
                  </div>
                  <DetailRow label="Programs attempted" value={String(assessment?.programming.attempted ?? 0)} />
                  <DetailRow label="Accepted" value={String(assessment?.programming.accepted ?? 0)} color="text-emerald-300" />
                  <DetailRow label="Partially accepted" value={String(assessment?.programming.partially_accepted ?? 0)} color="text-amber-200" />
                  <DetailRow label="Failed" value={String(assessment?.programming.failed ?? 0)} color="text-red-300" />
                  <DetailRow label="Acceptance rate" value={formatPercent(assessment?.programming.acceptance_rate ?? 0)} />
                  <DetailRow
                    label="Test cases passed"
                    value={`${assessment?.programming.passed_test_cases ?? 0} / ${assessment?.programming.total_test_cases ?? 0}`}
                  />
                  <DetailRow label="Test case pass rate" value={formatPercent(assessment?.programming.pass_rate ?? 0)} />
                  <DetailRow
                    label="Marks / available marks"
                    value={`${formatNumber(assessment?.programming.average_marks, 2)} / ${formatNumber(assessment?.programming.total_marks, 2)}`}
                  />
                </div>
              </div>

              {/* Time and performance history */}
              <div className="mt-4 rounded-xl border border-white/10 bg-[#17152f]/50 p-5">
                <h3 className="font-bold text-white">Learning activity</h3>
                <p className="mt-1 text-xs text-white/50">
                  Time recorded by the assessment service.
                </p>
                <div className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-5">
                  <div>
                    <p className="text-xs text-white/45">Recorded attempts</p>
                    <p className="mt-2 text-xl font-bold text-white">
                      {assessment?.time.total_attempts ?? 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-white/45">Average duration</p>
                    <p className="mt-2 text-xl font-bold text-violet-300">
                      {formatDuration(assessment?.time.average_minutes)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-white/45">Shortest duration</p>
                    <p className="mt-2 text-xl font-bold text-emerald-300">
                      {formatDuration(assessment?.time.fastest_minutes)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-white/45">Longest duration</p>
                    <p className="mt-2 text-xl font-bold text-fuchsia-300">
                      {formatDuration(assessment?.time.slowest_minutes)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-white/45">Total learning time</p>
                    <p className="mt-2 text-xl font-bold text-cyan-300">
                      {formatNumber(assessment?.time.total_learning_hours, 1)} hrs
                    </p>
                  </div>
                </div>

                {assessment && assessment.performance.labels.length > 0 && (
                  <div className="mt-6 border-t border-white/10 pt-5">
                    <h4 className="mb-4 text-sm font-semibold text-white/80">
                      Score by attempt
                    </h4>
                    <div className="flex items-end gap-3 overflow-x-auto pb-2">
                      {assessment.performance.labels.map((label, index) => {
                        const percentage = Math.min(
                          100,
                          Math.max(
                            0,
                            Number(assessment.performance.percentages[index]) || 0,
                          ),
                        );
                        const passed = Boolean(
                          assessment.performance.pass_status[index],
                        );

                        return (
                          <div
                            key={`${label}-${index}`}
                            className="flex min-w-16 flex-1 flex-col items-center"
                          >
                            <span className="mb-2 text-xs font-bold text-white/70">
                              {formatPercent(percentage)}
                            </span>
                            <div className="flex h-28 w-full items-end justify-center">
                              <div
                                className={`w-full max-w-20 rounded-t-lg ${
                                  passed
                                    ? 'bg-gradient-to-t from-emerald-600 to-emerald-300'
                                    : 'bg-gradient-to-t from-violet-600 to-fuchsia-400'
                                }`}
                                style={{
                                  height: `${Math.max(percentage > 0 ? 4 : 0, percentage)}%`,
                                }}
                              />
                            </div>
                            <span className="mt-2 text-center text-xs text-white/50">
                              {label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </section>

        {/* Continue learning */}
        <section>
          <SectionHeading
            icon="📖"
            title="Continue learning"
            description="Pick up an active course or discover something new."
          />

          {!data ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5 text-sm text-white/55">
              Course information is currently unavailable.
            </div>
          ) : activeEnrollments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-7 text-center">
              <span className="text-3xl">🚀</span>
              <p className="mt-3 font-semibold text-white">
                Your next learning journey starts here
              </p>
              <p className="mt-1 text-sm text-white/50">
                You have no active course enrollments yet. Explore courses to get started.
              </p>
              <button
                type="button"
                onClick={() => router.push('/student/knowmato-plus/courses')}
                className="mt-4 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-2.5 text-sm font-bold text-white"
              >
                Browse courses →
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {activeEnrollments.slice(0, 6).map((enrollment) => (
                <button
                  type="button"
                  key={enrollment.enrollment_id}
                  onClick={() =>
                    router.push(
                      `/student/knowmato-plus/courses/${enrollment.course_slug}`,
                    )
                  }
                  className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-left transition hover:-translate-y-0.5 hover:border-violet-300/30"
                >
                  <img
                    src={enrollment.thumbnail || '/placeholder-course.jpg'}
                    alt={enrollment.course_title}
                    className="mb-3 h-36 w-full rounded-xl object-cover"
                  />
                  <h3 className="font-bold text-white">
                    {enrollment.course_title}
                  </h3>
                  <p className="mt-1 text-xs text-white/50">
                    {enrollment.category || 'Course'}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-xs text-white/60">
                    <span>{formatNumber(enrollment.progress_percentage)}% complete</span>
                    <span>Continue →</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-300"
                      style={{
                        width: `${Math.min(100, Math.max(0, enrollment.progress_percentage || 0))}%`,
                      }}
                    />
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Quizzes */}
        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 shadow-xl backdrop-blur-xl">
            <SectionHeading
              icon="❓"
              title="Course quiz performance"
              description="Quizzes associated with your enrolled courses."
            />
            <div className="grid grid-cols-2 gap-3">
              <MetricCard
                icon="📝"
                label="Quiz attempts"
                value={String(stats?.quiz_attempts ?? 0)}
                description="Recorded quiz attempts"
                color="violet"
              />
              <MetricCard
                icon="✅"
                label="Quizzes passed"
                value={String(stats?.quiz_passed ?? 0)}
                description="Successful quiz attempts"
                color="emerald"
              />
            </div>
            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-white/60">Average quiz score</span>
                <span className="text-xl font-bold text-cyan-300">
                  {formatPercent(stats?.avg_quiz_percentage ?? 0)}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-white/45">
                Course quiz statistics are separate from the programming and MCQ assessment results shown above.
              </p>
            </div>

            {data && data.recent_quiz_attempts.length > 0 ? (
              <div className="mt-4 space-y-2">
                {data.recent_quiz_attempts.slice(0, 4).map((attempt, index) => (
                  <div
                    key={`${attempt.quiz_title}-${attempt.attempt_number}-${index}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {attempt.quiz_title}
                      </p>
                      <p className="mt-1 truncate text-xs text-white/45">
                        {attempt.course_title} · Attempt {attempt.attempt_number}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-sm font-bold ${
                        attempt.is_passed ? 'text-emerald-300' : 'text-amber-200'
                      }`}
                    >
                      {formatPercent(attempt.percentage)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-white/45">
                No course quiz attempts have been recorded yet.
              </p>
            )}
          </div>

          {/* Career */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 shadow-xl backdrop-blur-xl">
            <SectionHeading
              icon="💼"
              title="Career opportunities"
              description="Track your job and internship applications."
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-violet-300/20 bg-violet-400/[0.06] p-4">
                <span className="text-2xl">💼</span>
                <p className="mt-3 text-xs text-white/55">Job applications</p>
                <p className="mt-1 text-2xl font-extrabold text-white">
                  {data?.job_application_summary.total ?? stats?.job_applications_total ?? 0}
                </p>
                <p className="mt-1 text-xs text-emerald-300">
                  {data?.job_application_summary.shortlisted ?? stats?.job_shortlisted ?? 0} shortlisted
                </p>
                <button
                  type="button"
                  onClick={() => router.push('/student/knowmato-plus/jobs')}
                  className="mt-4 text-sm font-semibold text-violet-300 hover:text-violet-200"
                >
                  Explore jobs →
                </button>
              </div>

              <div className="rounded-xl border border-cyan-300/20 bg-cyan-400/[0.05] p-4">
                <span className="text-2xl">🎓</span>
                <p className="mt-3 text-xs text-white/55">Internship applications</p>
                <p className="mt-1 text-2xl font-extrabold text-white">
                  {data?.internship_application_summary.total ?? stats?.internship_applications_total ?? 0}
                </p>
                <p className="mt-1 text-xs text-emerald-300">
                  {data?.internship_application_summary.shortlisted ?? stats?.internship_shortlisted ?? 0} shortlisted
                </p>
                <button
                  type="button"
                  onClick={() => router.push('/student/knowmato-plus/internships')}
                  className="mt-4 text-sm font-semibold text-cyan-300 hover:text-cyan-200"
                >
                  Explore internships →
                </button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/[0.03] p-3">
                <p className="text-xs text-white/45">Job interviews</p>
                <p className="mt-1 text-xl font-bold text-white">
                  {data?.job_application_summary.interview ?? 0}
                </p>
              </div>
              <div className="rounded-xl bg-white/[0.03] p-3">
                <p className="text-xs text-white/45">Internship interviews</p>
                <p className="mt-1 text-xl font-bold text-white">
                  {data?.internship_application_summary.interview ?? 0}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Announcements */}
        {data && data.recent_announcements.length > 0 && (
          <section>
            <SectionHeading
              icon="📢"
              title="Latest announcements"
              description="Updates from your enrolled courses."
            />
            <div className="space-y-3">
              {data.recent_announcements.map((announcement) => (
                <article
                  key={announcement.id}
                  className="rounded-xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-semibold text-white">
                        {announcement.title}
                      </h3>
                      <p className="mt-1 text-xs text-violet-300">
                        {announcement.course_title}
                      </p>
                    </div>
                    <time className="text-xs text-white/40">
                      {formatDate(announcement.created_at)}
                    </time>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/65">
                    {announcement.message}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Recommended courses */}
        {data && data.recommended_courses.length > 0 && (
          <section>
            <SectionHeading
              icon="✨"
              title="Recommended for you"
              description="Discover courses that could help you develop new skills."
            />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {data.recommended_courses.map((course) => (
                <button
                  type="button"
                  key={course.id}
                  onClick={() =>
                    router.push(`/student/knowmato-plus/courses/${course.slug}`)
                  }
                  className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-left transition hover:-translate-y-0.5 hover:border-violet-300/30"
                >
                  <img
                    src={course.thumbnail || '/placeholder-course.jpg'}
                    alt={course.title}
                    className="h-40 w-full rounded-xl object-cover"
                  />
                  <h3 className="mt-3 line-clamp-2 font-bold text-white">
                    {course.title}
                  </h3>
                  <p className="mt-1 text-xs text-white/50">
                    {course.instructor}
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-xs text-amber-300">
                      ⭐ {formatNumber(course.rating, 1)} · {course.students} learners
                    </span>
                    <span className="text-sm font-bold text-emerald-300">
                      {course.course_type === 'free'
                        ? 'Free'
                        : `₹${formatNumber(course.discounted_price ?? course.price)}`}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="flex flex-wrap justify-center gap-x-5 gap-y-3 border-t border-white/10 pt-6 text-sm text-white/45">
          <button
            type="button"
            onClick={() => router.push('/student/knowmato-plus/courses')}
            className="transition hover:text-violet-300"
          >
            All courses
          </button>
          <button
            type="button"
            onClick={() => router.push('/student/knowmato-plus/assignments')}
            className="transition hover:text-violet-300"
          >
            Assessments
          </button>
          <button
            type="button"
            onClick={() => router.push('/student/knowmato-plus/jobs')}
            className="transition hover:text-violet-300"
          >
            Jobs
          </button>
          <button
            type="button"
            onClick={() => router.push('/student/knowmato-plus/internships')}
            className="transition hover:text-violet-300"
          >
            Internships
          </button>
          <button
            type="button"
            onClick={() => router.push('/student/knowmato-plus/certificates')}
            className="transition hover:text-violet-300"
          >
            Certificates
          </button>
          <button
            type="button"
            onClick={() => router.push('/student/knowmato-plus/wishlist')}
            className="transition hover:text-violet-300"
          >
            Wishlist
          </button>
        </footer>
      </main>
    </div>
  );
}
