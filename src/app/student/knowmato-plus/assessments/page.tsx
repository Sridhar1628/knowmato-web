'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  getAssignments,
  Assignment,
  getAverageProgramMarks,
  getAverageMCQMarks,
  getProgrammingMarks,
  ProgrammingMark,
  getMCQMarks,
  MCQMark,
} from '@/services/assessmentService'; // adjust path to your service file

// ----------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------
export default function AssessmentDashboard() {
  const router = useRouter();

  // ─── state ──────────────────────────────────────────────
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [avgProgramMarks, setAvgProgramMarks] = useState<number | null>(null);
  const [avgMCQMarks, setAvgMCQMarks] = useState<number | null>(null);
  const [recentProgramMarks, setRecentProgramMarks] = useState<ProgrammingMark[]>([]);
  const [recentMCQMarks, setRecentMCQMarks] = useState<MCQMark[]>([]);
  const [loading, setLoading] = useState(true);

  // ─── fetch all dashboard data ───────────────────────────
  const fetchDashboardData = useCallback(async () => {
    try {
      const [
        assignmentsRes,
        avgProgRes,
        avgMCQRes,
        progMarksRes,
        mcqMarksRes,
      ] = await Promise.all([
        getAssignments(),
        getAverageProgramMarks(),
        getAverageMCQMarks(),
        getProgrammingMarks(),
        getMCQMarks(),
      ]);

      // assignments – sort by expiry date (soonest first)
      const sorted = (assignmentsRes || []).sort(
        (a, b) =>
          new Date(a.date_of_expiry).getTime() -
          new Date(b.date_of_expiry).getTime()
      );
      setAssignments(sorted);

      setAvgProgramMarks(avgProgRes?.avg_marks ?? null);
      setAvgMCQMarks(avgMCQRes?.avg_marks ?? null);

      // recent items (latest 5)
      setRecentProgramMarks((progMarksRes || []).slice(0, 5));
      setRecentMCQMarks((mcqMarksRes || []).slice(0, 5));
    } catch (error) {
      console.error('Assessment dashboard fetch error:', error);
      toast.error('Could not load assessment data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // ─── helper: format percentage or fallback ──────────────
  const formatScore = (val: number | null) => {
    if (val === null || val === undefined) return '—';
    return `${Number(val).toFixed(0)}%`;
  };

  // ─── loading skeleton (matches student dashboard) ───────
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-violet-400 border-t-transparent" />
          <p className="mt-2 text-sm text-white/70">Loading assessment data…</p>
        </div>
      </div>
    );
  }

  // ─── main render ────────────────────────────────────────
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
      {/* Animated background blobs */}
      <div className="absolute -left-20 top-0 h-72 w-72 animate-blob rounded-full bg-purple-500/20 blur-3xl filter mix-blend-multiply" />
      <div className="animation-delay-2000 absolute -right-20 top-0 h-72 w-72 animate-blob rounded-full bg-fuchsia-500/20 blur-3xl filter mix-blend-multiply" />
      <div className="animation-delay-4000 absolute -bottom-20 left-40 h-72 w-72 animate-blob rounded-full bg-cyan-500/20 blur-3xl filter mix-blend-multiply" />

      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        {/* ── Header ── */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold leading-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 md:text-3xl lg:text-4xl">
            📊 Assessment Dashboard
          </h1>
          <p className="mt-2 text-sm text-white/70">
            Track your programming challenges and MCQ performance
          </p>
        </div>

        {/* ── Summary Cards ── */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {/* Programming average */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-2xl">
            <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-violet-500/20 blur-2xl" />
            <div className="relative z-10">
              <p className="text-sm font-semibold text-violet-300">💻 Programming</p>
              <p className="mt-2 text-4xl font-bold text-white">
                {formatScore(avgProgramMarks)}
              </p>
              <p className="mt-1 text-xs text-white/50">Average score across challenges</p>
            </div>
          </div>

          {/* MCQ average */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-2xl">
            <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-fuchsia-500/20 blur-2xl" />
            <div className="relative z-10">
              <p className="text-sm font-semibold text-fuchsia-300">📝 MCQ</p>
              <p className="mt-2 text-4xl font-bold text-white">
                {formatScore(avgMCQMarks)}
              </p>
              <p className="mt-1 text-xs text-white/50">Average score across tests</p>
            </div>
          </div>
        </div>

        {/* ── Active Assignments ── */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">📋 Your Assignments</h2>
              <p className="text-xs text-white/50">Active & upcoming tasks</p>
            </div>
            <button
              onClick={() => router.push('/student/knowmato-plus/assignments')}
              className="rounded-lg px-3 py-1.5 text-sm font-semibold text-cyan-300 hover:bg-white/10 hover:text-cyan-200 transition-all"
            >
              View all
            </button>
          </div>

          {assignments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 backdrop-blur-xl p-8 text-center">
              <p className="text-sm text-white/50">No assignments at the moment</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {assignments.map((assignment) => {
                const isExpired =
                  assignment.status?.toLowerCase() === 'expired' ||
                  new Date(assignment.date_of_expiry) < new Date();
                return (
                  <div
                    key={assignment.id}
                    className="group relative rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl shadow-lg transition-all hover:-translate-y-1 hover:border-violet-400/40 hover:shadow-xl"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <span className="rounded-full bg-violet-400/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-violet-300 border border-violet-400/30">
                        Batch {assignment.batch}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-bold ${
                          isExpired
                            ? 'bg-red-400/20 text-red-300 border border-red-400/30'
                            : 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                        }`}
                      >
                        {isExpired ? 'Expired' : 'Active'}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white">
                      Assignment #{assignment.id}
                    </h3>
                    <p className="mt-1 text-xs text-white/50">
                      Total Score: {assignment.total_score || 'N/A'}
                    </p>
                    <p className="mt-2 flex items-center gap-1 text-xs text-white/40">
                      <span>⏳ Due:</span>
                      <span>
                        {new Date(assignment.date_of_expiry).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      {assignment.time && (
                        <span>
                          {' '}
                          at {assignment.time}
                        </span>
                      )}
                    </p>
                    {!isExpired && (
                      <button
                        onClick={() =>
                          router.push(`/student/knowmato-plus/assignments/${assignment.id}`)
                        }
                        className="mt-4 w-full rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-2 text-xs font-bold text-white shadow-lg shadow-violet-500/25 hover:from-violet-600 hover:to-fuchsia-600 transition-all"
                      >
                        Attempt Now
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Recent Activity (two columns) ── */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Programming recent marks */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">💻 Recent Challenges</h3>
                <p className="text-xs text-white/50">Your latest programming attempts</p>
              </div>
              <button
                onClick={() => router.push('/student/knowmato-plus/programming-history')}
                className="text-sm font-semibold text-violet-300 hover:text-violet-200"
              >
                View all
              </button>
            </div>
            {recentProgramMarks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/20 bg-white/5 backdrop-blur-md p-6 text-center">
                <p className="text-sm text-white/50">No programming attempts yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentProgramMarks.map((mark) => (
                  <div
                    key={mark.id}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-3 transition hover:border-violet-400/40"
                  >
                    <div>
                      <p className="text-sm font-bold text-white">
                        Question #{mark.question}
                      </p>
                      <p className="text-xs text-white/50">
                        {new Date(mark.created_at).toLocaleDateString()} ·{' '}
                        {new Date(mark.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-white">
                        {mark.marks}%
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          mark.status === 'completed'
                            ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                            : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                        }`}
                      >
                        {mark.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* MCQ recent marks */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">📝 Recent MCQs</h3>
                <p className="text-xs text-white/50">Your latest multiple‑choice tests</p>
              </div>
              <button
                onClick={() => router.push('/student/knowmato-plus/mcq-history')}
                className="text-sm font-semibold text-fuchsia-300 hover:text-fuchsia-200"
              >
                View all
              </button>
            </div>
            {recentMCQMarks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/20 bg-white/5 backdrop-blur-md p-6 text-center">
                <p className="text-sm text-white/50">No MCQ attempts yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentMCQMarks.map((mark) => (
                  <div
                    key={mark.id}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 backdrop-blur-md p-3 transition hover:border-fuchsia-400/40"
                  >
                    <div>
                      <p className="text-sm font-bold text-white">
                        {mark.type} · {mark.subtype || 'General'}
                      </p>
                      <p className="text-xs text-white/50">
                        {new Date(mark.created_at).toLocaleDateString()} ·{' '}
                        {new Date(mark.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-white">
                        {mark.marks} pts
                      </p>
                      <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-400/30">
                        {mark.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}