'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import AdminLayout from '@/app/admin/AdminLayout';
import AlertService from '@/services/alertService';
import {
  getAdminAssignments,
  getAdminQuestionById,
  updateAdminQuestion,
  AdminAssignment,
} from '@/services/assessmentService';

// ---------- Local types for the form ----------
interface QuestionForm {
  question: string;
  description: string;
  level: string;
  status: string;
  assignment: number | undefined; // assignment ID or undefined
}

export default function EditQuestionPage() {
  const router = useRouter();
  const params = useParams();
  const questionId = Number(params.id);

  const [assignments, setAssignments] = useState<AdminAssignment[]>([]);
  const [formData, setFormData] = useState<QuestionForm>({
    question: '',
    description: '',
    level: 'Medium',
    status: 'Pending',
    assignment: undefined,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [questionRes, assignmentsRes] = await Promise.all([
          getAdminQuestionById(questionId),
          getAdminAssignments(),
        ]);

        // Extract the actual question data (it might be wrapped in data)
        // Use a safe runtime check so TypeScript won't complain if `data` isn't a property
        let question: any = questionRes;
        if (typeof questionRes === 'object' && questionRes !== null && 'data' in questionRes) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          question = (questionRes as any).data;
        }

        // Extract the assignments array (handle both direct array and { data: [...] })
        let assignmentList: AdminAssignment[] = [];
        if (Array.isArray(assignmentsRes)) {
          assignmentList = assignmentsRes;
        } else if (
          assignmentsRes &&
          typeof assignmentsRes === 'object' &&
          'data' in assignmentsRes &&
          Array.isArray((assignmentsRes as { data: unknown }).data)
        ) {
          assignmentList = (assignmentsRes as { data: AdminAssignment[] }).data;
        }

        setAssignments(assignmentList);

        // Pre‑fill the form
        setFormData({
          question: question.question || '',
          description: question.description || '',
          level: question.level || 'Medium',
          status: question.status || 'Pending',
          assignment: question.assignment ?? undefined,
        });
      } catch (err) {
        AlertService.error('Question Not Found', 'Question not found');
        router.push('/admin/assessment/questions');
      } finally {
        setLoading(false);
      }
    };

    if (questionId) loadData();
  }, [questionId, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'assignment' ? (value ? Number(value) : undefined) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.question.trim()) {
      AlertService.error('Question Required', 'Question text is required');
      return;
    }

    setSubmitting(true);
    try {
      await updateAdminQuestion(questionId, {
        question: formData.question,
        description: formData.description,
        level: formData.level,
        status: formData.status,
        assignment: formData.assignment,
      });
      AlertService.success('Question Updated', 'Question updated successfully!');
      router.push('/admin/assessment/questions');
    } catch (err: any) {
      AlertService.error('Update Failed', err?.message || 'Update failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
            <p className="mt-4 text-white/60">Loading question...</p>
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

        <div className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button
              onClick={() => router.push('/admin/assessment/questions')}
              className="mb-4 flex items-center gap-1 text-sm font-semibold text-violet-300 hover:text-violet-200"
            >
              ← Back to Questions
            </button>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 mb-2">
              ✏️ Edit Question #{questionId}
            </h1>
            <p className="text-white/70 mb-8">Update the programming question details.</p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onSubmit={handleSubmit}
            className="space-y-6 bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl"
          >
            {/* Assignment */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Assignment
              </label>
              <select
                name="assignment"
                value={formData.assignment ?? ''}
                onChange={handleChange}
                className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/50 transition"
              >
                <option value="">None (standalone)</option>
                {/* ✅ assignments is guaranteed to be an array now */}
                {assignments.map((a) => (
                  <option key={a.id} value={a.id}>
                    Assignment #{a.id} (Batch {a.batch})
                  </option>
                ))}
              </select>
            </div>

            {/* Question Text */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Question <span className="text-red-400">*</span>
              </label>
              <textarea
                name="question"
                value={formData.question}
                onChange={handleChange}
                rows={3}
                required
                className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-white/40 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/50 transition resize-none"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Description / Instructions
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={5}
                className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-white/40 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/50 transition resize-none"
              />
            </div>

            {/* Difficulty Level */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Difficulty Level <span className="text-red-400">*</span>
              </label>
              <select
                name="level"
                value={formData.level}
                onChange={handleChange}
                required
                className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/50 transition"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/50 transition"
              >
                <option value="Pending">Pending</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold rounded-xl shadow-lg shadow-violet-500/25 hover:from-violet-700 hover:to-fuchsia-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Updating...
                </>
              ) : (
                'Update Question'
              )}
            </button>
          </motion.form>
        </div>
      </div>
    </AdminLayout>
  );
}