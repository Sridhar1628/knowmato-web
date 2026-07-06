'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMyCourses, type Enrollment } from '@/services/v2Service';

export default function MyCoursesPage() {
  const router = useRouter();

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getMyCourses();
        setEnrollments(data);
      } catch (err: any) {
        setError(err?.response?.data?.detail || err?.message || 'Failed to load your courses');
        console.error('Failed to fetch enrolled courses:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEnrollments();
  }, []);

  // Helper to format date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const statusBadge = (status: Enrollment['status']) => {
    const classes: Record<string, string> = {
      active: 'bg-emerald-500/20 text-emerald-300',
      completed: 'bg-cyan-500/20 text-cyan-300',
      cancelled: 'bg-red-500/20 text-red-300',
      expired: 'bg-yellow-500/20 text-yellow-300',
    };
    return (
      <span
        className={`rounded-full px-2 py-0.5 text-xs capitalize ${
          classes[status] || 'bg-white/10 text-white/50'
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#0B0C10] p-6 text-white">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300">
            My Courses
          </h1>
          <p className="mt-2 text-white/70">
            Continue where you left off.
          </p>
        </div>

        {/* Loading skeleton – premium glass cards */}
        {loading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6"
              >
                <div className="h-36 rounded-lg bg-white/10" />
                <div className="mt-4 h-5 w-3/4 rounded bg-white/10" />
                <div className="mt-2 h-4 w-1/2 rounded bg-white/10" />
                <div className="mt-3 h-2 rounded-full bg-white/10" />
                <div className="mt-4 flex justify-between">
                  <div className="h-4 w-20 rounded bg-white/10" />
                  <div className="h-8 w-24 rounded bg-white/10" />
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

        {/* Empty state */}
        {!loading && !error && enrollments.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-12 text-center">
            <p className="text-lg text-white/50">
              You are not enrolled in any courses yet.
            </p>
            <button
              onClick={() => router.push('/courses')}
              className="mt-4 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-2 text-sm font-bold text-white hover:opacity-90 active:scale-[0.98] transition"
            >
              Browse Courses
            </button>
          </div>
        )}

        {/* Enrollments grid – premium cards */}
        {!loading && !error && enrollments.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {enrollments.map((enrollment) => (
              <div
                key={enrollment.id}
                className="flex flex-col rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 shadow-2xl transition hover:border-violet-500/30 hover:shadow-violet-500/5"
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

                {/* Title & Instructor */}
                <h3 className="mt-4 text-lg font-bold text-white line-clamp-2">
                  {enrollment.course_title}
                </h3>
                <p className="mt-1 text-sm text-violet-300">{enrollment.instructor_name}</p>

                {/* Status & Progress */}
                <div className="mt-3 flex items-center justify-between">
                  {statusBadge(enrollment.status)}
                  <span className="text-sm text-white/60">
                    {enrollment.progress_percentage}% complete
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-2 h-2 w-full rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all"
                    style={{ width: `${enrollment.progress_percentage}%` }}
                  />
                </div>

                {/* Last lecture */}
                {enrollment.last_lecture_title && (
                  <p className="mt-3 text-xs text-white/40">
                    Last lecture: {enrollment.last_lecture_title}
                  </p>
                )}

                {/* Enrolled date */}
                <p className="mt-1 text-xs text-white/30">
                  Enrolled: {formatDate(enrollment.enrolled_at)}
                </p>

                {/* Actions */}
                <div className="mt-auto pt-4 flex gap-2">
                  {enrollment.status === 'active' && (
                    <button
                      onClick={() => router.push(`/student/knowmato-plus/${enrollment.course}`)}
                      className="w-full rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-bold text-white transition hover:opacity-90 active:scale-[0.98]"
                    >
                      Continue Learning
                    </button>
                  )}
                  {enrollment.status === 'completed' && enrollment.certificate_generated && (
                    <button
                      onClick={() => router.push(`/certificate/${enrollment.course}`)}
                      className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-2 text-sm font-bold text-white transition hover:opacity-90 active:scale-[0.98]"
                    >
                      View Certificate
                    </button>
                  )}
                  {enrollment.status === 'completed' && !enrollment.certificate_generated && (
                    <div className="w-full text-center text-sm text-white/50 py-2">
                      Course completed
                    </div>
                  )}
                  {(enrollment.status === 'cancelled' || enrollment.status === 'expired') && (
                    <div className="w-full text-center text-sm text-white/40 py-2 capitalize">
                      {enrollment.status}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}