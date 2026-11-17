"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getCourseContent,
  getCourseEnrollmentStatus,
  purchaseCourse,
} from "@/services/v2Service";
import AlertService from "@/services/alertService";

type CourseSection = {
  id: number;
  title: string;
  description?: string;
  total_lectures?: number;
  total_quizzes?: number;
  lectures?: unknown[];
  quizzes?: unknown[];
};

type CourseDetails = {
  id: number;
  title: string;
  slug?: string;
  subtitle?: string;
  description?: string;
  thumbnail?: string;
  trailer_video?: string;
  course_type?: "free" | "paid" | string;
  price?: string | number;
  discounted_price?: string | number;
  course_credit_cost?: number | string;
  difficulty?: string;
  language?: string;
  duration_hours?: number;
  total_sections?: number;
  total_lectures?: number;
  total_quizzes?: number;
  total_students?: number;
  average_rating?: string | number;
  total_reviews?: number;
  category_name?: string;
  instructor_name?: string;
  certificate_available?: boolean;
  sections?: CourseSection[];
};

function unwrapCourseResponse(response: any): CourseDetails | null {
  const candidates = [
    response?.data?.course,
    response?.data?.data?.course,
    response?.course,
    response?.data?.data,
    response?.data,
    response,
  ];

  for (const candidate of candidates) {
    if (
      candidate &&
      typeof candidate === "object" &&
      Number(candidate.id) > 0 &&
      typeof candidate.title === "string"
    ) {
      return candidate as CourseDetails;
    }
  }
  return null;
}

function normalizeEnrollment(input: unknown): boolean {
  const queue: unknown[] = [input];
  const seen = new Set<object>();

  while (queue.length) {
    const current = queue.shift();
    if (!current || typeof current !== "object") continue;
    if (seen.has(current as object)) continue;
    seen.add(current as object);

    const record = current as Record<string, unknown>;
    for (const key of [
      "is_enrolled",
      "isEnrolled",
      "enrolled",
      "is_enrolled_in_course",
      "has_enrolled",
    ]) {
      if (typeof record[key] === "boolean") return record[key] as boolean;
    }

    const status = String(
      record.enrollment_status ?? record.enrollmentStatus ?? ""
    ).toLowerCase();
    if (status) {
      if (["enrolled", "active", "completed", "success"].includes(status)) return true;
      if (["not_enrolled", "not enrolled", "unenrolled", "inactive", "pending"].includes(status)) return false;
    }

    Object.values(record).forEach((value) => {
      if (value && typeof value === "object") {
        if (Array.isArray(value)) queue.push(...value);
        else queue.push(value);
      }
    });
  }
  return false;
}

