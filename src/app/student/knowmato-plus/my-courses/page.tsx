'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMyCourses, type Enrollment } from '@/services/v2Service';
import { useTranslation } from 'react-i18next';

export default function MyCoursesPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getMyCourses();

      /*
       * getMyCourses() is expected to return Enrollment[].
       * The small normalization below also safely handles an API wrapper
       * such as { data: Enrollment[] } if the service is changed later.
       */
      const data = Array.isArray(response)
        ? response
        : Array.isArray((response as any)?.data)
          ? (response as any).data
          : [];

      setEnrollments(data);
    } catch (err: any) {
      const message =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        t('myCourses.loadError');

      setError(message);
      console.error('Failed to fetch enrolled courses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, [t]);

  // ------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '';

    const date = new Date(dateStr);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getProgress = (enrollment: Enrollment): number => {
    const rawProgress = Number(
      (enrollment as Enrollment & {
        progress_percentage?: number | string | null;
        progressPercentage?: number | string | null;
        progress?: number | string | null;
      }).progress_percentage ??
        (enrollment as any).progressPercentage ??
        (enrollment as any).progress ??
        0,
    );

    if (!Number.isFinite(rawProgress)) {
      return 0;
    }

    return Math.min(100, Math.max(0, rawProgress));
  };

  const getStatusBadge = (status: Enrollment['status']) => {
    const statusClasses: Record<string, string> = {
      active: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
      completed: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30',
      cancelled: 'bg-red-500/20 text-red-300 border-red-400/30',
      expired: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30',
    };

    const statusKeys: Record<string, string> = {
      active: 'myCourses.statusActive',
      completed: 'myCourses.statusCompleted',
      cancelled: 'myCourses.statusCancelled',
      expired: 'myCourses.statusExpired',
    };

    return (
      <span
        className={`rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${
          statusClasses[status] || 'border-white/10 bg-white/10 text-white/50'
        }`}
      >
        {t(statusKeys[status] || status)}
      </span>
    );
  };

  const sortedEnrollments = useMemo(() => {
    return [...enrollments].sort((a, b) => {
      // Active courses first, then completed, then other states.
      const order: Record<string, number> = {
        active: 0,
        completed: 1,
        expired: 2,
        cancelled: 3,
      };

      return (order[a.status] ?? 99) - (order[b.status] ?? 99);
    });
  }, [enrollments]);

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
      <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-8 sm:mb-10">
            <h1 className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-2xl font-bold text-transparent sm:text-3xl">
              {t('myCourses.title')}
            </h1>

            <p className="mt-2 text-sm text-white/70 sm:text-base">
              {t('myCourses.subtitle')}
            </p>
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, index) => (
                <div
                  key={index}
                  className="animate-pulse rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-2xl"
                >
                  <div className="h-36 w-full rounded-lg bg-white/10" />

                  <div className="mt-4 h-5 w-3/4 rounded bg-white/10" />

                  <div className="mt-2 h-4 w-1/2 rounded bg-white/10" />

                  <div className="mt-4 h-4 w-full rounded bg-white/10" />

                  <div className="mt-2 h-2 w-full rounded-full bg-white/10" />

                  <div className="mt-4 h-4 w-2/3 rounded bg-white/10" />

                  <div className="mt-4 h-10 w-full rounded-lg bg-white/10" />
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center backdrop-blur-md">
              <p className="text-red-300">{error}</p>

              <button
                type="button"
                onClick={fetchEnrollments}
                className="mt-4 rounded-lg bg-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/20 active:scale-[0.98]"
              >
                {t('myCourses.retry')}
              </button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && sortedEnrollments.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur-xl sm:p-12 shadow-2xl">
              <div className="text-4xl">📚</div>

              <p className="mt-4 text-lg text-white/60">
                {t('myCourses.empty')}
              </p>

              <button
                type="button"
                onClick={() => router.push('/courses')}
                className="mt-5 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-2.5 text-sm font-bold text-white transition hover:opacity-90 active:scale-[0.98] shadow-lg shadow-violet-500/25"
              >
                {t('myCourses.browseCourses')}
              </button>
            </div>
          )}

          {/* Enrollments */}
          {!loading && !error && sortedEnrollments.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {sortedEnrollments.map((enrollment) => {
                const progress = getProgress(enrollment);
                const isActive = enrollment.status === 'active';
                const isCompleted = enrollment.status === 'completed';

                return (
                  <div
                    key={enrollment.id}
                    className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-xl transition hover:-translate-y-1 hover:border-violet-500/30 hover:shadow-xl"
                  >
                    {/* Thumbnail */}
                    <div
                      className="h-36 w-full rounded-lg bg-cover bg-center"
                      style={{
                        backgroundImage: enrollment.course_thumbnail
                          ? `url(${enrollment.course_thumbnail})`
                          : 'linear-gradient(135deg, #8b5cf6, #d946ef)',
                      }}
                    />

                    {/* Course title */}
                    <h3 className="mt-4 line-clamp-2 text-lg font-bold text-white">
                      {enrollment.course_title}
                    </h3>

                    {enrollment.instructor_name && (
                      <p className="mt-1 line-clamp-1 text-sm text-violet-300">
                        {enrollment.instructor_name}
                      </p>
                    )}

                    {/* Status + percentage */}
                    <div className="mt-4 flex items-center justify-between gap-3">
                      {getStatusBadge(enrollment.status)}

                      <span className="text-sm font-semibold text-white/70">
                        {progress.toFixed(0)}%
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 transition-all duration-500"
                        style={{
                          width: `${progress}%`,
                        }}
                      />
                    </div>

                    {/* Progress text */}
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-xs text-white/40">
                        {t('myCourses.progressComplete', {
                          percent: progress.toFixed(0),
                        })}
                      </span>

                      {progress >= 100 && (
                        <span className="text-xs font-semibold text-emerald-300">
                          {t('myCourses.courseCompleted', 'Completed')}
                        </span>
                      )}
                    </div>

                    {/* Last lecture */}
                    {enrollment.last_lecture_title && (
                      <p className="mt-4 line-clamp-2 text-xs leading-5 text-white/40">
                        {t('myCourses.lastLecture', {
                          title: enrollment.last_lecture_title,
                        })}
                      </p>
                    )}

                    {/* Enrolled date */}
                    {enrollment.enrolled_at && (
                      <p className="mt-1 text-xs text-white/30">
                        {t('myCourses.enrolledOn', {
                          date: formatDate(enrollment.enrolled_at),
                        })}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="mt-auto flex gap-2 pt-5">
                      {isActive && (
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/student/knowmato-plus/${enrollment.course}`,
                            )
                          }
                          className="w-full rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90 active:scale-[0.98] shadow-lg shadow-violet-500/25"
                        >
                          {progress > 0
                            ? t('myCourses.continueLearning', 'Continue Learning')
                            : t('myCourses.startLearning', 'Start Learning')}
                        </button>
                      )}

                      {isCompleted && enrollment.certificate_generated && (
                        <button
                          type="button"
                          onClick={() =>
                            router.push(`/certificate/${enrollment.course}`)
                          }
                          className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90 active:scale-[0.98] shadow-lg shadow-cyan-500/25"
                        >
                          {t('myCourses.viewCertificate')}
                        </button>
                      )}

                      {isCompleted && !enrollment.certificate_generated && (
                        <div className="w-full py-2 text-center text-sm text-white/50">
                          {t('myCourses.courseCompleted')}
                        </div>
                      )}

                      {(enrollment.status === 'cancelled' ||
                        enrollment.status === 'expired') && (
                        <div className="w-full py-2 text-center text-sm capitalize text-white/40">
                          {t(
                            `myCourses.status${
                              enrollment.status.charAt(0).toUpperCase() +
                              enrollment.status.slice(1)
                            }`,
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* KnowMato Agent Floating Button – consistent with dashboard */}
      <button
        onClick={() => router.push('/knowmato-agent')}
        className="
          fixed
          bottom-12
          right-8
          z-[999]
          flex
          items-center
          gap-3
          rounded-full
          bg-gradient-to-r
          from-violet-600
          to-fuchsia-600
          px-5
          py-3
          text-white
          font-bold
          shadow-2xl
          shadow-violet-500/40
          hover:scale-105
          hover:shadow-fuchsia-500/40
          transition-all
          duration-300
        "
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-2xl">
          🤖
        </span>

        <div className="text-left">
          <p className="text-sm font-bold leading-none">
            KnowMato Agent
          </p>
          <p className="text-xs text-white/80">
            AI Assistant
          </p>
        </div>
      </button>
    </div>
  );
}