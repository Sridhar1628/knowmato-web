"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getCourses, deleteCourse, Course } from "@/services/v2Service";
import AdminLayout from "@/app/admin/AdminLayout";
import ConfirmModal from "@/components/ConfirmModal";
import toast from "react-hot-toast";

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: number | null }>({
    open: false,
    id: null,
  });
  const [deleting, setDeleting] = useState(false);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await getCourses({ search: search || undefined });
      setCourses(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [search]);

  const handleDelete = async () => {
    if (!deleteModal.id) return;
    setDeleting(true);
    try {
      await deleteCourse(deleteModal.id);
      toast.success("Course deleted");
      fetchCourses();
    } catch (err) {
      toast.error("Failed to delete course");
    } finally {
      setDeleting(false);
      setDeleteModal({ open: false, id: null });
    }
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

        <div className="relative z-10 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8">
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300">
              📚 Courses
            </h1>
            <button
              onClick={() => router.push("/admin/courses/new")}
              className="mt-4 sm:mt-0 flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 text-violet-300 font-medium hover:bg-white/20 transition"
            >
              + New Course
            </button>
          </div>

          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-80 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-violet-500 transition"
            />
          </div>

          {loading ? (
            <div className="text-center text-white/60 py-20">Loading...</div>
          ) : courses.length === 0 ? (
            <div className="text-center text-white/60 py-20">No courses found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl flex flex-col"
                >
                  {course.thumbnail && (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-40 object-cover rounded-xl mb-4"
                    />
                  )}
                  <h2 className="text-lg font-semibold text-white mb-2">{course.title}</h2>
                  <p className="text-sm text-white/60 mb-2">
                    {course.course_type} • {course.difficulty} • ⭐ {course.average_rating}
                  </p>
                  <p className="text-xs text-white/50 mb-4 flex-1">
                    {course.total_students} students • {course.total_lectures} lectures
                  </p>
                    <div className="flex gap-2 mt-auto">
                        <button
                            onClick={() => router.push(`/admin/courses/${course.id}`)}
                            className="flex-1 px-3 py-2 bg-violet-600/80 hover:bg-violet-600 text-white rounded-xl text-sm font-medium transition"
                        >
                            Edit
                        </button>
                        <button
                            onClick={() => router.push(`/admin/courses/${course.id}/details`)}  // ← NEW
                            className="flex-1 px-3 py-2 bg-cyan-600/80 hover:bg-cyan-600 text-white rounded-xl text-sm font-medium transition"
                        >
                            Details
                        </button>
                        <button
                            onClick={() => setDeleteModal({ open: true, id: course.id })}
                            className="flex-1 px-3 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30 rounded-xl text-sm font-medium transition"
                        >
                            Delete
                        </button>
                        </div>
                </motion.div>
              ))}
            </div>
          )}

          <ConfirmModal
            open={deleteModal.open}
            title="Delete Course"
            message="Are you sure? This action cannot be undone."
            onConfirm={handleDelete}
            onCancel={() => setDeleteModal({ open: false, id: null })}
            loading={deleting}
          />
        </div>
      </div>
    </AdminLayout>
  );
}