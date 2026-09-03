"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getCourseContent,
  getCourseEnrollmentStatus,
  getLectureProgressByLecture,
  getQuizQuestions,
  purchaseCourse,
  recordLecturePlay,
  updateLectureProgress,
} from "@/services/v2Service";
import type {
  CourseContentResponse,
  LectureProgress,
} from "@/services/v2Service";
import CourseVideoPlayer from "@/components/CourseVideoPlayer";
import DiscussionForumWeb from "@/components/DiscussionForumWeb";
import { useTranslation } from "react-i18next";
import type {
  CourseProgressResponse,
} from "@/services/courseService";
import {getCourseProgress,completeLecture,} from "@/services/courseService";
import AlertService from "@/services/alertService";

interface Lecture {
  id: number;
  title: string;
  description: string;
  order: number;
  content_type: "video" | "article" | "quiz";
  video_url: string;
  video_duration: number;
  pdf_url: string;
  article_content: string;
  resource_url: string;
  resource_name: string;
  thumbnail: string;
  is_preview: boolean;
  is_downloadable: boolean;
  is_completed: boolean;
  watched_seconds: number;
  completion_percentage: number;
}

interface Quiz {
  id: number;
  title: string;
  description: string;
  order: number;
  duration_minutes: number;
  questions_count: number;
}

interface Section {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  order: number;
  duration_minutes: number;
  total_lectures: number;
  total_quizzes: number;
  is_preview: boolean;
  lectures: Lecture[];
  quizzes: Quiz[];
  resources: any[];
}

interface CourseDetail {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  thumbnail: string;
  trailer_video: string;
  language: string;
  difficulty: string;
  course_type: string;
  price: string;
  discounted_price: string;
  duration_hours: number;
  total_sections: number;
  total_lectures: number;
  total_quizzes: number;
  total_students: number;
  average_rating: string;
  total_reviews: number;
  certificate_available: boolean;
  category: number;
  category_name: string;
  instructor: number;
  instructor_name: string;
  sections: Section[];
}

interface QuizQuestion {
  id: number;
  question_text: string;
  options: { id: number; text: string }[];
  correct_option_id?: number;
}

type Tab = "video" | "syllabus" | "discussion";

const normalizeQuizQuestions = (questions: any[]): QuizQuestion[] =>
  questions.map((question: any) => ({
    id: question.id,
    question_text:
      question.question_text ?? question.question ?? question.text ?? "",
    options: question.options ?? question.answers ?? question.choices ?? [],
    correct_option_id:
      question.correct_option_id ??
      question.correct_answer_id ??
      question.answer_id,
  }));

