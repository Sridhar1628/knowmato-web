'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import AdminLayout from '@/app/admin/AdminLayout';
import toast from 'react-hot-toast';
import {
  getAdminAssignments,
  AdminAssignment,
} from '@/services/assessmentService';

export default function AdminAssignmentsListPage() {
  const router = useRouter();

  const [assignments, setAssignments] = useState<AdminAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssignments = useCallback(async () => {
    try {
      const response = await getAdminAssignments();
      const data = Array.isArray(response)
        ? response
        : (response as { data?: AdminAssignment[] }).data ?? response;
      const sorted = (Array.isArray(data) ? data : []).sort(
        (a, b) =>
          new Date(a.date_of_expiry).getTime() -
          new Date(b.date_of_expiry).getTime()
      );
      setAssignments(sorted);
    } catch (err) {
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
            <p className="mt-4 text-white/60">Loading assignments...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const now = new Date();

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
                📋 Assignments
              </h1>
              <p className="text-white/70 mt-1">
                Create, view, and update assignments.
              </p>
            </div>
            <button
              onClick={() => router.push('/admin/assessment/assignments/create')}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold rounded-xl shadow-lg shadow-violet-500/25 hover:from-violet-700 hover:to-fuchsia-700 transition mt-4 sm:mt-0"
            >
              <span>+</span> Create Assignment
            </button>
          </motion.div>

          {/* Assignments list */}
          {assignments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 backdrop-blur-xl p-12 text-center">
              <p className="text-white/50">
                No assignments yet. Create one to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => {
                const isExpired =
                  assignment.status?.toLowerCase() === 'expired' ||
                  new Date(assignment.date_of_expiry) < now;
                return (
                  <motion.div
                    key={assignment.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-lg transition hover:border-violet-400/40"
                  >
                    <div className="mb-3 sm:mb-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm font-bold text-white">
                          Assignment #{assignment.id}
                        </span>
                        <span className="rounded-full bg-violet-400/20 px-2 py-0.5 text-[10px] font-bold text-violet-300 border border-violet-400/30">
                          Batch {assignment.batch}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            isExpired
                              ? 'bg-red-400/20 text-red-300 border border-red-400/30'
                              : 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                          }`}
                        >
                          {isExpired ? 'Expired' : 'Active'}
                        </span>
                      </div>
                      <p className="text-xs text-white/50">
                        Score: {assignment.total_marks || 'N/A'} • Expiry:{' '}
                        {new Date(assignment.date_of_expiry).toLocaleDateString()}
                        {assignment.time && ` at ${assignment.time}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          router.push(
                            `/admin/assessment/assignments/${assignment.id}`
                          )
                        }
                        className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white/80 hover:bg-white/20 transition"
                      >
                        Details
                      </button>
                      <button
                        onClick={() =>
                          router.push(
                            `/admin/assessment/assignments/${assignment.id}/edit`
                          )
                        }
                        className="rounded-lg bg-fuchsia-500/20 px-3 py-1.5 text-xs font-bold text-fuchsia-300 border border-fuchsia-400/30 hover:bg-fuchsia-500/30 transition"
                      >
                        Edit Expiry
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}