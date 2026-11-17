"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

import {
  getCourses,
  getCourseEnrollmentStatus,
  purchaseCourse,
  type Course,
  getMyCreditBalances,
} from "@/services/v2Service";

import AlertService from "@/services/alertService";

type NormalizedEnrollment = {
  found: boolean;
  enrolled: boolean;
  progress: number;
};

function normalizeEnrollmentResponse(input: unknown): NormalizedEnrollment {
  const queue: unknown[] = [input];
  const seen = new Set<object>();
  let progressValue: unknown = 0;

  while (queue.length) {
    const current = queue.shift();
    if (!current || typeof current !== "object") continue;
    if (seen.has(current as object)) continue;
    seen.add(current as object);

    const record = current as Record<string, unknown>;
    const enrollmentKeys = [
      "is_enrolled",
      "isEnrolled",
      "enrolled",
      "is_enrolled_in_course",
      "has_enrolled",
    ];

    for (const key of enrollmentKeys) {
      if (typeof record[key] === "boolean") {
        const rawProgress =
          record.progress_percentage ??
          record.progress ??
          record.completion_percentage ??
          progressValue;
        const parsedProgress = Number(rawProgress);
        return {
          found: true,
          enrolled: record[key] as boolean,
          progress: Number.isFinite(parsedProgress)
            ? Math.min(100, Math.max(0, parsedProgress))
            : 0,
        };
      }
    }

    const statusText = String(
      record.enrollment_status ?? record.enrollmentStatus ?? ""
    ).toLowerCase();
    if (statusText) {
      const enrolled = ["enrolled", "active", "completed", "success"].includes(statusText);
      const notEnrolled = ["not_enrolled", "not enrolled", "unenrolled", "inactive", "pending"].includes(statusText);
      if (enrolled || notEnrolled) {
        const parsedProgress = Number(
          record.progress_percentage ?? record.progress ?? progressValue
        );
        return {
          found: true,
          enrolled,
          progress: Number.isFinite(parsedProgress)
            ? Math.min(100, Math.max(0, parsedProgress))
            : 0,
        };
      }
    }

    if (
      record.progress_percentage !== undefined ||
      record.progress !== undefined
    ) {
      progressValue =
        record.progress_percentage ?? record.progress ?? progressValue;
    }

    for (const [key, value] of Object.entries(record)) {
      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value)
      ) {
        queue.push(value);
      } else if (Array.isArray(value)) {
        for (const item of value) {
          if (item && typeof item === "object") queue.push(item);
        }
      }
    }
  }

  return { found: false, enrolled: false, progress: 0 };
}

