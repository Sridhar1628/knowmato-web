'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import AdminLayout from '@/app/admin/AdminLayout';
import toast from 'react-hot-toast';
import {
  getAdminAssignments,
  createAdminQuestion,
  AdminAssignment,
} from '@/services/assessmentService';

// ---------- Form state type ----------
interface CreateQuestionForm {
  question: string;
  description: string;
  level: string;
  status: string;
  assignment: number | undefined; // assignment ID
}

export default function CreateQuestionPage() {
  const router = useRouter();

  const [assignments, setAssignments] = useState<AdminAssignment[]>([]);
  const [formData, setFormData] = useState<CreateQuestionForm>({
    question: '',
    description: '',
    level: 'Medium',
    status: 'Pending',
    assignment: undefined,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const assignmentsData = await getAdminAssignments();

        setAssignments(assignmentsData);
      } catch (err) {
        console.error(err);
        toast.error("Could not load assignments for selection.");
      }
    };
    fetchAssignments();
  }, []);

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
      toast.error('Question text is required');
      return;
    }
    if (!formData.level) {
      toast.error('Please select a difficulty level');
      return;
    }

    setSubmitting(true);
    try {
      await createAdminQuestion({
        question: formData.question,
        description: formData.description,
        level: formData.level,
        status: formData.status,
        assignment: formData.assignment ?? null,
      });
      toast.success('Question created successfully!');
      router.push('/admin/assessment/questions');
    } catch (err: any) {
      toast.error(err?.message || 'Creation failed');
    } finally {
      setSubmitting(false);
    }
  };

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
              ➕ Create Programming Question
            </h1>
            <p className="text-white/70 mb-8">Add a new coding challenge to an assignment.</p>
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
                placeholder="e.g., Write a function to reverse a string."
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
                placeholder="Detailed problem statement, constraints, examples..."
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
                  Creating...
                </>
              ) : (
                'Create Question'
              )}
            </button>
          </motion.form>
        </div>
      </div>
    </AdminLayout>
  );
}