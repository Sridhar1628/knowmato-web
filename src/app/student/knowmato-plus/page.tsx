'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { RootState } from '@/redux/store';
import { getKnowMatoPlusDashboard } from '@/services/v2Service';   // adjust import
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

// ---------- Types (from service) ----------
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

interface DashboardJobSummary {
  total: number;
  shortlisted: number;
  interview: number;
  offered: number;
  rejected: number;
}

interface DashboardInternshipSummary {
  total: number;
  shortlisted: number;
  interview: number;
  selected: number;
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
  job_application_summary: DashboardJobSummary;
  internship_application_summary: DashboardInternshipSummary;
  recent_announcements: DashboardAnnouncement[];
  recommended_courses: DashboardRecommendedCourse[];
}

// ---------- Component ----------
export default function KnowMatoPlusDashboard() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useSelector((state: RootState) => state.auth.user);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await getKnowMatoPlusDashboard();
        if (res.success && res.data) {
          setData(res.data);
        } else {
          throw new Error(res.message || 'Failed to load dashboard');
        }
      } catch (error: any) {
        toast.error(error.message || t('dashboard.loadError'));
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // ---------- Loading ----------
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-violet-400 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-white/70">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex items-center justify-center">
        <p className="text-white">{t('dashboard.noData')}</p>
      </div>
    );
  }

  const { stats, enrollments, recent_quiz_attempts, job_application_summary, internship_application_summary, recent_announcements, recommended_courses } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
      <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:py-10">
        {/* Welcome Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-fuchsia-300">
              {t('knowmatoPlus.welcomeBack', { name: data.user.display_name || data.user.username })}
            </h1>
            <p className="text-white/60 text-sm mt-1">{t('knowmatoPlus.heroSubtitle')}</p>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-3">
            <button
              onClick={() => router.push('/student/knowmato-plus/courses')}
              className="rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/25 hover:from-violet-600 hover:to-fuchsia-600 transition"
            >
              📚 {t('knowmatoPlus.browseCourses')}
            </button>
            <button
              onClick={() => router.push('/student/knowmato-plus/jobs')}
              className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition"
            >
              💼 {t('knowmatoPlus.findJobs')}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {/* Enrolled Courses */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-2xl text-center">
            <div className="text-3xl font-black bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              {stats.enrolled_courses}
            </div>
            <div className="text-xs text-white/60 mt-1 font-medium">{t('knowmatoPlus.enrolledCourses')}</div>
          </div>

          {/* Completed */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-2xl text-center">
            <div className="text-3xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              {stats.completed_enrollments}
            </div>
            <div className="text-xs text-white/60 mt-1 font-medium">{t('knowmatoPlus.completed')}</div>
          </div>

          {/* Certificates */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-2xl text-center">
            <div className="text-3xl font-black bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              {stats.certificates_count}
            </div>
            <div className="text-xs text-white/60 mt-1 font-medium">{t('knowmatoPlus.certificates')}</div>
          </div>

          {/* Wishlist */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 shadow-2xl text-center">
            <div className="text-3xl font-black bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent">
              {stats.wishlist_count}
            </div>
            <div className="text-xs text-white/60 mt-1 font-medium">{t('knowmatoPlus.wishlist')}</div>
          </div>
        </div>

        {/* Row: Continue Learning & Quiz Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Continue Learning (Enrollments) */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              📖 {t('knowmatoPlus.continueLearning')}
              {enrollments.length > 0 && (
                <span className="text-xs bg-violet-400/20 text-violet-300 px-2 py-0.5 rounded-full">
                  {enrollments.filter(e => e.status === 'active').length} {t('knowmatoPlus.active')}
                </span>
              )}
            </h2>

            {enrollments.length === 0 ? (
              <div className="text-center py-8 text-white/50">
                <p>{t('knowmatoPlus.noEnrollments')}</p>
                <button
                  onClick={() => router.push('/student/knowmato-plus/courses')}
                  className="mt-3 text-sm text-violet-400 underline hover:text-violet-300"
                >
                  {t('knowmatoPlus.exploreCourses')}
                </button>
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {enrollments.slice(0, 6).map((enr) => (
                  <button
                    key={enr.enrollment_id}
                    onClick={() => router.push(`/student/knowmato-plus/courses/${enr.course_slug}`)}
                    className="min-w-[220px] flex-shrink-0 rounded-xl bg-white/5 border border-white/10 p-4 text-left hover:border-violet-400/40 transition transform hover:-translate-y-1"
                  >
                    <img
                      src={enr.thumbnail || '/placeholder-course.jpg'}
                      alt={enr.course_title}
                      className="w-full h-24 object-cover rounded-lg mb-2"
                    />
                    <h3 className="font-semibold text-white line-clamp-1">{enr.course_title}</h3>
                    <div className="mt-2 flex items-center gap-2 text-xs text-white/60">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          enr.status === 'active' ? 'bg-emerald-400/20 text-emerald-300' : 'bg-amber-400/20 text-amber-300'
                        }`}
                      >
                        {t(`enrollment.status.${enr.status}`)}
                      </span>
                      <span>{enr.progress_percentage}%</span>
                    </div>
                    <div className="mt-3 w-full bg-white/10 rounded-full h-1.5">
                      <div
                        className="bg-gradient-to-r from-violet-400 to-fuchsia-400 h-1.5 rounded-full"
                        style={{ width: `${enr.progress_percentage}%` }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quiz Performance */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              🧠 {t('knowmatoPlus.quizPerformance')}
              {stats.quiz_attempts > 0 && (
                <span className="text-xs bg-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded-full">
                  {stats.quiz_passed} / {stats.quiz_attempts} {t('knowmatoPlus.passed')}
                </span>
              )}
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-white/5 rounded-xl border border-white/10">
                <p className="text-2xl font-bold text-cyan-400">{stats.avg_quiz_percentage}%</p>
                <p className="text-xs text-white/50">{t('knowmatoPlus.avgScore')}</p>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-xl border border-white/10">
                <p className="text-2xl font-bold text-emerald-400">{stats.quiz_passed}</p>
                <p className="text-xs text-white/50">{t('knowmatoPlus.quizzesPassed')}</p>
              </div>
            </div>

            {recent_quiz_attempts.length === 0 ? (
              <p className="text-white/50 text-sm text-center">{t('knowmatoPlus.noQuizAttempts')}</p>
            ) : (
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {recent_quiz_attempts.slice(0, 4).map((attempt, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-sm bg-white/5 rounded-lg px-3 py-2 border border-white/10"
                  >
                    <span className="text-white truncate mr-2">{attempt.quiz_title}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${attempt.is_passed ? 'text-emerald-400' : 'text-red-400'}`}>
                        {attempt.percentage}%
                      </span>
                      <span className="text-xs text-white/40">
                        {t('knowmatoPlus.attempt')} {attempt.attempt_number}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Job & Internship Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Jobs */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              💼 {t('knowmatoPlus.jobApplications')}
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/5 p-3 rounded-xl text-center border border-white/10">
                <p className="text-2xl font-bold text-violet-400">{job_application_summary.total}</p>
                <p className="text-xs text-white/50">{t('knowmatoPlus.total')}</p>
              </div>
              <div className="bg-white/5 p-3 rounded-xl text-center border border-white/10">
                <p className="text-2xl font-bold text-emerald-400">{job_application_summary.shortlisted}</p>
                <p className="text-xs text-white/50">{t('knowmatoPlus.shortlisted')}</p>
              </div>
              <div className="bg-white/5 p-3 rounded-xl text-center border border-white/10">
                <p className="text-2xl font-bold text-amber-400">{job_application_summary.interview}</p>
                <p className="text-xs text-white/50">{t('knowmatoPlus.interviews')}</p>
              </div>
            </div>
            {job_application_summary.total === 0 ? (
              <p className="text-white/50 text-sm text-center mt-4">{t('knowmatoPlus.noJobApps')}</p>
            ) : (
              <button
                onClick={() => router.push('/student/knowmato-plus/my-jobs')}
                className="mt-4 w-full text-center text-sm text-violet-300 hover:text-violet-200 font-semibold"
              >
                {t('knowmatoPlus.viewAllJobs')} →
              </button>
            )}
          </div>

          {/* Internships */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              🎓 {t('knowmatoPlus.internshipApplications')}
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/5 p-3 rounded-xl text-center border border-white/10">
                <p className="text-2xl font-bold text-violet-400">{internship_application_summary.total}</p>
                <p className="text-xs text-white/50">{t('knowmatoPlus.total')}</p>
              </div>
              <div className="bg-white/5 p-3 rounded-xl text-center border border-white/10">
                <p className="text-2xl font-bold text-emerald-400">{internship_application_summary.shortlisted}</p>
                <p className="text-xs text-white/50">{t('knowmatoPlus.shortlisted')}</p>
              </div>
              <div className="bg-white/5 p-3 rounded-xl text-center border border-white/10">
                <p className="text-2xl font-bold text-amber-400">{internship_application_summary.interview}</p>
                <p className="text-xs text-white/50">{t('knowmatoPlus.interviews')}</p>
              </div>
            </div>
            {internship_application_summary.total === 0 ? (
              <p className="text-white/50 text-sm text-center mt-4">{t('knowmatoPlus.noInternshipApps')}</p>
            ) : (
              <button
                onClick={() => router.push('/student/knowmato-plus/my-internships')}
                className="mt-4 w-full text-center text-sm text-violet-300 hover:text-violet-200 font-semibold"
              >
                {t('knowmatoPlus.viewAllInternships')} →
              </button>
            )}
          </div>
        </div>

        {/* Announcements */}
        {recent_announcements.length > 0 && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-2xl mb-8">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              📢 {t('knowmatoPlus.latestAnnouncements')}
            </h2>
            <div className="space-y-3">
              {recent_announcements.map((ann) => (
                <div key={ann.id} className="p-3 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-white text-sm">{ann.title}</p>
                      <p className="text-xs text-white/50 mt-0.5">{ann.course_title}</p>
                    </div>
                    <span className="text-[10px] text-white/40 ml-2 whitespace-nowrap">
                      {new Date(ann.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-white/70 mt-1 line-clamp-2">{ann.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Courses */}
        {recommended_courses.length > 0 && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-2xl mb-8">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              🌟 {t('knowmatoPlus.recommendedForYou')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommended_courses.map((course) => (
                <button
                  key={course.id}
                  onClick={() => router.push(`/student/knowmato-plus/courses/${course.slug}`)}
                  className="flex flex-col bg-white/5 rounded-xl border border-white/10 p-4 hover:border-violet-400/40 transition transform hover:-translate-y-1"
                >
                  <img
                    src={course.thumbnail || '/placeholder-course.jpg'}
                    alt={course.title}
                    className="w-full h-28 object-cover rounded-lg mb-3"
                  />
                  <h3 className="font-semibold text-white text-sm line-clamp-2">{course.title}</h3>
                  <p className="text-xs text-white/50 mt-1">{course.instructor}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-amber-400">⭐ {course.rating}</span>
                    <span className="text-xs text-white/60">{course.students} {t('knowmatoPlus.students')}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    {course.discounted_price ? (
                      <>
                        <span className="text-sm font-bold text-emerald-400">₹{course.discounted_price}</span>
                        <span className="text-xs text-white/40 line-through">₹{course.price}</span>
                      </>
                    ) : course.course_type === 'free' ? (
                      <span className="text-sm font-bold text-emerald-400">{t('knowmatoPlus.free')}</span>
                    ) : (
                      <span className="text-sm font-bold text-white">₹{course.price}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer / Quick Links */}
        <div className="flex flex-wrap justify-center gap-4 text-sm text-white/40">
          <button onClick={() => router.push('/student/knowmato-plus/courses')} className="hover:text-violet-300">{t('knowmatoPlus.allCourses')}</button>
          <button onClick={() => router.push('/student/knowmato-plus/jobs')} className="hover:text-violet-300">{t('knowmatoPlus.allJobs')}</button>
          <button onClick={() => router.push('/student/knowmato-plus/internships')} className="hover:text-violet-300">{t('knowmatoPlus.allInternships')}</button>
          <button onClick={() => router.push('/student/knowmato-plus/certificates')} className="hover:text-violet-300">{t('knowmatoPlus.myCertificates')}</button>
          <button onClick={() => router.push('/student/knowmato-plus/wishlist')} className="hover:text-violet-300">{t('knowmatoPlus.myWishlist')}</button>
        </div>
      </div>
    </div>
  );
}