export default function KnowmatoPlusCoursesPage() {
  const { t } = useTranslation();
  const router = useRouter();

  // -----------------------------------------------------------------------
  // State
  // -----------------------------------------------------------------------

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState<"all" | "free" | "paid">("all");

  const [enrolledCourseIds, setEnrolledCourseIds] =
    useState<Set<number> | null>(null);

  const [enrollmentLoading, setEnrollmentLoading] =
    useState(false);

  const [enrollLoading, setEnrollLoading] =
    useState(false);

  // courseId -> progress percentage
  const [courseProgress, setCourseProgress] =
    useState<Record<number, number>>({});

  const [courseCredits, setCourseCredits] =
    useState<number>(0);

  const [creditsLoading, setCreditsLoading] =
    useState(true);

  const [selectedCourse, setSelectedCourse] =
    useState<Course | null>(null);

  const [showEnrollModal, setShowEnrollModal] =
    useState(false);

  // -----------------------------------------------------------------------
  // Fetch courses, credit balance and enrollment status
  // -----------------------------------------------------------------------

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        setEnrolledCourseIds(null);
        setCourseProgress({});

        // ---------------------------------------------------------------
        // Fetch courses + credit balance
        // ---------------------------------------------------------------

        const [coursesData, balanceRes] =
          await Promise.all([
            getCourses(),
            getMyCreditBalances().catch(() => ({
              data: {
                balance: "0.00",
              },
            })),
          ]);

        setCourses(
          Array.isArray(coursesData)
            ? coursesData
            : [],
        );

        setCourseCredits(
          Number(balanceRes?.data?.balance) || 0,
        );

        setCreditsLoading(false);

        // ---------------------------------------------------------------
        // Fetch enrollment status for every course
        // ---------------------------------------------------------------

        setEnrollmentLoading(true);

        const statusPromises = (
          Array.isArray(coursesData)
            ? coursesData
            : []
        ).map(async (course) => {
          try {
            const rawStatus =
              await getCourseEnrollmentStatus(
                course.id,
              );

            const normalized = normalizeEnrollmentResponse(rawStatus);
            const enrolled = normalized.enrolled;
            const progress = normalized.progress;

            console.log(
              `COURSE ${course.id} ENROLLMENT STATUS:`,
              {
                is_enrolled: enrolled,
                progress_percentage:
                  progress,
                raw: rawStatus,
              },
            );

            return {
              id: course.id,
              enrolled,
              progress,
            };
          } catch (statusError) {
            console.error(
              `COURSE ${course.id} ENROLLMENT STATUS ERROR:`,
              statusError,
            );

            return {
              id: course.id,
              enrolled: false,
              progress: 0,
            };
          }
        });

        const results =
          await Promise.all(
            statusPromises,
          );

        // ---------------------------------------------------------------
        // Build enrollment + progress maps
        // ---------------------------------------------------------------

        const enrolledIds =
          new Set<number>();

        const progressMap: Record<
          number,
          number
        > = {};

        results.forEach((result) => {
          if (result.enrolled) {
            enrolledIds.add(
              result.id,
            );
          }

          progressMap[result.id] =
            result.progress;
        });

        setEnrolledCourseIds(
          enrolledIds,
        );

        setCourseProgress(
          progressMap,
        );
      } catch (err: any) {
        console.error(
          "KNOWMATO COURSES FETCH ERROR:",
          err,
        );

        const errorMessage =
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          t(
            "knowmatoCourses.loadError",
            "Unable to load courses.",
          );

        setError(errorMessage);

        // ---------------------------------------------------------------
        // AlertService.error accepts TWO arguments.
        // ---------------------------------------------------------------

        AlertService.error(
          "Unable to Load Courses",
          errorMessage,
        );
      } finally {
        setLoading(false);
        setEnrollmentLoading(false);
        setCreditsLoading(false);
      }
    };

    fetchData();
  }, [t]);

  // -----------------------------------------------------------------------
  // Open course
  // -----------------------------------------------------------------------

  const handleCardClick = (
    courseId: number,
  ) => {
    router.push(
      `/student/knowmato-plus/courses/${courseId}`,
    );
  };

  // -----------------------------------------------------------------------
  // Open enrollment modal
  // -----------------------------------------------------------------------

  const openEnrollModal = (
    course: Course,
  ) => {
    setSelectedCourse(course);
    setShowEnrollModal(true);
  };

  // -----------------------------------------------------------------------
  // Close enrollment modal
  // -----------------------------------------------------------------------

  const closeEnrollModal = () => {
    if (enrollLoading) {
      return;
    }

    setShowEnrollModal(false);
    setSelectedCourse(null);
  };

  // -----------------------------------------------------------------------
  // Check whether user can enroll
  // -----------------------------------------------------------------------

  const canEnroll = (
    course: Course,
  ) => {
    if (
      course.course_type === "free"
    ) {
      return true;
    }

    return (
      courseCredits >=
      (course.course_credit_cost ?? 0)
    );
  };

  // -----------------------------------------------------------------------
  // Get displayed progress
  // -----------------------------------------------------------------------

  const getDisplayedProgress = (
    course: Course,
  ): number => {
    const apiProgress =
      courseProgress[course.id];

    if (
      typeof apiProgress === "number" &&
      Number.isFinite(apiProgress)
    ) {
      return Math.min(
        100,
        Math.max(
          0,
          apiProgress,
        ),
      );
    }

    const courseProgressValue =
      Number(
        (
          course as Course & {
            progress_percentage?:
              | number
              | string;
          }
        ).progress_percentage ?? 0,
      );

    return Number.isFinite(
      courseProgressValue,
    )
      ? Math.min(
          100,
          Math.max(
            0,
            courseProgressValue,
          ),
        )
      : 0;
  };

  // -----------------------------------------------------------------------
  // Enroll in course
  // -----------------------------------------------------------------------

  const handleEnroll = async () => {
    if (!selectedCourse) {
      return;
    }

    // ---------------------------------------------------------------
    // Prevent duplicate enrollment requests
    // ---------------------------------------------------------------

    if (enrollLoading) {
      return;
    }

    // ---------------------------------------------------------------
    // Validate credits before API call
    // ---------------------------------------------------------------

    if (
      selectedCourse.course_type !==
        "free" &&
      !canEnroll(selectedCourse)
    ) {
      AlertService.error(
        "Insufficient Credits",
        t(
          "knowmatoCourses.insufficientBalanceModal",
          {
            needed:
              selectedCourse.course_credit_cost,
            current:
              courseCredits,
          },
        ),
      );

      return;
    }

    setEnrollLoading(true);

    try {
      await purchaseCourse(
        selectedCourse.id,
      );

      // -------------------------------------------------------------
      // Enrollment successful
      // -------------------------------------------------------------

      AlertService.success(
        "Enrollment Successful",
        t(
          "knowmatoCourses.enrollSuccess",
        ),
      );

      setEnrolledCourseIds(
        (previous) => {
          const next = new Set(
            previous ?? [],
          );

          next.add(
            selectedCourse.id,
          );

          return next;
        },
      );

      setCourseProgress(
        (previous) => ({
          ...previous,
          [selectedCourse.id]: 0,
        }),
      );

      // -------------------------------------------------------------
      // Refresh credit balance
      // -------------------------------------------------------------

      try {
        const balanceRes =
          await getMyCreditBalances();

        setCourseCredits(
          Number(
            balanceRes?.data?.balance,
          ) || 0,
        );
      } catch (balanceError) {
        console.error(
          "CREDIT BALANCE REFRESH ERROR:",
          balanceError,
        );
      }

      // -------------------------------------------------------------
      // Close modal
      // -------------------------------------------------------------

      setShowEnrollModal(false);
      setSelectedCourse(null);
    } catch (err: any) {
      console.error(
        "COURSE ENROLLMENT ERROR:",
        err,
      );

      const message =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        t(
          "knowmatoCourses.enrollFailed",
          "Unable to enroll in this course.",
        );

      // ---------------------------------------------------------------
      // AlertService.error accepts TWO arguments.
      // ---------------------------------------------------------------

      AlertService.error(
        "Enrollment Failed",
        message,
      );
    } finally {
      setEnrollLoading(false);
    }
  };

  // -----------------------------------------------------------------------
  // Loading skeleton
  // -----------------------------------------------------------------------

  const filteredCourses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return courses.filter((course) => {
      const matchesType =
        courseFilter === "all" ||
        String(course.course_type || "").toLowerCase() === courseFilter;
      const searchable = [
        course.title,
        course.subtitle,
        course.description,
        course.category_name,
        course.instructor_name,
        course.language,
        course.difficulty,
      ].filter(Boolean).join(" ").toLowerCase();
      return matchesType && (!query || searchable.includes(query));
    });
  }, [courses, courseFilter, searchQuery]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-violet-400 border-t-transparent" />

          <p className="mt-3 text-sm text-white/70">
            {t("common.loading")}
          </p>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Main UI
  // -----------------------------------------------------------------------

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
      {/* ================================================================
          Animated background blobs
      ================================================================= */}

      <div className="absolute top-0 -left-20 h-72 w-72 animate-blob rounded-full bg-purple-500/20 blur-3xl filter mix-blend-multiply" />

      <div className="animation-delay-2000 absolute top-0 -right-20 h-72 w-72 animate-blob rounded-full bg-fuchsia-500/20 blur-3xl filter mix-blend-multiply" />

      <div className="animation-delay-4000 absolute -bottom-20 left-40 h-72 w-72 animate-blob rounded-full bg-cyan-500/20 blur-3xl filter mix-blend-multiply" />

      {/* ================================================================
          Main content
      ================================================================= */}

      <div className="relative z-10 p-6 text-white">
        {/* ==============================================================
            Header
        =============================================================== */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-2xl font-bold text-transparent md:text-3xl">
              {t(
                "knowmatoCourses.title",
              )}
            </h1>

            <p className="mt-1 text-white/70">
              {t(
                "knowmatoCourses.subtitle",
              )}
            </p>
          </div>

          {!creditsLoading && (
            <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm backdrop-blur-md">
              <span className="text-violet-300">
                {t(
                  "knowmatoCourses.availableCredits",
                )}
                :
              </span>{" "}
              <span className="font-bold text-white">
                {courseCredits.toFixed(2)}
              </span>
            </div>
          )}

          {creditsLoading && (
            <div className="h-9 w-48 animate-pulse rounded-xl bg-white/10" />
          )}
        </div>

        {/* Search and course-type filters */}
        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/40">⌕</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search courses by title, topic, instructor..."
              aria-label="Search courses"
              className="w-full rounded-xl border border-white/10 bg-[#100d2c]/70 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/40 focus:border-violet-400"
            />
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter courses">
            {(["all", "free", "paid"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setCourseFilter(filter)}
                aria-pressed={courseFilter === filter}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold capitalize transition ${
                  courseFilter === filter
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
                    : "border border-white/10 bg-white/5 text-white/65 hover:bg-white/10 hover:text-white"
                }`}
              >
                {filter === "all" ? "All Courses" : `${filter} Courses`}
              </button>
            ))}
          </div>
        </div>

        {/* ==============================================================
            Loading skeleton
        =============================================================== */}

        {loading && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({
              length: 6,
            }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl"
              >
                <div className="h-40 rounded-lg bg-white/10" />

                <div className="mt-4 h-5 w-3/4 rounded bg-white/10" />

                <div className="mt-2 h-4 w-1/2 rounded bg-white/10" />

                <div className="mt-4 h-9 w-24 rounded bg-white/10" />
              </div>
            ))}
          </div>
        )}

        {/* ==============================================================
            Error
        =============================================================== */}

        {!loading && error && (
          <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center backdrop-blur-md">
            <p className="text-red-300">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                window.location.reload()
              }
              className="mt-3 text-sm underline transition hover:text-white"
            >
              {t(
                "knowmatoCourses.retry",
              )}
            </button>
          </div>
        )}

        {/* ==============================================================
            Empty state
        =============================================================== */}

        {!loading &&
          !error &&
          filteredCourses.length === 0 && (
            <div className="mt-8 text-center text-white/50">
              <p>
                {courses.length === 0
                  ? t("knowmatoCourses.noCourses")
                  : "No courses match your search or selected filter."}
              </p>
            </div>
          )}

        {/* ==============================================================
            Course cards
        =============================================================== */}

        {!loading &&
          !error &&
          filteredCourses.length > 0 && (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map(
                (course) => {
                  const isEnrolled =
                    enrolledCourseIds?.has(
                      course.id,
                    ) ?? false;

                  const statusLoading =
                    enrolledCourseIds ===
                      null ||
                    enrollmentLoading;

                  const progress =
                    getDisplayedProgress(
                      course,
                    );

                  const insufficientBalance =
                    !isEnrolled &&
                    course.course_type !==
                      "free" &&
                    !canEnroll(course);

                  return (
                    <div
                      key={course.id}
                      role="link"
                      tabIndex={0}
                      aria-label={`View ${course.title}`}
                      className="cursor-pointer rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl transition hover:-translate-y-1 hover:border-violet-500/30 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-violet-400"
                      onClick={() => handleCardClick(course.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handleCardClick(course.id);
                        }
                      }}
                    >
                      {/* =================================================
                          Thumbnail
                      ================================================== */}

                      <div
                        className="h-40 rounded-lg bg-cover bg-center"
                        style={{
                          backgroundImage:
                            course.thumbnail
                              ? `url(${course.thumbnail})`
                              : "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(217,70,239,0.3))",
                        }}
                      />

                      {/* =================================================
                          Course title
                      ================================================== */}

                      <h3 className="mt-4 line-clamp-2 text-lg font-bold text-white">
                        {course.title}
                      </h3>

                      {/* =================================================
                          Course description
                      ================================================== */}

                      <p className="mt-1 line-clamp-2 text-sm text-white/60">
                        {course.subtitle ||
                          course.description}
                      </p>

                      {/* =================================================
                          Course metadata
                      ================================================== */}

                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/50">
                        {course.category_name && (
                          <span className="rounded-full border border-violet-400/30 bg-violet-500/20 px-2 py-0.5 text-violet-200">
                            {
                              course.category_name
                            }
                          </span>
                        )}

                        {course.instructor_name && (
                          <span>
                            {t(
                              "knowmatoCourses.byInstructor",
                              {
                                instructor:
                                  course.instructor_name,
                              },
                            )}
                          </span>
                        )}

                        <span className="capitalize">
                          {
                            course.difficulty
                          }
                        </span>
                      </div>

                      {/* =================================================
                          Progress
                      ================================================== */}

                      {isEnrolled &&
                        !statusLoading && (
                          <div className="mt-4">
                            <div className="mb-1.5 flex items-center justify-between">
                              <span className="text-xs text-white/50">
                                {t(
                                  "knowmatoCourses.progress",
                                  "Progress",
                                )}
                              </span>

                              <span className="text-xs font-bold text-violet-300">
                                {progress.toFixed(
                                  0,
                                )}
                                %
                              </span>
                            </div>

                            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 transition-all duration-500"
                                style={{
                                  width: `${progress}%`,
                                }}
                              />
                            </div>

                            <p className="mt-1 text-[11px] text-white/40">
                              {progress >=
                              100
                                ? t(
                                    "knowmatoCourses.courseCompleted",
                                    "Course completed",
                                  )
                                : t(
                                    "knowmatoCourses.progressCompleted",
                                    "{{progress}}% completed",
                                    {
                                      progress:
                                        progress.toFixed(
                                          0,
                                        ),
                                    },
                                  )}
                            </p>
                          </div>
                        )}

                      {/* =================================================
                          Price + Action
                      ================================================== */}

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div>
                          <span className="rounded-full border border-cyan-400/30 bg-cyan-500/20 px-3 py-1 text-sm font-semibold text-cyan-300">
                            {course.course_type ===
                            "free"
                              ? t(
                                  "knowmatoCourses.free",
                                )
                              : t(
                                  "knowmatoCourses.creditCost",
                                  {
                                    cost: course.course_credit_cost,
                                  },
                                )}
                          </span>
                        </div>

                        {/* =================================================
                            Status loading
                        ================================================== */}

                        {statusLoading ? (
                          <div className="h-9 w-24 animate-pulse rounded-lg bg-white/10" />
                        ) : isEnrolled ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              router.push(`/student/knowmato-plus/${course.id}`);
                            }}
                            className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition hover:opacity-90"
                          >
                            {t("knowmatoCourses.continueLearning", "Continue Learning")}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              openEnrollModal(course);
                            }}
                            title={t("knowmatoCourses.enrollButton", "Enroll")}
                            className="rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:ring-offset-2 focus:ring-offset-[#171333]"
                          >
                            {t("knowmatoCourses.enrollButton", "Enroll")}
                          </button>
                        )}
                      </div>

                      {/* =================================================
                          Insufficient credits
                      ================================================== */}

                      {insufficientBalance && (
                        <p className="mt-2 text-xs text-rose-400">
                          {t(
                            "knowmatoCourses.insufficientCreditsMessage",
                            {
                              needed:
                                course.course_credit_cost,
                              current:
                                courseCredits,
                            },
                          )}
                        </p>
                      )}
                    </div>
                  );
                },
              )}
            </div>
          )}

      {/* ================================================================
          KnowMato Agent Floating Button
      ================================================================= */}

      <button
        type="button"
        onClick={() =>
          router.push(
            "/knowmato-agent",
          )
        }
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
          font-bold
          text-white
          shadow-2xl
          shadow-violet-500/40
          transition-all
          duration-300
          hover:scale-105
          hover:shadow-fuchsia-500/40
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

      {/* ================================================================
          Course Enrollment Confirmation Modal
      ================================================================= */}
      {showEnrollModal && selectedCourse && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeEnrollModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="enrollment-modal-title"
            aria-describedby="enrollment-modal-description"
            className="w-full max-w-md rounded-2xl border border-violet-400/20 bg-[#171333] p-6 text-white shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">
                  KnowMato+
                </p>
                <h2 id="enrollment-modal-title" className="mt-2 text-xl font-bold">
                  Confirm Enrollment
                </h2>
              </div>
              <button
                type="button"
                onClick={closeEnrollModal}
                disabled={enrollLoading}
                aria-label="Close enrollment dialog"
                className="rounded-lg px-2 py-1 text-2xl leading-none text-white/60 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                &times;
              </button>
            </div>

            <p id="enrollment-modal-description" className="mt-3 text-sm leading-6 text-white/65">
              Review the course details below before confirming your enrollment.
            </p>

            <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/45">
                Selected course
              </p>
              <h3 className="mt-2 break-words text-lg font-bold text-white">
                {selectedCourse.title}
              </h3>
              {selectedCourse.subtitle && (
                <p className="mt-1 text-sm text-white/55">
                  {selectedCourse.subtitle}
                </p>
              )}

              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-sm">
                <span className="text-white/60">Course type</span>
                <span className="font-semibold capitalize text-white">
                  {selectedCourse.course_type}
                </span>
              </div>

              {selectedCourse.course_type === "free" ? (
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-white/60">Enrollment cost</span>
                  <span className="font-bold text-emerald-300">Free</span>
                </div>
              ) : (
                <>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-white/60">Required credits</span>
                    <span className="font-semibold text-white">
                      {Number(selectedCourse.course_credit_cost ?? 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-white/60">Available credits</span>
                    <span className="font-semibold text-white">
                      {creditsLoading ? "Loading..." : courseCredits.toFixed(2)}
                    </span>
                  </div>
                </>
              )}
            </div>

            {selectedCourse.course_type === "free" ? (
              <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3">
                <p className="text-sm leading-5 text-emerald-200">
                  This is a free course. No credits will be deducted from your account.
                </p>
              </div>
            ) : !creditsLoading && !canEnroll(selectedCourse) ? (
              <div className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3">
                <p className="text-sm leading-5 text-rose-200">
                  You do not have enough credits to enroll in this course.
                  Please add credits to your account and try again.
                </p>
              </div>
            ) : (
              <p className="mt-4 text-xs leading-5 text-white/45">
                The required credits will be deducted when you confirm enrollment.
              </p>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                onClick={closeEnrollModal}
                disabled={enrollLoading}
                className="flex-1 rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEnroll}
                disabled={
                  enrollLoading ||
                  (selectedCourse.course_type !== "free" &&
                    (creditsLoading || !canEnroll(selectedCourse)))
                }
                className="flex-1 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/20 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:ring-offset-2 focus:ring-offset-[#171333] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {enrollLoading ? "Enrolling..." : "Confirm Enrollment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}