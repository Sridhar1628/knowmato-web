"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { purchaseCourse, getCourseContent, getCourseEnrollmentStatus, getQuizQuestions } from "@/services/v2Service";
import type { CourseContentResponse } from "@/services/v2Service"; // ensure this export exists
import toast from "react-hot-toast";

// ---------- Type definitions (matching the course content structure) ----------
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

const normalizeQuizQuestions = (questions: any[]): QuizQuestion[] =>
  questions.map((question: any) => ({
    id: question.id,
    question_text:
      question.question_text ?? question.question ?? question.text ?? "",
    options: question.options ?? question.answers ?? question.choices ?? [],
    correct_option_id:
      question.correct_option_id ?? question.correct_answer_id ?? question.answer_id,
  }));

// ---------- Helper: extract YouTube video ID ----------
function getYouTubeEmbedUrl(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&]+)/,
    /(?:youtu\.be\/)([^?]+)/,
    /(?:youtube\.com\/embed\/)([^/?]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return `https://www.youtube.com/embed/${match[1]}`;
  }
  return null;
}

// ---------- Main Component ----------
export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = Number(params.id);

  // Course & enrollment state
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState<boolean | null>(null);
  const [enrollLoading, setEnrollLoading] = useState(false);

  // UI state
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const [activeItem, setActiveItem] = useState<{
    type: "lecture" | "quiz";
    id: number;
    sectionId: number;
  } | null>(null);

  // Video progress (simplified)
  const [watchedSeconds, setWatchedSeconds] = useState<Record<number, number>>({});

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // ---------- Fetch course content ----------
  const fetchCourseDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response: CourseContentResponse = await getCourseContent(courseId);
      if (!response.success) {
        throw new Error(response.message || "Failed to load course");
      }
      setCourse(response.data as unknown as CourseDetail);
    } catch (err: any) {
      setError(err?.message || "Failed to load course");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  // ---------- Check enrollment ----------
  const checkEnrollment = useCallback(async () => {
    try {
      const status = await getCourseEnrollmentStatus(courseId);
      setIsEnrolled(status.is_enrolled);
    } catch (err) {
      console.error("Enrollment check failed", err);
      setIsEnrolled(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchCourseDetail();
    checkEnrollment();
  }, [fetchCourseDetail, checkEnrollment]);

  // ---------- Handlers ----------
  const toggleSection = (sectionId: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  const handleLectureClick = (lecture: Lecture, sectionId: number) => {
    setActiveItem({ type: "lecture", id: lecture.id, sectionId });
    // Reset quiz state
    setQuizQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setQuizFinished(false);
  };

  const handleQuizClick = async (quiz: Quiz, sectionId: number) => {
    setActiveItem({ type: "quiz", id: quiz.id, sectionId });
    if (!isEnrolled) return;
    setQuizLoading(true);
    try {
      // ✅ FIX: use the proper service function
      const questions = await getQuizQuestions(quiz.id);

      const normalizedQuestions = normalizeQuizQuestions(questions);

      setQuizQuestions(normalizedQuestions);
      setCurrentQuestionIndex(0);
      setSelectedOption(null);
      setAnswers({});
      setQuizFinished(false);
      setQuizScore(0);
    } catch (err: any) {
      toast.error(err.message || "Could not load quiz");
      setQuizQuestions([]);
    } finally {
      setQuizLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!course) return;
    setEnrollLoading(true);
    try {
      await purchaseCourse(course.id);
      toast.success("Enrolled successfully!");
      setIsEnrolled(true);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err.message || "Enrollment failed";
      toast.error(msg);
    } finally {
      setEnrollLoading(false);
    }
  };

  const handleVideoTimeUpdate = (lectureId: number, currentTime: number) => {
    setWatchedSeconds((prev) => ({ ...prev, [lectureId]: currentTime }));
  };

  const handleOptionSelect = (optionId: number) => {
    setSelectedOption(optionId);
  };

  const handleNextQuestion = () => {
    if (selectedOption === null) {
      toast.error("Please select an option");
      return;
    }
    const question = quizQuestions[currentQuestionIndex];
    const isCorrect = selectedOption === question.correct_option_id;

    setAnswers((prev) => ({ ...prev, [question.id]: selectedOption }));

    if (isCorrect) setQuizScore((prev) => prev + 1);

    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      setQuizFinished(true);
    }
  };

  // ---------- Active item data ----------
  const activeLecture = course?.sections
    .flatMap((s) => s.lectures)
    .find((l) => l.id === activeItem?.id);
  const activeQuiz = course?.sections
    .flatMap((s) => s.quizzes)
    .find((q) => q.id === activeItem?.id);

  // ---------- Render ----------
  if (loading || isEnrolled === null) {
    return (
      <div className="p-6 text-white flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-violet-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-white flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-400 text-lg">{error}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 rounded bg-white/10 hover:bg-white/20"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!course) return null;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* Sidebar: always visible */}
      <aside className="w-80 border-r border-white/10 bg-gray-900/50 p-4 overflow-y-auto max-h-screen sticky top-0">
        <button
          onClick={() => router.back()}
          className="mb-4 text-sm text-white/60 hover:text-white flex items-center gap-1"
        >
          ← Back to courses
        </button>
        <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
          {course.title}
        </h2>
        <p className="text-sm text-white/60 mb-6">{course.subtitle}</p>

        {course.sections.map((section) => (
          <div key={section.id} className="mb-3">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between text-left p-3 rounded-lg bg-white/5 hover:bg-white/10 transition"
            >
              <span className="font-semibold">{section.title}</span>
              <span className="text-xs">
                {expandedSections.has(section.id) ? "▲" : "▼"}
              </span>
            </button>

            {expandedSections.has(section.id) && (
              <div className="ml-4 mt-2 space-y-1">
                {section.lectures.map((lecture) => (
                  <button
                    key={lecture.id}
                    onClick={() => handleLectureClick(lecture, section.id)}
                    className={`w-full text-left p-2 rounded text-sm flex items-center gap-2 transition ${
                      activeItem?.type === "lecture" && activeItem.id === lecture.id
                        ? "bg-violet-500/20 text-violet-200"
                        : "hover:bg-white/5"
                    }`}
                  >
                    <span className="text-xs w-4">
                      {lecture.content_type === "video"
                        ? "🎬"
                        : lecture.content_type === "article"
                        ? "📄"
                        : "❓"}
                    </span>
                    <span className="flex-1 truncate">{lecture.title}</span>
                    {lecture.is_completed && isEnrolled && (
                      <span className="text-green-400 text-xs">✓</span>
                    )}
                    {!isEnrolled && !lecture.is_preview && (
                      <span className="text-yellow-400 text-xs">🔒</span>
                    )}
                  </button>
                ))}

                {section.quizzes.map((quiz) => (
                  <button
                    key={quiz.id}
                    onClick={() => handleQuizClick(quiz, section.id)}
                    className={`w-full text-left p-2 rounded text-sm flex items-center gap-2 transition ${
                      activeItem?.type === "quiz" && activeItem.id === quiz.id
                        ? "bg-fuchsia-500/20 text-fuchsia-200"
                        : "hover:bg-white/5"
                    }`}
                  >
                    <span className="text-xs">📝</span>
                    <span className="flex-1 truncate">{quiz.title}</span>
                    <span className="text-xs text-white/40">
                      {quiz.questions_count} Q
                    </span>
                    {!isEnrolled && (
                      <span className="text-yellow-400 text-xs">🔒</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </aside>

      {/* Main content area */}
      <main className="flex-1 p-6 overflow-y-auto">
        {/* ---------- No active item: show course overview ---------- */}
        {!activeItem && (
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold">{course.title}</h1>
                <p className="mt-2 text-xl text-white/80">{course.subtitle}</p>
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-white/60">
                  <span className="flex items-center gap-1">
                    📚 {course.total_sections} sections
                  </span>
                  <span className="flex items-center gap-1">
                    🎬 {course.total_lectures} lectures
                  </span>
                  <span className="flex items-center gap-1">
                    📝 {course.total_quizzes} quizzes
                  </span>
                  <span className="flex items-center gap-1">
                    ⏱ {course.duration_hours}h
                  </span>
                  <span className="capitalize">{course.difficulty}</span>
                  <span>{course.language}</span>
                </div>
                <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
                  <h3 className="font-semibold mb-2">About this course</h3>
                  <p className="text-white/70 whitespace-pre-line">
                    {course.description}
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-3 text-sm text-white/50">
                  <span>Instructor: {course.instructor_name}</span>
                  <span>•</span>
                  <span>{course.total_students} students enrolled</span>
                  <span>•</span>
                  <span>⭐ {course.average_rating} ({course.total_reviews} reviews)</span>
                </div>
              </div>
              {/* Price / Enroll Button */}
              <div className="md:w-64">
                <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 sticky top-24">
                  {course.thumbnail && (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-40 object-cover rounded-lg mb-4"
                    />
                  )}
                  <div className="text-2xl font-bold mb-2">
                    {course.discounted_price ? (
                      <>
                        ₹{course.discounted_price}{" "}
                        <span className="text-sm text-white/40 line-through">
                          ₹{course.price}
                        </span>
                      </>
                    ) : (
                      <>{Number(course.price) === 0 ? "Free" : `₹${course.price}`}</>
                    )}
                  </div>
                  {!isEnrolled ? (
                    <button
                      onClick={handleEnroll}
                      disabled={enrollLoading}
                      className="w-full mt-3 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-3 font-bold text-white disabled:opacity-50"
                    >
                      {enrollLoading ? "Enrolling..." : "Enroll Now"}
                    </button>
                  ) : (
                    <div className="text-center p-2 rounded-lg bg-emerald-500/20 text-emerald-300 font-semibold">
                      ✅ Enrolled
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---------- If not enrolled and an item is selected: show lock ---------- */}
        {activeItem && !isEnrolled && (
          <div className="max-w-md mx-auto mt-20 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-8 text-center backdrop-blur-xl">
            <h2 className="text-2xl font-bold text-yellow-200">🔒 Enroll to Access</h2>
            <p className="mt-4 text-white/70">
              You need to enroll in this course to view the full content.
            </p>
            {course && (
              <div className="mt-4 text-lg font-semibold">
                {course.discounted_price ? (
                  <>
                    <span>₹{course.discounted_price}</span>
                    <span className="ml-2 text-sm text-white/40 line-through">
                      ₹{course.price}
                    </span>
                  </>
                ) : (
                  <span>{Number(course.price) === 0 ? "Free" : `₹${course.price}`}</span>
                )}
              </div>
            )}
            <button
              onClick={handleEnroll}
              disabled={enrollLoading}
              className="mt-6 w-full rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-3 font-bold text-white disabled:opacity-50"
            >
              {enrollLoading ? "Enrolling..." : "Enroll Now"}
            </button>
          </div>
        )}

        {/* ---------- Lecture Content (only if enrolled) ---------- */}
        {activeItem?.type === "lecture" && activeLecture && isEnrolled && (
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-2">{activeLecture.title}</h1>
            <p className="text-white/60 mb-6">{activeLecture.description}</p>

            {activeLecture.content_type === "video" ? (
              <div className="rounded-xl overflow-hidden bg-black">
                {getYouTubeEmbedUrl(activeLecture.video_url) ? (
                  <iframe
                    className="w-full aspect-video"
                    src={getYouTubeEmbedUrl(activeLecture.video_url)!}
                    title={activeLecture.title}
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                ) : activeLecture.video_url ? (
                  <video
                    controls
                    className="w-full aspect-video"
                    src={activeLecture.video_url}
                    onTimeUpdate={(e) =>
                      handleVideoTimeUpdate(activeLecture.id, e.currentTarget.currentTime)
                    }
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="aspect-video bg-gray-800 flex items-center justify-center text-white/50">
                    No video source available
                  </div>
                )}
              </div>
            ) : activeLecture.content_type === "article" ? (
              <div
                className="prose prose-invert max-w-none mt-4"
                dangerouslySetInnerHTML={{ __html: activeLecture.article_content }}
              />
            ) : (
              <div className="text-center py-12 text-white/50">
                This content type is not supported yet.
              </div>
            )}

            {activeLecture.resource_url && (
              <div className="mt-6 p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="text-sm font-semibold">Resource:</p>
                <a
                  href={activeLecture.resource_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-violet-400 underline text-sm"
                >
                  {activeLecture.resource_name || "Download"}
                </a>
              </div>
            )}
          </div>
        )}

        {/* ---------- Quiz Content (only if enrolled) ---------- */}
        {activeItem?.type === "quiz" && activeQuiz && isEnrolled && (
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-2">{activeQuiz.title}</h1>
            <p className="text-white/60 mb-6">{activeQuiz.description}</p>

            {quizLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin h-8 w-8 border-t-2 border-violet-400 rounded-full" />
              </div>
            ) : quizFinished ? (
              <div className="rounded-2xl bg-white/5 border border-white/10 p-6 text-center">
                <h2 className="text-3xl font-bold text-emerald-400">
                  Quiz Completed!
                </h2>
                <p className="mt-2 text-lg">
                  Your score: {quizScore} / {quizQuestions.length}
                </p>
                <button
                  onClick={() => setActiveItem(null)}
                  className="mt-4 px-4 py-2 rounded-lg bg-violet-500/20 hover:bg-violet-500/30"
                >
                  Back to Course
                </button>
              </div>
            ) : quizQuestions.length > 0 ? (
              <>
                <div className="mb-4 text-sm text-white/40">
                  Question {currentQuestionIndex + 1} of {quizQuestions.length}
                </div>
                <div className="rounded-xl bg-white/5 border border-white/10 p-6">
                  <p className="text-lg font-medium mb-4">
                    {quizQuestions[currentQuestionIndex].question_text}
                  </p>
                  <div className="space-y-3">
                    {quizQuestions[currentQuestionIndex].options.map((option) => (
                      <label
                        key={option.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                          selectedOption === option.id
                            ? "border-violet-400 bg-violet-500/10"
                            : "border-white/10 hover:border-white/30"
                        }`}
                      >
                        <input
                          type="radio"
                          name="quiz-option"
                          value={option.id}
                          checked={selectedOption === option.id}
                          onChange={() => handleOptionSelect(option.id)}
                          className="accent-violet-400"
                        />
                        <span>{option.text}</span>
                      </label>
                    ))}
                  </div>
                  <button
                    onClick={handleNextQuestion}
                    className="mt-6 w-full rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-3 font-bold disabled:opacity-50"
                    disabled={selectedOption === null}
                  >
                    {currentQuestionIndex < quizQuestions.length - 1 ? "Next" : "Finish"}
                  </button>
                </div>
              </>
            ) : (
              <p className="text-center text-white/50">
                No questions available for this quiz.
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}