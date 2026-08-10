'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import AdminLayout from '@/app/admin/AdminLayout';
import toast from 'react-hot-toast';
import {
  getAdminAssignments,
  createAdminQuiz,
  AdminAssignment,
  CreateAdminQuizPayload,
} from '@/services/assessmentService';

export default function CreateQuizPage() {
  const router = useRouter();

  const [assignments, setAssignments] = useState<AdminAssignment[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<CreateAdminQuizPayload>({
    assignment: undefined,
    title: '',
    description: '',
    category: 'Technical',
    subtype: '',
    passing_percentage: 70,
    duration_minutes: 30,
    total_marks: 0,
    is_active: true,
    status: 'draft',
  });

  useEffect(() => {
    const loadAssignments = async () => {
      try {
        const assignmentsData = await getAdminAssignments();

        setAssignments(assignmentsData);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load assignments");
      }
    };
    loadAssignments();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const newValue =
      type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    setSubmitting(true);
    try {
      await createAdminQuiz({
        ...formData,
        assignment: formData.assignment ? Number(formData.assignment) : undefined,
        passing_percentage: Number(formData.passing_percentage),
        duration_minutes: Number(formData.duration_minutes),
        total_marks: Number(formData.total_marks),
      });
      toast.success('Quiz created!');
      router.push('/admin/assessment/quizzes');
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
              onClick={() => router.push('/admin/assessment/quizzes')}
              className="mb-4 flex items-center gap-1 text-sm font-semibold text-violet-300 hover:text-violet-200"
            >
              ← Back to Quizzes
            </button>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 mb-2">
              ➕ Create MCQ Quiz
            </h1>
            <p className="text-white/70 mb-8">
              Create a new multiple‑choice quiz container. Add questions later.
            </p>
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
              <label className="block text-sm font-medium text-white/80 mb-1">Assignment</label>
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

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-white/40 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/50 transition"
                placeholder="e.g., JavaScript Basics Quiz"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={2}
                className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-white/40 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/50 transition resize-none"
                placeholder="Optional quiz instructions or description"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Category <span className="text-red-400">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/50 transition"
              >
                <option value="Technical">Technical</option>
                <option value="SoftSkill">Soft Skill</option>
                <option value="Aptitude">Aptitude</option>
              </select>
            </div>

            {/* Subtype */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Subtype</label>
              <input
                type="text"
                name="subtype"
                value={formData.subtype || ''}
                onChange={handleChange}
                className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-white/40 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/50 transition"
                placeholder="e.g., JavaScript, Python"
              />
            </div>

            {/* Passing Percentage */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Passing %</label>
              <input
                type="number"
                name="passing_percentage"
                value={formData.passing_percentage}
                onChange={handleChange}
                min={0}
                max={100}
                className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/50 transition"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Duration (min)</label>
              <input
                type="number"
                name="duration_minutes"
                value={formData.duration_minutes}
                onChange={handleChange}
                min={0}
                className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/50 transition"
              />
            </div>

            {/* Total Marks */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Total Marks</label>
              <input
                type="number"
                name="total_marks"
                value={formData.total_marks}
                onChange={handleChange}
                min={0}
                className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/50 transition"
              />
            </div>

            {/* Active toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="h-4 w-4 rounded border-white/20 bg-white/10 text-violet-500 focus:ring-violet-500"
              />
              <label className="text-sm text-white/70">Active</label>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/50 transition"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
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
                'Create Quiz'
              )}
            </button>
          </motion.form>
        </div>
      </div>
    </AdminLayout>
  );
}