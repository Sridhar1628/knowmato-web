'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import AdminLayout from '@/app/admin/AdminLayout';
import toast from 'react-hot-toast';
import {
  getAdminAssignments,
  getAdminAttempts,
  AdminAttemptSummary,
  AdminAssignment,
} from '@/services/assessmentService';

export default function AdminResultsPage() {
  const router = useRouter();

  // Filter state
  const [assignments, setAssignments] = useState<AdminAssignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<number | ''>('');
  const [selectedUserSearch, setSelectedUserSearch] = useState('');

  // Data state
  const [attempts, setAttempts] = useState<AdminAttemptSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Load assignments for filter dropdown
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const data = await getAdminAssignments();
        setAssignments(data || []);
      } catch {
        toast.error('Failed to load assignments');
      }
    };
    fetchAssignments();
  }, []);

  // Fetch attempts when filters change
  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (selectedAssignment) filters.assignment_id = selectedAssignment;
      if (selectedUserSearch.trim()) filters.user_search = selectedUserSearch.trim();

      const data = await getAdminAttempts(filters);
      setAttempts(data || []);
    } catch (err) {
      toast.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  }, [selectedAssignment, selectedUserSearch]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

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
            className="mb-8"
          >
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300">
              📊 Assessment Results
            </h1>
            <p className="text-white/70 mt-1">
              View student attempts across all assessments.
            </p>
          </motion.div>

          {/* Filters */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <select
              value={selectedAssignment}
              onChange={(e) =>
                setSelectedAssignment(e.target.value ? Number(e.target.value) : '')
              }
              className="rounded-xl bg-white/10 border border-white/20 px-4 py-2 text-white text-sm outline-none focus:border-violet-400"
            >
              <option value="">All Assignments</option>
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>
                  Assignment #{a.id} (Batch {a.batch})
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Search student…"
              value={selectedUserSearch}
              onChange={(e) => setSelectedUserSearch(e.target.value)}
              className="rounded-xl bg-white/10 border border-white/20 px-4 py-2 text-white text-sm placeholder-white/40 outline-none focus:border-violet-400 w-48"
            />
          </div>

          {/* Results table */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-400 border-t-transparent" />
            </div>
          ) : attempts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 backdrop-blur-xl p-12 text-center">
              <p className="text-white/50">No assessment attempts found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
              <table className="w-full text-sm text-left">
                <thead className="bg-white/5 text-white/70">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Student</th>
                    <th className="px-4 py-3 font-semibold">Assignment</th>
                    <th className="px-4 py-3 font-semibold">Programming</th>
                    <th className="px-4 py-3 font-semibold">MCQ</th>
                    <th className="px-4 py-3 font-semibold">Total</th>
                    <th className="px-4 py-3 font-semibold">%</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {attempts.map((attempt) => (
                    <tr key={attempt.id} className="hover:bg-white/5 transition">
                      <td className="px-4 py-3 font-medium text-white">
                        {attempt.user_name || `User #${attempt.user}`}
                      </td>
                      <td className="px-4 py-3 text-white/70">#{attempt.assignment}</td>
                      <td className="px-4 py-3 text-violet-300">{attempt.programming_score}</td>
                      <td className="px-4 py-3 text-fuchsia-300">{attempt.mcq_score}</td>
                      <td className="px-4 py-3 text-cyan-300 font-bold">{attempt.total_marks}</td>
                      <td className="px-4 py-3 text-cyan-300 font-bold">
                        {attempt.percentage}%
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            attempt.status === 'submitted'
                              ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                              : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                          }`}
                        >
                          {attempt.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-white/50">
                        {attempt.submitted_at ? formatDate(attempt.submitted_at) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}