'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import AdminLayout from '@/app/admin/AdminLayout';
import toast from 'react-hot-toast';
import { createAdminAssignment, CreateAdminAssignmentPayload } from '@/services/assessmentService';

type AssignmentFormData = CreateAdminAssignmentPayload & {
  pass_percentage: string;
};

export default function CreateAssignmentPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<AssignmentFormData>({
    batch: undefined as unknown as number,
    total_marks: '',
    pass_percentage: '',
    date_of_expiry: '',
    time: '',
    status: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.batch) {
      toast.error('Batch is required');
      return;
    }
    if (!formData.date_of_expiry) {
      toast.error('Expiry date is required');
      return;
    }

    setSubmitting(true);
    try {
      await createAdminAssignment({
        ...formData,
        batch: Number(formData.batch),
      });
      toast.success('Assignment created successfully!');
      router.push('/admin/assessment/assignments');
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
              onClick={() => router.push('/admin/assessment/assignments')}
              className="mb-4 flex items-center gap-1 text-sm font-semibold text-violet-300 hover:text-violet-200"
            >
              ← Back to Assignments
            </button>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 mb-2">
              ➕ Create Assignment
            </h1>
            <p className="text-white/70 mb-8">Fill in the details for a new assignment.</p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onSubmit={handleSubmit}
            className="space-y-6 bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-2xl"
          >
            {/* Batch */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Batch ID <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                name="batch"
                value={formData.batch || ''}
                onChange={handleChange}
                required
                className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-white/40 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/50 transition"
                placeholder="e.g., 1"
              />
            </div>

            {/* Total Score */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Total Score
              </label>
              <input
                type="text"
                name="total_marks"
                value={formData.total_marks}
                onChange={handleChange}
                className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-white/40 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/50 transition"
                placeholder="e.g., 100"
              />
            </div>

            <div>
              <label>Pass Percentage</label>

                <input
                  type="number"
                  name="pass_percentage"
                  value={formData.pass_percentage}
                  onChange={handleChange}
                  placeholder="e.g. 40"
                />
            </div>

            {/* Date of Expiry */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Date of Expiry <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                name="date_of_expiry"
                value={formData.date_of_expiry}
                onChange={handleChange}
                required
                className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-white/40 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/50 transition"
              />
            </div>

            {/* Time */}
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">
                Time (optional)
              </label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-white placeholder-white/40 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/50 transition"
              />
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
                <option value="">Select status</option>
                <option value="Active">Active</option>
                <option value="Expired">Expired</option>
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
                'Create Assignment'
              )}
            </button>
          </motion.form>
        </div>
      </div>
    </AdminLayout>
  );
}