const safeNumber = (value: unknown, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export default function CourseDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const courseId = Number(params.id);

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [courseProgress, setCourseProgress] =
    useState<CourseProgressResponse | null>(null);
  const [lectureProgress, setLectureProgress] = useState<
    Record<number, LectureProgress>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState<boolean | null>(null);
  const [enrollLoading, setEnrollLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<Tab>("video");
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    new Set(),
  );
  const [activeLectureId, setActiveLectureId] = useState<number | null>(null);
  const [activeQuizId, setActiveQuizId] = useState<number | null>(null);

  const [savingProgress, setSavingProgress] = useState(false);

  const lastSavedSecondsRef = useRef<Record<number, number>>({});
  const playRecordedRef = useRef<Set<number>>(new Set());

  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  const allLectures = useMemo(
    () => course?.sections.flatMap((section) => section.lectures) ?? [],
    [course],
  );

  const activeLecture = useMemo(
    () => allLectures.find((lecture) => lecture.id === activeLectureId) ?? null,
    [allLectures, activeLectureId],
  );

  const activeQuiz = useMemo(
    () =>
      course?.sections
        .flatMap((section) => section.quizzes)
        .find((quiz) => quiz.id === activeQuizId) ?? null,
    [course, activeQuizId],
  );

  const fetchCourseDetail = useCallback(async () => {
    if (!Number.isFinite(courseId) || courseId <= 0) {
      setError("Invalid course ID.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response: CourseContentResponse = await getCourseContent(courseId);

      if (!response.success) {
        throw new Error(
          response.message || t("courseDetail.loadError"),
        );
      }

      setCourse(response.data as unknown as CourseDetail);
    } catch (err: any) {
      console.error("Failed to load course:", err);
      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.message ||
          t("courseDetail.loadError"),
      );
    } finally {
      setLoading(false);
    }
  }, [courseId, t]);

  const checkEnrollment = useCallback(async () => {
    try {
      const rawStatus = await getCourseEnrollmentStatus(courseId);

      // The API/service may return either:
      // 1. { is_enrolled, progress_percentage }
      // 2. { data: { is_enrolled, progress_percentage } }
      // 3. { success, status, message, data: { is_enrolled, ... } }
      const status = (() => {
        if (
          rawStatus &&
          typeof rawStatus === "object" &&
          "data" in rawStatus
        ) {
          const data = (rawStatus as { data?: unknown }).data;

          if (data && typeof data === "object") {
            return data as { is_enrolled?: boolean };
          }
        }

        return rawStatus as { is_enrolled?: boolean } | null;
      })();

      setIsEnrolled(Boolean(status?.is_enrolled));
    } catch (err) {
      console.error("Failed to load course enrollment status:", err);
      setIsEnrolled(false);
    }
  }, [courseId]);

  const loadCourseProgress = useCallback(async () => {
    if (!courseId) return;

    try {
      const progress = await getCourseProgress(courseId);
      setCourseProgress(progress);
    } catch (err) {
      console.error("Course progress load failed:", err);
    }
  }, [courseId]);

  const loadLectureProgress = useCallback(
    async (lectures: Lecture[]) => {
      if (!lectures.length) return;

      const results = await Promise.all(
        lectures.map(async (lecture) => {
          try {
            const progress = await getLectureProgressByLecture(lecture.id);
            return progress ? [lecture.id, progress] : null;
          } catch (err) {
            console.error(
              `Failed to load lecture progress ${lecture.id}:`,
              err,
            );
            return null;
          }
        }),
      );

      const map: Record<number, LectureProgress> = {};

      results.forEach((result) => {
        if (result) {
          map[result[0] as number] = result[1] as unknown as LectureProgress;
        }
      });

      setLectureProgress(map);
    },
    [],
  );

  useEffect(() => {
    fetchCourseDetail();
    checkEnrollment();
  }, [fetchCourseDetail, checkEnrollment]);

  /*
   * Once course + enrollment are available:
   * 1. Fetch course progress.
   * 2. Fetch lecture resume positions.
   * 3. Automatically select the last lecture.
   */
  useEffect(() => {
    if (!course || isEnrolled === null) return;

    if (!isEnrolled) {
      setActiveLectureId(null);
      return;
    }

    let cancelled = false;

    const initializeLearningState = async () => {
      try {
        await loadCourseProgress();
        await loadLectureProgress(
          course.sections.flatMap((section) => section.lectures),
        );

        if (cancelled) return;

        const latestProgress = await getCourseProgress(course.id).catch(
          () => null,
        );

        const lastLectureId = latestProgress?.last_lecture?.id;

        const firstLecture =
          course.sections
            .flatMap((section) => section.lectures)
            .sort((a, b) => a.order - b.order)[0] ?? null;

        const resumeLecture =
          allLectures.find((lecture) => lecture.id === lastLectureId) ??
          firstLecture;

        if (resumeLecture) {
          const parentSection = course.sections.find((section) =>
            section.lectures.some(
              (lecture) => lecture.id === resumeLecture.id,
            ),
          );

          if (parentSection) {
            setExpandedSections(new Set([parentSection.id]));
          }

          setActiveLectureId(resumeLecture.id);
          setActiveQuizId(null);
          setActiveTab("video");
        }
      } catch (err) {
        console.error("Failed to initialize learning state:", err);
      }
    };

    initializeLearningState();

    return () => {
      cancelled = true;
    };
  }, [
    course,
    isEnrolled,
    loadCourseProgress,
    loadLectureProgress,
    allLectures,
  ]);

  const toggleSection = (sectionId: number) => {
    setExpandedSections((previous) => {
      const next = new Set(previous);

      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }

      return next;
    });
  };

  const selectLecture = async (lecture: Lecture, sectionId: number) => {
    if (!isEnrolled && !lecture.is_preview) {
      AlertService.warning(
        "Enrollment Required",
        t("courseDetail.enrollToAccessMessage"),
        [],
      );
      return;
    }

    setExpandedSections((previous) => {
      const next = new Set(previous);
      next.add(sectionId);
      return next;
    });

    setActiveLectureId(lecture.id);
    setActiveQuizId(null);
    setActiveTab("video");
    setQuizQuestions([]);
    setQuizFinished(false);
    setQuizScore(0);

    /*
     * Load this lecture's latest progress immediately.
     * This makes manual lecture switching resume correctly.
     */
    try {
      const rawProgress = await getLectureProgressByLecture(lecture.id);

      const progress: LectureProgress | null = Array.isArray(rawProgress)
        ? (rawProgress[0] ?? null)
        : rawProgress ?? null;

      if (progress) {
        setLectureProgress((previous): Record<number, LectureProgress> => ({
          ...previous,
          [lecture.id]: progress,
        }));
      }
    } catch (err) {
      console.error("Failed to load selected lecture progress:", err);
    }
  };

  const selectQuiz = async (quiz: Quiz, sectionId: number) => {
    if (!isEnrolled) {
      AlertService.warning(
        "Enrollment Required",
        t("courseDetail.enrollToAccessMessage"),
        [],
      );
      return;
    }

    setExpandedSections((previous) => {
      const next = new Set(previous);
      next.add(sectionId);
      return next;
    });

    setActiveQuizId(quiz.id);
    setActiveLectureId(null);
    setActiveTab("video");

    setQuizLoading(true);
    setQuizQuestions([]);
    setQuizFinished(false);
    setQuizScore(0);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);

    try {
      const questions = await getQuizQuestions(quiz.id);
      setQuizQuestions(normalizeQuizQuestions(questions));
    } catch (err) {
      console.error("Quiz load failed:", err);
      AlertService.error(
        "Quiz Error",
        t("courseDetail.quizLoadError"),
      );
    } finally {
      setQuizLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!course) return;

    try {
      setEnrollLoading(true);

      await purchaseCourse(course.id);

      setIsEnrolled(true);
      AlertService.success(
        "Enrollment Successful",
        t("courseDetail.enrollSuccess"),
      );

      await loadCourseProgress();
    } catch (err: any) {
      AlertService.error(
        "Enrollment Failed",
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.message ||
          t("courseDetail.enrollFailed")
      );
    } finally {
      setEnrollLoading(false);
    }
  };

  const handleVideoPlayStart = async () => {
    if (!activeLecture || !isEnrolled) return;

    if (playRecordedRef.current.has(activeLecture.id)) return;

    playRecordedRef.current.add(activeLecture.id);

    try {
      const result = await recordLecturePlay(activeLecture.id);

      setLectureProgress((previous) => ({
        ...previous,
        [activeLecture.id]: {
          ...(previous[activeLecture.id] || ({} as LectureProgress)),
          play_count:
            safeNumber((result as any)?.play_count, 0) ||
            previous[activeLecture.id]?.play_count ||
            0,
        } as LectureProgress,
      }));
    } catch (err) {
      /*
       * Do not block video playback if analytics/play-count recording fails.
       */
      console.error("Failed to record lecture play:", err);
    }
  };

  const handleVideoProgress = async ({
    currentTime,
  }: {
    currentTime: number;
    duration: number;
  }) => {
    if (!activeLecture || !isEnrolled) return;

    const seconds = Math.max(0, Math.floor(currentTime));
    const previousSaved = lastSavedSecondsRef.current[activeLecture.id] ?? 0;

    /*
     * Save every 5 seconds, and never send a lower position.
     * The backend calculates completion_percentage.
     */
    if (
      seconds < previousSaved ||
      seconds - previousSaved < 5
    ) {
      return;
    }

    lastSavedSecondsRef.current[activeLecture.id] = seconds;
    setSavingProgress(true);

    try {
      const result = await updateLectureProgress(
        activeLecture.id,
        seconds,
      );

      const progress = result?.lecture_progress;

      if (progress) {
        setLectureProgress((previous) => ({
          ...previous,
          [activeLecture.id]: progress,
        }));
      }

      if (result?.course_progress !== undefined) {
        setCourseProgress((previous) =>
          previous
            ? {
                ...previous,
                progress_percentage: safeNumber(
                  result.course_progress,
                  previous.progress_percentage,
                ),
                course_completed: Boolean(
                  result.course_completed,
                ),
              }
            : previous,
        );
      }
    } catch (err) {
      console.error("Failed to save video progress:", err);
    } finally {
      setSavingProgress(false);
    }
  };

  const handleVideoEnd = async () => {
    if (!activeLecture || !isEnrolled) return;

    try {
      const result = await completeLecture(activeLecture.id);

      if (result?.lecture_progress) {
        setLectureProgress((previous) => ({
          ...previous,
          [activeLecture.id]: result.lecture_progress,
        }));
      }

      if (result?.course_progress !== undefined) {
        setCourseProgress((previous) =>
          previous
            ? {
                ...previous,
                progress_percentage: safeNumber(
                  result.course_progress,
                  previous.progress_percentage,
                ),
                course_completed: Boolean(
                  result.course_completed,
                ),
              }
            : previous,
        );
      }

      AlertService.success(
        "Lecture Completed",
        "Lecture completed.",
      );

      await loadCourseProgress();
    } catch (err) {
      console.error("Failed to complete lecture:", err);
    }
  };

  const handleVideoError = () => {
    AlertService.error(
      "Video Error",
      "Video could not be loaded.",
    );
  };

  const handleQuizOption = (optionId: number) => {
    setSelectedOption(optionId);
  };

  const handleNextQuestion = () => {
    const question = quizQuestions[currentQuestionIndex];

    if (!question || selectedOption === null) {
      AlertService.warning(
        "Option Required",
        t("courseDetail.pleaseSelectOption"),
        [],
      );
      return;
    }

    const isCorrect =
      selectedOption === question.correct_option_id;

    if (isCorrect) {
      setQuizScore((previous) => previous + 1);
    }

    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex((previous) => previous + 1);
      setSelectedOption(null);
    } else {
      setQuizFinished(true);
    }
  };

  const courseProgressPercent = Math.min(
    100,
    Math.max(
      0,
      safeNumber(courseProgress?.progress_percentage, 0),
    ),
  );

  const currentLectureProgress = activeLecture
    ? lectureProgress[activeLecture.id]
    : null;

  const currentWatchedSeconds = safeNumber(
    currentLectureProgress?.watched_seconds ??
      activeLecture?.watched_seconds,
    0,
  );

  const currentLecturePercent = Math.min(
    100,
    Math.max(
      0,
      safeNumber(
        currentLectureProgress?.completion_percentage ??
          activeLecture?.completion_percentage,
        0,
      ),
    ),
  );

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "video", label: "Video", icon: "▶" },
    { id: "syllabus", label: "Syllabus", icon: "📚" },
    { id: "discussion", label: "Discussion", icon: "💬" },
  ];

  if (loading || isEnrolled === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080018] text-white">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-violet-500" />
          <p className="mt-4 text-sm text-white/50">
            Loading course...
          </p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] px-4 text-white">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
          <div className="text-4xl">⚠️</div>
          <p className="mt-4 text-red-300">
            {error || "Course not found."}
          </p>
          <button
            type="button"
            onClick={() => router.back()}
            className="mt-5 rounded-lg bg-white/10 px-5 py-2.5 text-sm font-semibold hover:bg-white/10"
          >
            {t("common.goBack")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white">
      <div className="pointer-events-none absolute top-0 -left-20 h-72 w-72 rounded-full bg-purple-500/20 mix-blend-multiply blur-3xl animate-blob" />
      <div className="pointer-events-none absolute top-0 -right-20 h-72 w-72 rounded-full bg-fuchsia-500/20 mix-blend-multiply blur-3xl animate-blob animation-delay-2000" />
      <div className="pointer-events-none absolute -bottom-20 left-40 h-72 w-72 rounded-full bg-cyan-500/20 mix-blend-multiply blur-3xl animate-blob animation-delay-4000" />
      <div className="relative z-10">
      {/* Top course header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0f0c29]/75 backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
        <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-3 py-3 sm:px-5 lg:px-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
            aria-label="Go back"
          >
            ←
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="truncate bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-base font-bold text-transparent sm:text-lg">
              {course.title}
            </h1>
            <p className="hidden truncate text-xs text-white/40 sm:block">
              {course.subtitle}
            </p>
          </div>

          <div className="hidden min-w-[180px] md:block">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/40">Course Progress</span>
              <span className="font-bold text-violet-300">
                {courseProgressPercent.toFixed(0)}%
              </span>
            </div>

            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 transition-all"
                style={{ width: `${courseProgressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Responsive tabs */}
        <nav className="mx-auto flex max-w-[1600px] overflow-x-auto px-2 sm:px-5 lg:px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative min-w-[100px] flex-1 px-4 py-3 text-sm font-semibold transition sm:flex-none ${
                activeTab === tab.id
                  ? "text-violet-300"
                  : "text-white/50 hover:text-white"
              }`}
            >
              <span className="mr-1.5">{tab.icon}</span>
              {tab.label}

              {activeTab === tab.id && (
                <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-violet-500" />
              )}
            </button>
          ))}
        </nav>
      </header>

      <div className="mx-auto grid max-w-[1600px] lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* Desktop syllabus sidebar */}
        <aside className="hidden border-r border-white/10 bg-white/[0.025] lg:block lg:min-h-[calc(100vh-113px)]">
          <div className="sticky top-[113px] max-h-[calc(100vh-113px)] overflow-y-auto p-4">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-300">
                Course Content
              </p>

              <div className="mt-2 flex items-center justify-between text-xs text-white/40">
                <span>
                  {courseProgress?.completed_lectures ?? 0}/
                  {courseProgress?.total_lectures ??
                    course.total_lectures} lectures
                </span>
                <span>{courseProgressPercent.toFixed(0)}%</span>
              </div>

              <div className="mt-2 h-1.5 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-violet-500"
                  style={{
                    width: `${courseProgressPercent}%`,
                  }}
                />
              </div>
            </div>

            {course.sections.map((section) => {
              const expanded = expandedSections.has(section.id);

              return (
                <div key={section.id} className="mb-2">
                  <button
                    type="button"
                    onClick={() => toggleSection(section.id)}
                    className="flex w-full items-center justify-between rounded-xl border border-white/5 bg-white/5 p-3 text-left transition hover:bg-white/10"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {section.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-white/35">
                        {section.lectures.length} lectures
                        {section.quizzes.length
                          ? ` • ${section.quizzes.length} quizzes`
                          : ""}
                      </p>
                    </div>

                    <span className="ml-2 text-xs text-white/40">
                      {expanded ? "▲" : "▼"}
                    </span>
                  </button>

                  {expanded && (
                    <div className="mt-1 space-y-1 pl-2">
                      {section.lectures.map((lecture) => {
                        const progress =
                          lectureProgress[lecture.id];

                        const percentage = Math.min(
                          100,
                          Math.max(
                            0,
                            safeNumber(
                              progress?.completion_percentage ??
                                lecture.completion_percentage,
                              0,
                            ),
                          ),
                        );

                        const selected =
                          activeLectureId === lecture.id;

                        return (
                          <button
                            key={lecture.id}
                            type="button"
                            onClick={() =>
                              selectLecture(
                                lecture,
                                section.id,
                              )
                            }
                            className={`w-full rounded-lg p-2.5 text-left transition ${
                              selected
                                ? "bg-violet-500/15 text-violet-200"
                                : "text-white/65 hover:bg-white/5 hover:text-white"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xs">
                                {lecture.content_type ===
                                "video"
                                  ? "🎬"
                                  : lecture.content_type ===
                                      "article"
                                    ? "📄"
                                    : "❓"}
                              </span>

                              <span className="min-w-0 flex-1 truncate text-xs font-medium">
                                {lecture.title}
                              </span>

                              {percentage >= 100 && (
                                <span className="text-xs text-emerald-400">
                                  ✓
                                </span>
                              )}

                              {!isEnrolled &&
                                !lecture.is_preview && (
                                  <span className="text-xs text-amber-300">
                                    🔒
                                  </span>
                                )}
                            </div>

                            {isEnrolled && (
                              <div className="mt-1.5 ml-5 h-1 overflow-hidden rounded-full bg-white/10">
                                <div
                                  className="h-full rounded-full bg-violet-500"
                                  style={{
                                    width: `${percentage}%`,
                                  }}
                                />
                              </div>
                            )}
                          </button>
                        );
                      })}

                      {section.quizzes.map((quiz) => (
                        <button
                          key={quiz.id}
                          type="button"
                          onClick={() =>
                            selectQuiz(
                              quiz,
                              section.id,
                            )
                          }
                          className={`flex w-full items-center gap-2 rounded-lg p-2.5 text-left text-xs transition ${
                            activeQuizId === quiz.id
                              ? "bg-fuchsia-500/15 text-fuchsia-200"
                              : "text-white/60 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <span>📝</span>
                          <span className="min-w-0 flex-1 truncate">
                            {quiz.title}
                          </span>
                          <span className="text-white/30">
                            {quiz.questions_count} Q
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        <main className="min-w-0 p-3 sm:p-5 lg:p-6">
          {/* Mobile syllabus */}
          {activeTab === "syllabus" && (
            <section className="mx-auto max-w-4xl lg:hidden">
              <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
                <h2 className="text-lg font-bold">Course Syllabus</h2>
                <p className="mt-1 text-sm text-white/40">
                  {courseProgress?.completed_lectures ?? 0}/
                  {courseProgress?.total_lectures ??
                    course.total_lectures} lectures completed
                </p>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500"
                    style={{
                      width: `${courseProgressPercent}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                {course.sections.map((section) => (
                  <div
                    key={section.id}
                    className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-3"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        toggleSection(section.id)
                      }
                      className="flex w-full items-center justify-between p-2 text-left"
                    >
                      <span className="font-semibold">
                        {section.title}
                      </span>
                      <span className="text-xs text-white/40">
                        {expandedSections.has(section.id)
                          ? "▲"
                          : "▼"}
                      </span>
                    </button>

                    {expandedSections.has(section.id) && (
                      <div className="mt-2 space-y-1">
                        {section.lectures.map(
                          (lecture) => (
                            <button
                              key={lecture.id}
                              type="button"
                              onClick={() => {
                                selectLecture(
                                  lecture,
                                  section.id,
                                );
                              }}
                              className="flex w-full items-center gap-3 rounded-lg bg-white/[0.04] p-3 text-left hover:bg-white/10"
                            >
                              <span>
                                {lecture.content_type ===
                                "video"
                                  ? "🎬"
                                  : "📄"}
                              </span>
                              <span className="min-w-0 flex-1 truncate text-sm">
                                {lecture.title}
                              </span>
                              {lectureProgress[
                                lecture.id
                              ]?.completion_percentage >=
                                100 && (
                                <span className="text-emerald-400">
                                  ✓
                                </span>
                              )}
                            </button>
                          ),
                        )}

                        {section.quizzes.map(
                          (quiz) => (
                            <button
                              key={quiz.id}
                              type="button"
                              onClick={() =>
                                selectQuiz(
                                  quiz,
                                  section.id,
                                )
                              }
                              className="flex w-full items-center gap-3 rounded-lg bg-white/[0.04] p-3 text-left text-sm hover:bg-white/10"
                            >
                              <span>📝</span>
                              <span className="min-w-0 flex-1 truncate">
                                {quiz.title}
                              </span>
                            </button>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Video tab */}
          {activeTab === "video" && (
            <section className="mx-auto max-w-6xl">
              {activeLecture && isEnrolled ? (
                <>
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
                    {activeLecture.content_type ===
                    "video" ? (
                      <CourseVideoPlayer
                        key={activeLecture.id}
                        videoUrl={
                          activeLecture.video_url
                        }
                        title={activeLecture.title}
                        isEnrolled={isEnrolled}
                        isFree={
                          activeLecture.is_preview
                        }
                        initialPosition={
                          currentWatchedSeconds
                        }
                        onPlayStart={
                          handleVideoPlayStart
                        }
                        onProgress={
                          handleVideoProgress
                        }
                        onEnd={handleVideoEnd}
                        onError={handleVideoError}
                      />
                    ) : activeLecture.content_type ===
                      "article" ? (
                      <div className="min-h-[300px] bg-[#0f0c29]/80 p-5 sm:p-8">
                        <div
                          className="prose prose-invert max-w-none"
                          dangerouslySetInnerHTML={{
                            __html:
                              activeLecture.article_content ||
                              "<p>No article content available.</p>",
                          }}
                        />
                      </div>
                    ) : (
                      <div className="p-8 text-center text-white/50">
                        Select the quiz from the syllabus.
                      </div>
                    )}
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wider text-violet-300">
                          Now Learning
                        </p>

                        <h2 className="mt-1 text-xl font-bold">
                          {activeLecture.title}
                        </h2>

                        {activeLecture.description && (
                          <p className="mt-2 text-sm leading-6 text-white/50">
                            {activeLecture.description}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 rounded-xl bg-white/5 px-4 py-3 text-center">
                        <p className="text-xs text-white/40">
                          Lecture Progress
                        </p>
                        <p className="mt-1 text-lg font-bold text-violet-300">
                          {currentLecturePercent.toFixed(
                            0,
                          )}
                          %
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 transition-all"
                        style={{
                          width: `${currentLecturePercent}%`,
                        }}
                      />
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs text-white/35">
                      <span>
                        {Math.floor(
                          currentWatchedSeconds / 60,
                        )}{" "}
                        min watched
                      </span>

                      <span>
                        {savingProgress
                          ? "Saving..."
                          : currentLecturePercent >=
                              100
                            ? "Completed"
                            : "Progress saved automatically"}
                      </span>
                    </div>
                  </div>

                  {activeLecture.resource_url && (
                    <div className="mt-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
                      <p className="text-sm font-semibold">
                        Resource
                      </p>
                      <a
                        href={
                          activeLecture.resource_url
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block text-sm text-violet-300 underline"
                      >
                        {activeLecture.resource_name ||
                          "Open resource"}
                      </a>
                    </div>
                  )}
                </>
              ) : activeQuiz && isEnrolled ? (
                <div className="mx-auto max-w-3xl">
                  <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 sm:p-7">
                    <h2 className="text-2xl font-bold">
                      {activeQuiz.title}
                    </h2>
                    <p className="mt-2 text-white/50">
                      {activeQuiz.description}
                    </p>

                    {quizLoading ? (
                      <div className="flex justify-center py-16">
                        <div className="h-9 w-9 animate-spin rounded-full border-4 border-white/10 border-t-violet-500" />
                      </div>
                    ) : quizFinished ? (
                      <div className="py-12 text-center">
                        <div className="text-5xl">🎉</div>
                        <h3 className="mt-4 text-2xl font-bold text-emerald-300">
                          Quiz Completed
                        </h3>
                        <p className="mt-2 text-lg">
                          {quizScore} /{" "}
                          {quizQuestions.length}
                        </p>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveQuizId(null);
                            setActiveLectureId(
                              allLectures[0]?.id ??
                                null,
                            );
                          }}
                          className="mt-6 rounded-lg bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 px-5 py-2.5 text-sm font-bold"
                        >
                          Back to Course
                        </button>
                      </div>
                    ) : quizQuestions.length > 0 ? (
                      <div className="mt-6">
                        <div className="text-xs text-white/40">
                          Question{" "}
                          {currentQuestionIndex + 1}{" "}
                          of {quizQuestions.length}
                        </div>

                        <div className="mt-3 h-1.5 rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-violet-500"
                            style={{
                              width: `${
                                ((currentQuestionIndex +
                                  1) /
                                  quizQuestions.length) *
                                100
                              }%`,
                            }}
                          />
                        </div>

                        <p className="mt-6 text-lg font-semibold">
                          {
                            quizQuestions[
                              currentQuestionIndex
                            ].question_text
                          }
                        </p>

                        <div className="mt-5 space-y-3">
                          {quizQuestions[
                            currentQuestionIndex
                          ].options.map((option) => (
                            <label
                              key={option.id}
                              className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                                selectedOption ===
                                option.id
                                  ? "border-violet-400 bg-violet-500/10"
                                  : "border-white/10 bg-white/[0.04] hover:border-white/25"
                              }`}
                            >
                              <input
                                type="radio"
                                name={`quiz-${activeQuiz.id}`}
                                checked={
                                  selectedOption ===
                                  option.id
                                }
                                onChange={() =>
                                  handleQuizOption(
                                    option.id,
                                  )
                                }
                                className="accent-violet-500"
                              />
                              <span className="text-sm">
                                {option.text}
                              </span>
                            </label>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={
                            handleNextQuestion
                          }
                          disabled={
                            selectedOption === null
                          }
                          className="mt-6 w-full rounded-xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 px-5 py-3 font-bold disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {currentQuestionIndex <
                          quizQuestions.length - 1
                            ? "Next Question"
                            : "Finish Quiz"}
                        </button>
                      </div>
                    ) : (
                      <p className="py-12 text-center text-white/40">
                        No quiz questions available.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mx-auto max-w-md rounded-2xl border border-amber-500/20 bg-amber-500/10 p-8 text-center">
                  <div className="text-4xl">🔒</div>
                  <h2 className="mt-4 text-xl font-bold text-amber-200">
                    {t(
                      "courseDetail.enrollToAccessTitle",
                    )}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-white/60">
                    {t(
                      "courseDetail.enrollToAccessMessage",
                    )}
                  </p>

                  <button
                    type="button"
                    onClick={handleEnroll}
                    disabled={enrollLoading}
                    className="mt-5 w-full rounded-lg bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 px-5 py-3 font-bold disabled:opacity-50"
                  >
                    {enrollLoading
                      ? t("courseDetail.enrolling")
                      : t("courseDetail.enrollNow")}
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Discussion */}
          {activeTab === "discussion" && (
            <div className="mx-auto max-w-5xl">
              {isEnrolled ? (
                <DiscussionForumWeb
                  courseId={course.id}
                />
              ) : (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-8 text-center">
                  <div className="text-4xl">🔒</div>
                  <h2 className="mt-4 text-xl font-bold text-amber-200">
                    Enrol to join the discussion
                  </h2>
                  <button
                    type="button"
                    onClick={handleEnroll}
                    disabled={enrollLoading}
                    className="mt-5 rounded-lg bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 px-5 py-2.5 font-bold disabled:opacity-50"
                  >
                    {enrollLoading
                      ? t("courseDetail.enrolling")
                      : t("courseDetail.enrollNow")}
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Mobile course progress */}
      <div className="fixed bottom-3 left-3 right-3 z-30 rounded-xl border border-white/10 bg-[#0f0c29]/90 p-3 shadow-2xl backdrop-blur-xl md:hidden">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-white/40">Course Progress</span>
          <span className="font-bold text-violet-300">
            {courseProgressPercent.toFixed(0)}%
          </span>
        </div>

        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500"
            style={{
              width: `${courseProgressPercent}%`,
            }}
          />
        </div>
      </div>
      </div>
    </div>
  );
}