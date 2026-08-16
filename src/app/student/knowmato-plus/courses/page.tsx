"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getCourses,
  getCourseEnrollmentStatus,
  purchaseCourse,
  type Course,
  type CourseEnrollmentStatus
} from "@/services/v2Service";
import { getMyCreditBalances } from "@/services/v2Service";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

export default function KnowmatoPlusCoursesPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<number> | null>(null);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  const [enrollLoading, setEnrollLoading] = useState(false);

  // Latest progress returned by the enrollment-status API.
  // courseId -> progress percentage (0..100)
  const [courseProgress, setCourseProgress] = useState<Record<number, number>>({});

  const [courseCredits, setCourseCredits] = useState<number>(0);
  const [creditsLoading, setCreditsLoading] = useState(true);

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        setEnrolledCourseIds(null);
        setCourseProgress({});

        const [coursesData, balanceRes] = await Promise.all([
          getCourses(),
          getMyCreditBalances().catch(() => ({
            data: {
              balance: "0.00",
            },
          })),
        ]);

        setCourses(coursesData);
        setCourseCredits(Number(balanceRes.data.balance) || 0);
        setCreditsLoading(false);

        setEnrollmentLoading(true);

        const statusPromises = coursesData.map(async (course) => {
          try {
            const rawStatus = await getCourseEnrollmentStatus(course.id);

            // Support both:
            // 1. { is_enrolled, progress_percentage }
            // 2. { data: { is_enrolled, progress_percentage } }
            const status: CourseEnrollmentStatus = (() => {
              if (
                rawStatus &&
                typeof rawStatus === "object" &&
                "data" in rawStatus
              ) {
                const data = (rawStatus as { data?: unknown }).data;

                if (data && typeof data === "object") {
                  return data as CourseEnrollmentStatus;
                }
              }

              return rawStatus;
            })();
            const enrolled = Boolean(status?.is_enrolled);

            const rawProgress = status?.progress_percentage ?? 0;

            const numericProgress = Number(rawProgress);
            const progress = Number.isFinite(numericProgress)
              ? Math.min(100, Math.max(0, numericProgress))
              : 0;

            console.log(`COURSE ${course.id} ENROLLMENT STATUS:`, {
              is_enrolled: enrolled,
              progress_percentage: progress,
              raw: rawStatus,
            });

            return {
              id: course.id,
              enrolled,
              progress,
            };
          } catch (error) {
            console.error(`COURSE ${course.id} ENROLLMENT STATUS ERROR:`, error);

            return {
              id: course.id,
              enrolled: false,
              progress: 0,
            };
          }
        });

        const results = await Promise.all(statusPromises);

        const enrolledIds = new Set<number>();
        const progressMap: Record<number, number> = {};

        results.forEach((result) => {
          if (result.enrolled) {
            enrolledIds.add(result.id);
          }

          progressMap[result.id] = result.progress;
        });

        setEnrolledCourseIds(enrolledIds);
        setCourseProgress(progressMap);
      } catch (err: any) {
        setError(err?.message || t("knowmatoCourses.loadError"));
        console.error(err);
      } finally {
        setLoading(false);
        setEnrollmentLoading(false);
      }
    };
    fetchData();
  }, [t]);

  const handleCardClick = (courseId: number) => {
    router.push(`/student/knowmato-plus/${courseId}`);
  };

  const openEnrollModal = (course: Course) => {
    setSelectedCourse(course);
    setShowEnrollModal(true);
  };

  const handleEnroll = async () => {
    if (!selectedCourse) return;
    setEnrollLoading(true);
    try {
      await purchaseCourse(selectedCourse.id);
      toast.success(t("knowmatoCourses.enrollSuccess"));
      setEnrolledCourseIds((prev) => {
        const next = new Set(prev ?? []);
        next.add(selectedCourse.id);
        return next;
      });

      setCourseProgress((prev) => ({
        ...prev,
        [selectedCourse.id]: 0,
      }));
      const balanceRes = await getMyCreditBalances();
      setCourseCredits(Number(balanceRes.data.balance) || 0);
      setShowEnrollModal(false);
      setSelectedCourse(null);
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        t("knowmatoCourses.enrollFailed");
      toast.error(msg);
    } finally {
      setEnrollLoading(false);
    }
  };

  const canEnroll = (course: Course) => {
    if (course.course_type === "free") return true;
    return courseCredits >= (course.course_credit_cost ?? 0);
  };

  const getDisplayedProgress = (course: Course): number => {
    const apiProgress = courseProgress[course.id];

    if (typeof apiProgress === "number" && Number.isFinite(apiProgress)) {
      return Math.min(100, Math.max(0, apiProgress));
    }

    const courseProgressValue = Number(
      (course as Course & { progress_percentage?: number | string })
        .progress_percentage ?? 0
    );

    return Number.isFinite(courseProgressValue)
      ? Math.min(100, Math.max(0, courseProgressValue))
      : 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
      <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

      <div className="relative z-10 p-6 text-white">
        {/* Header with credit balance */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 md:text-3xl">
              {t("knowmatoCourses.title")}
            </h1>
            <p className="mt-1 text-white/70">{t("knowmatoCourses.subtitle")}</p>
          </div>
          {!creditsLoading && (
            <div className="rounded-xl bg-violet-500/10 border border-violet-500/30 px-4 py-2 text-sm backdrop-blur-md">
              <span className="text-violet-300">{t("knowmatoCourses.availableCredits")}:</span>{" "}
              <span className="font-bold text-white">{courseCredits.toFixed(2)}</span>
            </div>
          )}
          {creditsLoading && (
            <div className="h-9 w-48 animate-pulse rounded-xl bg-white/10" />
          )}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl animate-pulse"
              >
                <div className="h-40 rounded-lg bg-white/10" />
                <div className="mt-4 h-5 w-3/4 rounded bg-white/10" />
                <div className="mt-2 h-4 w-1/2 rounded bg-white/10" />
                <div className="mt-4 h-9 w-24 rounded bg-white/10" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center backdrop-blur-md">
            <p className="text-red-300">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 text-sm underline hover:text-white"
            >
              {t("knowmatoCourses.retry")}
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && courses.length === 0 && (
          <div className="mt-8 text-center text-white/50">
            <p>{t("knowmatoCourses.noCourses")}</p>
          </div>
        )}

        {/* Course cards */}
        {!loading && !error && courses.length > 0 && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => {
              const isEnrolled = enrolledCourseIds?.has(course.id) ?? false;
              const statusLoading = enrolledCourseIds === null || enrollmentLoading;
              const progress = getDisplayedProgress(course);

              const insufficientBalance =
                !isEnrolled &&
                course.course_type !== "free" &&
                !canEnroll(course);

              return (
                <div
                  key={course.id}
                  className={`rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl transition ${
                    isEnrolled
                      ? "hover:border-violet-500/30 cursor-pointer hover:-translate-y-1 hover:shadow-xl"
                      : "hover:border-white/15"
                  }`}
                  onClick={() => {
                    if (isEnrolled) {
                      handleCardClick(course.id);
                    }
                  }}
                >
                  <div
                    className="h-40 rounded-lg bg-cover bg-center"
                    style={{
                      backgroundImage: course.thumbnail
                        ? `url(${course.thumbnail})`
                        : "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(217,70,239,0.3))",
                    }}
                  />

                  <h3 className="mt-4 text-lg font-bold text-white line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="mt-1 text-sm text-white/60 line-clamp-2">
                    {course.subtitle || course.description}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/50">
                    {course.category_name && (
                      <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-violet-200 border border-violet-400/30">
                        {course.category_name}
                      </span>
                    )}
                    {course.instructor_name && (
                      <span>{t("knowmatoCourses.byInstructor", { instructor: course.instructor_name })}</span>
                    )}
                    <span className="capitalize">{course.difficulty}</span>
                  </div>

                  {isEnrolled && !statusLoading && (
                    <div className="mt-4">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-xs text-white/50">
                          {t("knowmatoCourses.progress", "Progress")}
                        </span>

                        <span className="text-xs font-bold text-violet-300">
                          {progress.toFixed(0)}%
                        </span>
                      </div>

                      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      <p className="mt-1 text-[11px] text-white/40">
                        {progress >= 100
                          ? t("knowmatoCourses.courseCompleted", "Course completed")
                          : t("knowmatoCourses.progressCompleted", "{{progress}}% completed", {
                              progress: progress.toFixed(0),
                            })}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-cyan-300 text-sm font-semibold border border-cyan-400/30">
                        {course.course_type === "free"
                          ? t("knowmatoCourses.free")
                          : t("knowmatoCourses.creditCost", { cost: course.course_credit_cost })}
                      </span>
                    </div>
                    {statusLoading ? (
                      <div className="w-24 h-9 rounded-lg bg-white/10 animate-pulse" />
                    ) : isEnrolled ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/student/knowmato-plus/${course.id}`);
                        }}
                        className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-sm font-bold text-white transition hover:opacity-90 shadow-lg shadow-emerald-500/25"
                      >
                        {progress > 0 && progress < 100
                          ? t("knowmatoCourses.continueLearning", "Continue Learning")
                          : progress >= 100
                          ? t("knowmatoCourses.completed", "Completed")
                          : t("knowmatoCourses.goToCourse")}
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEnrollModal(course);
                        }}
                        disabled={insufficientBalance && !creditsLoading}
                        title={insufficientBalance ? t("knowmatoCourses.insufficientCreditsTooltip") : ""}
                        className={`rounded-lg px-4 py-2 text-sm font-bold text-white transition ${
                          insufficientBalance
                            ? "bg-gray-500/50 cursor-not-allowed opacity-70"
                            : "bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:opacity-90 shadow-lg shadow-violet-500/25"
                        }`}
                      >
                        {t("knowmatoCourses.enrollButton")}
                      </button>
                    )}
                  </div>
                  {insufficientBalance && (
                    <p className="mt-2 text-xs text-rose-400">
                      {t("knowmatoCourses.insufficientCreditsMessage", {
                        needed: course.course_credit_cost,
                        current: courseCredits,
                      })}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Enroll Modal */}
        {showEnrollModal && selectedCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-3xl border border-white/20 bg-white/5 backdrop-blur-xl p-6 shadow-2xl">
              <h2 className="text-xl font-bold text-white">
                {t("knowmatoCourses.enrollModalTitle", { title: selectedCourse.title })}
              </h2>
              <p className="mt-2 text-white/70">
                {selectedCourse.subtitle || selectedCourse.description}
              </p>

              <div className="mt-4 flex items-center gap-3">
                <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-cyan-300 text-sm font-semibold border border-cyan-400/30">
                  {selectedCourse.course_type === "free"
                    ? t("knowmatoCourses.free")
                    : t("knowmatoCourses.creditCost", { cost: selectedCourse.course_credit_cost })}
                </span>
                {selectedCourse.course_type !== "free" && (
                  <span className="text-sm text-white/50">
                    {t("knowmatoCourses.yourBalance", { balance: courseCredits })}
                  </span>
                )}
              </div>

              <div className="mt-4 rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-3">
                {selectedCourse.course_type === "free" ? (
                  <p className="text-sm text-cyan-300">{t("knowmatoCourses.freeCourseMessage")}</p>
                ) : !canEnroll(selectedCourse) ? (
                  <p className="text-sm text-rose-400">
                    {t("knowmatoCourses.insufficientBalanceModal", {
                      needed: selectedCourse.course_credit_cost,
                      current: courseCredits,
                    })}
                  </p>
                ) : (
                  <p className="text-sm text-cyan-300">
                    {t("knowmatoCourses.deductionMessage", {
                      cost: selectedCourse.course_credit_cost,
                    })}
                  </p>
                )}
              </div>

              <div className="mt-6 flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowEnrollModal(false);
                    setSelectedCourse(null);
                  }}
                  disabled={enrollLoading}
                  className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20 disabled:opacity-50"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={handleEnroll}
                  disabled={enrollLoading || (selectedCourse.course_type !== "free" && !canEnroll(selectedCourse))}
                  className="rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-2 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/25"
                >
                  {enrollLoading ? t("knowmatoCourses.enrolling") : t("knowmatoCourses.confirmEnrollment")}
                </button>
              </div>
            </div>
          </div>
        )}
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