export default function CourseOverviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const courseId = Number(params.id);

  const [course, setCourse] = useState<CourseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState<boolean | null>(null);
  const [enrolling, setEnrolling] = useState(false);

  const loadPage = useCallback(async () => {
    if (!Number.isInteger(courseId) || courseId <= 0) {
      setError("Invalid course ID.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [courseResponse, enrollmentResponse] = await Promise.all([
        getCourseContent(courseId),
        getCourseEnrollmentStatus(courseId).catch((statusError) => {
          console.warn("Could not load course enrollment status:", statusError);
          return null;
        }),
      ]);

      if (courseResponse?.success === false) {
        throw new Error(courseResponse.message || "Unable to load this course.");
      }

      const details = unwrapCourseResponse(courseResponse);
      if (!details) {
        throw new Error("The course details response did not contain a valid course.");
      }

      setCourse(details);
      setIsEnrolled(enrollmentResponse ? normalizeEnrollment(enrollmentResponse) : false);
    } catch (err: any) {
      console.error("COURSE DETAILS LOAD ERROR:", err);
      setError(
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Unable to load course details."
      );
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  const handleEnroll = async () => {
    if (!course || enrolling) return;
    setEnrolling(true);
    try {
      const response = await purchaseCourse(course.id);
      if (response?.success === false) {
        throw new Error(response.message || "Course enrollment was not successful.");
      }

      // The purchase endpoint is the source of truth for a successful enrollment.
      // Navigate directly; the learning page independently refreshes enrollment status.
      setIsEnrolled(true);
      router.push(`/student/knowmato-plus/${course.id}`);
    } catch (err: any) {
      console.error("COURSE ENROLLMENT ERROR:", err);
      AlertService.error(
        "Enrollment Failed",
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          err?.message ||
          "Unable to enroll in this course."
      );
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-400 border-t-transparent" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] px-4 text-white">
        <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
          <p className="text-red-300">{error || "Course not found."}</p>
          <button onClick={() => router.back()} className="mt-5 rounded-xl bg-violet-600 px-5 py-2.5 font-semibold">
            Go Back
          </button>
          <button onClick={() => void loadPage()} className="ml-2 mt-5 rounded-xl border border-white/20 px-5 py-2.5 font-semibold">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const sections = course.sections ?? [];
  const lectureCount = course.total_lectures ?? sections.reduce((sum, section) => sum + (section.lectures?.length ?? section.total_lectures ?? 0), 0);
  const quizCount = course.total_quizzes ?? sections.reduce((sum, section) => sum + (section.quizzes?.length ?? section.total_quizzes ?? 0), 0);
  const isFree = String(course.course_type).toLowerCase() === "free";
  const price = Number(course.discounted_price ?? course.price ?? 0);

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <button onClick={() => router.push("/student/knowmato-plus/courses")} className="mb-6 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white">
          <span aria-hidden>←</span> Back to Courses
        </button>

        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] shadow-2xl backdrop-blur-xl">
          <div className="grid lg:grid-cols-[1.5fr_1fr]">
            <div className="relative min-h-[250px] bg-gradient-to-br from-violet-600/30 via-fuchsia-500/20 to-cyan-500/20 lg:min-h-[390px]">
              {course.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={course.thumbnail} alt={course.title} className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-7xl opacity-70">🎓</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#100b2c]/90 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 flex flex-wrap gap-2">
                {course.category_name && <span className="rounded-full border border-violet-300/30 bg-violet-500/20 px-3 py-1 text-xs text-violet-100">{course.category_name}</span>}
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isFree ? "bg-emerald-500/20 text-emerald-200" : "bg-cyan-500/20 text-cyan-200"}`}>{isFree ? "FREE COURSE" : "PAID COURSE"}</span>
              </div>
            </div>

            <div className="flex flex-col p-6 sm:p-8">
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">KnowMato Plus Course</p>
                <h1 className="mt-3 text-2xl font-extrabold leading-tight sm:text-3xl">{course.title}</h1>
                {course.subtitle && <p className="mt-3 text-base leading-7 text-white/65">{course.subtitle}</p>}
                <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm text-white/55">
                  {course.instructor_name && <span>👨‍🏫 {course.instructor_name}</span>}
                  {course.difficulty && <span>📈 {course.difficulty}</span>}
                  {course.language && <span>🌐 {course.language}</span>}
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/10 bg-black/10 p-3"><p className="text-xs text-white/45">Duration</p><p className="mt-1 font-bold">{course.duration_hours ?? "—"} hours</p></div>
                  <div className="rounded-xl border border-white/10 bg-black/10 p-3"><p className="text-xs text-white/45">Lessons</p><p className="mt-1 font-bold">{lectureCount}</p></div>
                  <div className="rounded-xl border border-white/10 bg-black/10 p-3"><p className="text-xs text-white/45">Sections</p><p className="mt-1 font-bold">{course.total_sections ?? sections.length}</p></div>
                  <div className="rounded-xl border border-white/10 bg-black/10 p-3"><p className="text-xs text-white/45">Quizzes</p><p className="mt-1 font-bold">{quizCount}</p></div>
                </div>
              </div>

              <div className="mt-8 rounded-2xl border border-violet-400/20 bg-violet-500/10 p-5">
                <p className="text-sm text-white/55">{isFree ? "Enrollment" : "Course access"}</p>
                <div className="mt-1 flex items-end justify-between gap-3">
                  <div>
                    {isFree ? <p className="text-3xl font-extrabold text-emerald-300">Free</p> : <><p className="text-3xl font-extrabold text-violet-200">{Number(course.course_credit_cost ?? 0)} Credits</p><p className="mt-1 text-xs text-white/45">Course price ₹{price.toFixed(2)}</p></>}
                  </div>
                  {course.average_rating !== undefined && <p className="text-sm text-amber-300">★ {Number(course.average_rating).toFixed(1)} <span className="text-white/40">({course.total_reviews ?? 0})</span></p>}
                </div>
                <button
                  type="button"
                  onClick={() => isEnrolled ? router.push(`/student/knowmato-plus/${course.id}`) : void handleEnroll()}
                  disabled={enrolling || isEnrolled === null}
                  className="mt-5 w-full rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-500 px-5 py-3.5 font-bold text-white shadow-lg shadow-violet-500/20 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
                >
                  {enrolling ? "Enrolling..." : isEnrolled ? "Continue Learning" : "Enroll Now"}
                </button>
                <p className="mt-3 text-center text-xs text-white/45">
                  {isEnrolled ? "You are already enrolled in this course." : isFree ? "Enroll for free and start learning." : "Course credits will be deducted when you enroll."}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-6">
            <h2 className="text-xl font-bold">About this course</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-white/65">{course.description || course.subtitle || "Course description will be available soon."}</p>
            {course.certificate_available && <p className="mt-4 text-sm text-emerald-300">🏆 Certificate available on completion</p>}
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-6">
            <h2 className="text-xl font-bold">What you will learn</h2>
            <div className="mt-4 space-y-3 text-sm text-white/65">
              <p>✓ Structured lessons organized into {course.total_sections ?? sections.length} sections</p>
              <p>✓ {lectureCount} lessons to build your knowledge</p>
              <p>✓ {quizCount} quizzes to test your understanding</p>
              <p>✓ Learn at your own pace and track your progress</p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.05] p-6">
          <h2 className="text-xl font-bold">Course syllabus</h2>
          {sections.length ? (
            <div className="mt-4 space-y-3">
              {sections.map((section, index) => (
                <div key={section.id ?? index} className="rounded-xl border border-white/10 bg-black/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold">{index + 1}. {section.title}</h3>
                    <span className="text-xs text-white/45">{section.lectures?.length ?? section.total_lectures ?? 0} lessons · {section.quizzes?.length ?? section.total_quizzes ?? 0} quizzes</span>
                  </div>
                  {section.description && <p className="mt-2 text-sm text-white/50">{section.description}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-white/50">The detailed syllabus will be shown after the course content is published.</p>
          )}
        </section>
      </div>
    </main>
  );
}
