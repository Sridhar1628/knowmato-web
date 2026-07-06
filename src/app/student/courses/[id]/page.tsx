'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
  getCourse,
  checkEnrollment,
  purchaseCourse,
  type Course,
  type Enrollment,
} from '@/services/v2Service'; // adjust path if needed

export default function CourseDetailPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const courseId = Number(params.id); // assumes route is /courses/[id]

  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollMessage, setEnrollMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId || isNaN(courseId)) {
      setError(t('common.invalidId') || 'Invalid course ID');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch course detail and enrollment status in parallel
        const [courseData, enrollmentData] = await Promise.all([
          getCourse(courseId),
          checkEnrollment(courseId).catch(() => null), // if not enrolled, ignore error
        ]);

        setCourse(courseData);
        setEnrollment(enrollmentData);
      } catch (err: any) {
        setError(err?.message || t('common.error') || 'Failed to load course');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId, t]);

  const handleEnroll = async () => {
    if (!course) return;
    setEnrolling(true);
    setEnrollMessage(null);
    try {
      const result = await purchaseCourse(course.id);
      setEnrollment(result); // or refetch enrollment
      setEnrollMessage(t('common.enrollSuccess') || 'Successfully enrolled!');
      // Optionally redirect to learning page after a short delay
      // setTimeout(() => router.push(`/learning/${course.id}`), 1500);
    } catch (err: any) {
      setEnrollMessage(err?.response?.data?.detail || err?.message || 'Enrollment failed');
    } finally {
      setEnrolling(false);
    }
  };

  // --- Loading state ---
  if (loading) {
    return (
      <div className="min-h-screen bg-black/90 p-6 text-white animate-pulse">
        <div className="mx-auto max-w-4xl">
          <div className="h-64 rounded-2xl bg-white/10" />
          <div className="mt-6 h-8 w-3/4 rounded bg-white/10" />
          <div className="mt-4 h-4 w-1/2 rounded bg-white/10" />
          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="h-20 rounded-xl bg-white/10" />
            <div className="h-20 rounded-xl bg-white/10" />
            <div className="h-20 rounded-xl bg-white/10" />
          </div>
        </div>
      </div>
    );
  }

  // --- Error state ---
  if (error) {
    return (
      <div className="min-h-screen bg-black/90 p-6 flex items-center justify-center">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center max-w-md">
          <p className="text-red-300 text-lg">{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 rounded-lg bg-white/10 px-6 py-2 text-white hover:bg-white/20"
          >
            {t('common.goBack') || 'Go Back'}
          </button>
        </div>
      </div>
    );
  }

  // --- Course not found ---
  if (!course) {
    return (
      <div className="min-h-screen bg-black/90 p-6 flex items-center justify-center">
        <div className="text-center text-white/50">
          <p>{t('common.courseNotFound') || 'Course not found'}</p>
          <button
            onClick={() => router.push('/courses')}
            className="mt-4 text-violet-400 underline"
          >
            {t('common.browseCourses') || 'Browse Courses'}
          </button>
        </div>
      </div>
    );
  }

  // --- Main course detail ---
  const isEnrolled = enrollment && enrollment.status === 'active';

  return (
    <div className="min-h-screen bg-black/90 text-white">
      {/* Hero Banner */}
      <div
        className="relative h-64 w-full bg-cover bg-center"
        style={{
          backgroundImage: course.banner
            ? `url(${course.banner})`
            : course.thumbnail
            ? `url(${course.thumbnail})`
            : 'linear-gradient(135deg, #4c1d95, #be185d)',
        }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        <div className="relative mx-auto max-w-4xl px-6 pt-16">
          <button
            onClick={() => router.back()}
            className="mb-4 inline-flex items-center text-sm text-white/70 hover:text-white"
          >
            ← {t('common.back') || 'Back'}
          </button>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold md:text-4xl">{course.title}</h1>
              {course.subtitle && (
                <p className="mt-2 text-lg text-white/80">{course.subtitle}</p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/70">
                {course.instructor_name && (
                  <span>👤 {course.instructor_name}</span>
                )}
                {course.category_name && (
                  <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-violet-200">
                    {course.category_name}
                  </span>
                )}
                <span className="capitalize">{course.difficulty}</span>
                <span>🌐 {course.language}</span>
              </div>
            </div>

            {/* Price & CTA */}
            <div className="rounded-xl bg-white/10 backdrop-blur-md p-5 shadow-lg">
              {course.discounted_price ? (
                <div className="mb-2">
                  <span className="text-2xl font-bold">${course.discounted_price}</span>
                  <span className="ml-2 text-sm text-white/50 line-through">${course.price}</span>
                </div>
              ) : (
                <div className="mb-2 text-2xl font-bold">
                  {course.price === 0 ? t('common.free') || 'Free' : `$${course.price}`}
                </div>
              )}

              {isEnrolled ? (
                <button
                  onClick={() => router.push(`/student/knowmato-plus/${course.id}`)}
                  className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 font-bold text-white transition hover:opacity-90"
                >
                  {t('common.continueLearning') || 'Continue Learning'}
                </button>
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="w-full rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-3 font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {enrolling
                    ? t('common.enrolling') || 'Enrolling...'
                    : t('common.enrollNow') || 'Enroll Now'}
                </button>
              )}

              {enrollMessage && (
                <p className="mt-2 text-center text-sm text-green-400">{enrollMessage}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Body */}
      <div className="mx-auto max-w-4xl px-6 py-10">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
            <p className="text-2xl font-bold">{course.total_lectures}</p>
            <p className="text-xs text-white/60">{t('common.lectures') || 'Lectures'}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
            <p className="text-2xl font-bold">{course.duration_hours}h</p>
            <p className="text-xs text-white/60">{t('common.duration') || 'Duration'}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
            <p className="text-2xl font-bold">{course.total_students}</p>
            <p className="text-xs text-white/60">{t('common.students') || 'Students'}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
            <p className="text-2xl font-bold">⭐ {course.average_rating}</p>
            <p className="text-xs text-white/60">
              ({course.total_reviews} {t('common.reviews') || 'reviews'})
            </p>
          </div>
        </div>

        {/* Description */}
        <div className="mt-10">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300">
            {t('common.aboutThisCourse') || 'About This Course'}
          </h2>
          <p className="mt-4 text-white/80 whitespace-pre-line">{course.description}</p>
        </div>

        {/* What you'll learn */}
        {course.learning_outcomes && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-white">
              {t('common.whatYouWillLearn') || 'What You Will Learn'}
            </h2>
            <p className="mt-2 text-white/80 whitespace-pre-line">{course.learning_outcomes}</p>
          </div>
        )}

        {/* Prerequisites */}
        {course.prerequisites && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-white">
              {t('common.prerequisites') || 'Prerequisites'}
            </h2>
            <p className="mt-2 text-white/80 whitespace-pre-line">{course.prerequisites}</p>
          </div>
        )}

        {/* Target Audience */}
        {course.target_audience && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-white">
              {t('common.targetAudience') || 'Target Audience'}
            </h2>
            <p className="mt-2 text-white/80 whitespace-pre-line">{course.target_audience}</p>
          </div>
        )}

        {/* Certificate */}
        {course.certificate_available && (
          <div className="mt-8 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-300">
            🎓 {t('common.certificateAvailable') || 'Certificate of completion available'}
          </div>
        )}

        {/* Additional info */}
        <div className="mt-10 border-t border-white/10 pt-6 text-sm text-white/50">
          <p>
            {t('common.createdAt') || 'Created'}:{' '}
            {new Date(course.created_at).toLocaleDateString()}
          </p>
          {course.updated_at && (
            <p className="mt-1">
              {t('common.lastUpdated') || 'Last updated'}:{' '}
              {new Date(course.updated_at).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}