'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  getAssessmentResult,
} from '@/services/assessmentService';

// ---------- Types for result (based on AssignmentResultSerializer + statistics) ----------
interface ResultData {
  id: number;
  assignment_id: number;
  assignment_title: string;
  status: string;
  submitted_at: string;
  mcq_score: number;
  programming_score: number;
  total_marks: number;
  percentage: number;
  is_passed: boolean;
  statistics?: {
    // you can extend as needed
    total_questions?: number;
    correct_mcq?: number;
    total_mcq?: number;
    passed_programming?: number;
    total_programming?: number;
  };
}

export default function AssessmentResultPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const assignmentId = Number(params.id);

  const [result, setResult] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!assignmentId || isNaN(assignmentId)) {
      toast.error(t('result.invalidAttempt'));
      router.push('/student/knowmato-plus/assignments');
      return;
    }

    const fetchResult = async () => {
      try {
        const res = await getAssessmentResult(assignmentId);
        const data = res?.data ?? res; // unwrap if wrapped
        setResult(data);
      } catch (err: any) {
        toast.error(t('result.loadError'));
        router.push('/student/knowmato-plus/assignments');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [assignmentId, router, t]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-violet-400 border-t-transparent" />
          <p className="mt-2 text-sm text-white/70">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
      {/* Background blobs */}
      <div className="absolute -left-20 top-0 h-72 w-72 animate-blob rounded-full bg-purple-500/20 blur-3xl filter mix-blend-multiply" />
      <div className="animation-delay-2000 absolute -right-20 top-0 h-72 w-72 animate-blob rounded-full bg-fuchsia-500/20 blur-3xl filter mix-blend-multiply" />
      <div className="animation-delay-4000 absolute -bottom-20 left-40 h-72 w-72 animate-blob rounded-full bg-cyan-500/20 blur-3xl filter mix-blend-multiply" />

      <div className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300">
            {t('result.title')}
          </h1>
          <p className="mt-2 text-white/70">
            {result.assignment_title ? `${t('result.assignment')}: ${result.assignment_title}` : ''}
          </p>
        </div>

        {/* Pass / Fail banner */}
        <div className={`mb-8 rounded-2xl p-6 text-center border ${
          result.is_passed
            ? 'bg-emerald-500/10 border-emerald-400/30'
            : 'bg-red-500/10 border-red-400/30'
        }`}>
          <div className="text-4xl mb-2">{result.is_passed ? '🎉' : '😞'}</div>
          <h2 className={`text-2xl font-bold ${
            result.is_passed ? 'text-emerald-300' : 'text-red-300'
          }`}>
            {result.is_passed ? t('result.passed') : t('result.failed')}
          </h2>
          <p className="text-white/60 text-sm mt-1">
            {t('result.submittedAt')}: {new Date(result.submitted_at).toLocaleString()}
          </p>
        </div>

        {/* Score summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
            <p className="text-xs text-white/50">{t('result.mcqScore')}</p>
            <p className="text-2xl font-bold text-fuchsia-300">{result.mcq_score}</p>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
            <p className="text-xs text-white/50">{t('result.programmingScore')}</p>
            <p className="text-2xl font-bold text-violet-300">{result.programming_score}</p>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
            <p className="text-xs text-white/50">{t('result.totalScore')}</p>
            <p className="text-2xl font-bold text-white">{result.total_marks}</p>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
            <p className="text-xs text-white/50">{t('result.percentage')}</p>
            <p className="text-2xl font-bold text-cyan-300">{result.percentage}%</p>
          </div>
        </div>

        {/* Extra statistics (if available) */}
        {result.statistics && (
          <div className="mb-8 grid grid-cols-2 gap-4">
            {result.statistics.total_questions != null && (
              <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
                <p className="text-xs text-white/50">{t('result.totalQuestions')}</p>
                <p className="text-lg font-bold text-white">{result.statistics.total_questions}</p>
              </div>
            )}
            {result.statistics.correct_mcq != null && (
              <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
                <p className="text-xs text-white/50">{t('result.correctMCQ')}</p>
                <p className="text-lg font-bold text-emerald-300">{result.statistics.correct_mcq} / {result.statistics.total_mcq}</p>
              </div>
            )}
            {result.statistics.passed_programming != null && (
              <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
                <p className="text-xs text-white/50">{t('result.passedProgramming')}</p>
                <p className="text-lg font-bold text-emerald-300">{result.statistics.passed_programming} / {result.statistics.total_programming}</p>
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.push(`/student/knowmato-plus/attempt/${assignmentId}/review`)}
            className="rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-3 text-sm font-bold text-white shadow-lg hover:from-violet-600 hover:to-fuchsia-600 transition"
          >
            {t('result.viewReview')}
          </button>
          <button
            onClick={() => router.push(`/student/knowmato-plus/attempt/${assignmentId}/review/mcq`)}
            className="rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-bold text-white hover:bg-white/20 transition"
          >
            {t('result.mcqReview')}
          </button>
          <button
            onClick={() => router.push(`/student/knowmato-plus/attempt/${assignmentId}/review/programming`)}
            className="rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-bold text-white hover:bg-white/20 transition"
          >
            {t('result.programmingReview')}
          </button>
          <button
            onClick={() => router.push('/student/knowmato-plus/assignments')}
            className="rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-bold text-white hover:bg-white/20 transition"
          >
            {t('result.backToAssignments')}
          </button>
        </div>
      </div>
    </div>
  );
}