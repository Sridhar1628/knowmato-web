"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import AdminLayout from "@/app/admin/AdminLayout";
import toast from "react-hot-toast";
import { getQuestions, Question } from "@/services/assessmentService";

export default function AdminQuestionsListPage() {
  const router = useRouter();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQuestions = useCallback(async () => {
    try {
      const data = await getQuestions();
      setQuestions(data || []);
    } catch (err) {
      toast.error("Failed to load questions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
            <p className="mt-4 text-white/60">Loading questions...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden">
        <div className="absolute top-0 -left-20 w-72 h-72 bg-purple-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-0 -right-20 w-72 h-72 bg-fuchsia-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-20 left-40 w-72 h-72 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />

        <div className="relative z-10 p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between mb-8"
          >
            <div>
              <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300">
                💻 Programming Questions
              </h1>
              <p className="text-white/70 mt-1">Manage coding challenges and test cases.</p>
            </div>
            <button
              onClick={() => router.push("/admin/assessment/questions/create")}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold rounded-xl shadow-lg shadow-violet-500/25 hover:from-violet-700 hover:to-fuchsia-700 transition mt-4 sm:mt-0"
            >
              <span>+</span> Create Question
            </button>
          </motion.div>

          {/* Questions list */}
          {questions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 backdrop-blur-xl p-12 text-center">
              <p className="text-white/50">No programming questions yet. Create one to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question) => (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-lg transition hover:border-violet-400/40"
                >
                  <div className="mb-3 sm:mb-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-bold text-white line-clamp-1">
                        {question.question || "Untitled Question"}
                      </span>
                      <span className="rounded-full bg-violet-400/20 px-2 py-0.5 text-[10px] font-bold text-violet-300 border border-violet-400/30">
                        {question.level}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          question.status === "completed"
                            ? "bg-emerald-400/20 text-emerald-300 border border-emerald-400/30"
                            : "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                        }`}
                      >
                        {question.status || "Pending"}
                      </span>
                    </div>
                    {question.description && (
                      <p className="text-xs text-white/50 line-clamp-2 mt-1">
                        {question.description}
                      </p>
                    )}
                    <p className="text-xs text-white/40 mt-1">
                      Assignment: {question.Assignment ? `#${question.Assignment}` : "None"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        router.push(`/admin/assessment/questions/${question.id}/edit`)
                      }
                      className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white/80 hover:bg-white/20 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() =>
                        router.push(`/admin/assessment/questions/${question.id}/testcases`)
                      }
                      className="rounded-lg bg-cyan-500/20 px-3 py-1.5 text-xs font-bold text-cyan-300 border border-cyan-400/30 hover:bg-cyan-500/30 transition"
                    >
                      Test Cases
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}