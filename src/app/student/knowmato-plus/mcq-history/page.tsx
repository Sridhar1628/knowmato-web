'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  getMCQMarks,
  MCQMark,
} from '@/services/assessmentService';
import { useTranslation } from 'react-i18next'; // ✅ added

export default function MCQHistoryPage() {
  const router = useRouter();
  const { t } = useTranslation(); // ✅ added

  // ─── State ──────────────────────────────────────────────
  const [marks, setMarks] = useState<MCQMark[]>([]);
  const [loading, setLoading] = useState(true);

  // ─── Fetch history ──────────────────────────────────────
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await getMCQMarks();
        const sorted = (data || []).sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setMarks(sorted);
      } catch (error) {
        toast.error(t('mcqHistory.error')); // ✅ translated
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [t]);

  // ─── Loading skeleton ──────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-violet-400 border-t-transparent" />
          <p className="mt-2 text-sm text-white/70">{t('mcqHistory.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
      {/* Background blobs */}
      <div className="absolute -left-20 top-0 h-72 w-72 animate-blob rounded-full bg-purple-500/20 blur-3xl filter mix-blend-multiply" />
      <div className="animation-delay-2000 absolute -right-20 top-0 h-72 w-72 animate-blob rounded-full bg-fuchsia-500/20 blur-3xl filter mix-blend-multiply" />
      <div className="animation-delay-4000 absolute -bottom-20 left-40 h-72 w-72 animate-blob rounded-full bg-cyan-500/20 blur-3xl filter mix-blend-multiply" />

      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/student/knowmato-plus/assessments')}
            className="mb-4 flex items-center gap-1 text-sm font-semibold text-fuchsia-300 hover:text-fuchsia-200 transition-colors"
          >
            ← {t('mcqHistory.backToDashboard')}
          </button>
          <h1 className="text-2xl font-bold leading-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 md:text-3xl">
            📝 {t('mcqHistory.title')}
          </h1>
          <p className="mt-2 text-sm text-white/50">
            {t('mcqHistory.subtitle')}
          </p>
        </div>

        {/* List of MCQ results */}
        {marks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 backdrop-blur-xl p-12 text-center">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-sm text-white/50">{t('mcqHistory.noAttempts')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {marks.map((mark) => (
              <div
                key={mark.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-lg transition hover:border-fuchsia-400/40"
              >
                <div className="mb-3 sm:mb-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded-full bg-fuchsia-400/20 px-3 py-1 text-[10px] font-bold uppercase text-fuchsia-300 border border-fuchsia-400/30">
                      {mark.type}
                    </span>
                    {mark.subtype && (
                      <span className="text-xs text-white/70">{mark.subtype}</span>
                    )}
                    <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-400/30">
                      {mark.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-white/50">
                    {new Date(mark.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                    {' • '}
                    {new Date(mark.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-white">
                    {mark.marks} {t('mcqHistory.points')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}