"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getQuizzes, deleteQuiz, Quiz } from "@/services/v2Service";
import AdminLayout from "@/app/admin/AdminLayout";
import ConfirmModal from "@/components/ConfirmModal";
import AlertService from "@/services/alertService";

export default function QuizzesPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ course: "", status: "" });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });
  const [deleting, setDeleting] = useState(false);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filters.course) params.course = Number(filters.course);
      if (filters.status) params.status = filters.status;
      const res = await getQuizzes(params);
      setQuizzes(res);
    } catch {
      AlertService.error("Load Failed", "Failed to load quizzes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, [filters]);

  const handleDelete = async () => {
    if (!deleteModal.id) return;
    setDeleting(true);
    try {
      await deleteQuiz(deleteModal.id);
      AlertService.success("Quiz Deleted", "Quiz deleted successfully");
      fetchQuizzes();
    } catch {
      AlertService.error("Delete Failed", "Failed to delete quiz");
    } finally {
      setDeleting(false);
      setDeleteModal({ open: false, id: null });
    }
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden p-4 sm:p-8">
        <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row justify-between mb-8">
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 to-cyan-300">📝 Quizzes</h1>
            <button onClick={() => router.push("/admin/quizzes/new")} className="mt-4 sm:mt-0 px-4 py-2 bg-white/10 rounded-xl border border-white/20 text-violet-300 hover:bg-white/20 transition">
              + New Quiz
            </button>
          </div>

          <div className="flex gap-4 mb-6">
            <input placeholder="Course ID" value={filters.course} onChange={(e) => setFilters((f) => ({ ...f, course: e.target.value }))} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white w-32" />
            <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white">
              <option value="">All</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {loading ? (
            <div className="text-center text-white/60 py-20">Loading...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quizzes.map((q) => (
                <motion.div key={q.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
                  <h3 className="text-lg font-semibold text-white">{q.title}</h3>
                  <p className="text-sm text-white/60">Course: {q.course_title} | Status: {q.status}</p>
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => router.push(`/admin/quizzes/${q.id}`)} className="px-3 py-1.5 bg-violet-600/80 text-white rounded-lg text-sm">Edit</button>
                    <button onClick={() => router.push(`/admin/quizzes/${q.id}/questions`)} className="px-3 py-1.5 bg-cyan-600/80 text-white rounded-lg text-sm">Questions</button>
                    <button onClick={() => setDeleteModal({ open: true, id: q.id })} className="px-3 py-1.5 bg-red-600/20 text-red-300 rounded-lg text-sm">Delete</button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          <ConfirmModal open={deleteModal.open} title="Delete Quiz" message="Are you sure?" onConfirm={handleDelete} onCancel={() => setDeleteModal({ open: false, id: null })} loading={deleting} />
        </div>
      </div>
    </AdminLayout>
  );
}