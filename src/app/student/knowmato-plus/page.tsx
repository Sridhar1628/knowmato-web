"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getCourses,
  getCourseEnrollmentStatus,
  purchaseCourse,
  type Course,
} from "@/services/v2Service";
import toast from "react-hot-toast";

export default function KnowmatoPlusCoursesPage() {
  const router = useRouter();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Enrollment states
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<number> | null>(null);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  const [enrollLoading, setEnrollLoading] = useState(false);

  // Modal state
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const coursesData = await getCourses();
        setCourses(coursesData);

        // Fetch enrollment status for all courses in parallel
        setEnrollmentLoading(true);
        const statusPromises = coursesData.map(async (course) => {
          try {
            const status = await getCourseEnrollmentStatus(course.id);
            return { id: course.id, enrolled: status.is_enrolled };
          } catch {
            return { id: course.id, enrolled: false };
          }
        });
        const results = await Promise.all(statusPromises);
        const enrolledIds = new Set(
          results.filter((r) => r.enrolled).map((r) => r.id)
        );
        setEnrolledCourseIds(enrolledIds);
      } catch (err: any) {
        setError(err?.message || "Failed to load courses");
        console.error(err);
      } finally {
        setLoading(false);
        setEnrollmentLoading(false);
      }
    };
    fetchData();
  }, []);

  // Navigate to course details
  const handleCardClick = (courseId: number) => {
    router.push(`/student/knowmato-plus/${courseId}`);
  };

  // Open enroll modal
  const openEnrollModal = (course: Course) => {
    setSelectedCourse(course);
    setShowEnrollModal(true);
  };

  // Perform enrollment
  const handleEnroll = async () => {
    if (!selectedCourse) return;
    setEnrollLoading(true);
    try {
      await purchaseCourse(selectedCourse.id);
      toast.success("Successfully enrolled!");
      // Update local enrollment state
      setEnrolledCourseIds((prev) => {
        const next = new Set(prev);
        next.add(selectedCourse.id);
        return next;
      });
      setShowEnrollModal(false);
      setSelectedCourse(null);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || "Enrollment failed";
      toast.error(msg);
    } finally {
      setEnrollLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0C10] p-6 text-white">
      <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300">
        Courses
      </h1>
      <p className="mt-4 text-white/70">Premium courses coming soon...</p>

      {/* Loading skeleton */}
      {loading && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl animate-pulse"
            >
              <div className="h-32 rounded-lg bg-white/10" />
              <div className="mt-4 h-5 w-3/4 rounded bg-white/10" />
              <div className="mt-2 h-4 w-1/2 rounded bg-white/10" />
              <div className="mt-4 h-9 w-24 rounded bg-white/10" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
          <p className="text-red-300">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 text-sm underline hover:text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && courses.length === 0 && (
        <div className="mt-8 text-center text-white/50">
          <p>No courses available yet.</p>
        </div>
      )}

      {/* Course cards */}
      {!loading && !error && courses.length > 0 && (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const isEnrolled = enrolledCourseIds?.has(course.id) ?? false;
            const statusLoading = enrolledCourseIds === null; // still fetching enrollments
            return (
              <div
                key={course.id}
                className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl transition hover:border-violet-500/30 cursor-pointer"
                onClick={() => handleCardClick(course.id)}
              >
                {/* Thumbnail */}
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
                    <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-violet-200">
                      {course.category_name}
                    </span>
                  )}
                  {course.instructor_name && (
                    <span>By {course.instructor_name}</span>
                  )}
                  <span className="capitalize">{course.difficulty}</span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div>
                    {course.discounted_price ? (
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-white">
                          ₹{course.discounted_price}
                        </span>
                        <span className="text-sm text-white/40 line-through">
                          ₹{course.price}
                        </span>
                      </div>
                    ) : (
                      <span className="text-lg font-bold text-white">
                        {course.price === 0 ? "Free" : `₹${course.price}`}
                      </span>
                    )}
                  </div>
                  {statusLoading ? (
                    <div className="w-24 h-9 rounded-lg bg-white/10 animate-pulse" />
                  ) : isEnrolled ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/student/knowmato-plus/${course.id}`); // adjust if needed
                      }}
                      className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
                    >
                      Go to Course
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEnrollModal(course);
                      }}
                      className="rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
                    >
                      Enroll
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Enroll Modal */}
      {showEnrollModal && selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/20 bg-gray-900/90 backdrop-blur-xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white">Enroll in {selectedCourse.title}</h2>
            <p className="mt-2 text-white/70">
              {selectedCourse.subtitle || selectedCourse.description}
            </p>

            <div className="mt-4 text-lg font-semibold text-white">
              {selectedCourse.discounted_price ? (
                <>
                  <span>₹{selectedCourse.discounted_price}</span>
                  <span className="ml-2 text-sm text-white/40 line-through">₹{selectedCourse.price}</span>
                </>
              ) : (
                <span>{selectedCourse.price === 0 ? "Free" : `₹${selectedCourse.price}`}</span>
              )}
            </div>

            <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-sm text-yellow-300">
                ⚠️ The amount will be automatically deducted from your wallet upon enrollment.
              </p>
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
                Cancel
              </button>
              <button
                onClick={handleEnroll}
                disabled={enrollLoading}
                className="rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-2 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {enrollLoading ? "Enrolling..." : "Confirm Enrollment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}