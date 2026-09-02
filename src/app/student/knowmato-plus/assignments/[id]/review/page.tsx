'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import AlertService from '@/services/alertService';
import {
  getMCQReview,
  getProgrammingReview,
} from '@/services/assessmentService';

// ---------- Types for MCQ review ----------
interface MCQReviewItem {
  question_id: number;
  question: string;
  marks: number;
  options: {
    option_id: number;
    option_text: string;
  }[];
  selected_option: number | null;
  correct_option: number;
  is_correct: boolean;
  obtained_marks: number;
  explanation: string | null;
}

// ---------- Types for Programming review ----------
interface ProgrammingReviewItem {
  question_id: number;
  title: string;
  language: string;
  submitted_code: string;
  maximum_marks: number;
  obtained_marks: number;
  passed_cases: number;
  total_cases: number;
  status: string;
  feedback: string | null;
  hidden_test_cases: any | null;
}

export default function AttemptReviewPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();

  const attemptId = Number(params.id);

  const [mcqReview, setMcqReview] = useState<MCQReviewItem[]>([]);
  const [programmingReview, setProgrammingReview] =
    useState<ProgrammingReviewItem[]>([]);

  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] =
    useState<'mcq' | 'programming'>('mcq');

  // ---------------------------------------------------------------------------
  // Fetch review data
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!attemptId || Number.isNaN(attemptId)) {
      AlertService.warning(
        'Invalid Attempt',
        'Invalid assessment attempt.',
        [],
      );

      setLoading(false);

      router.push('/student/knowmato-plus/assignments');

      return;
    }

    const fetchReviews = async () => {
      try {
        setLoading(true);

        const [mcqRes, progRes] = await Promise.all([
          getMCQReview(attemptId),
          getProgrammingReview(attemptId),
        ]);

        const mcqData = mcqRes?.data ?? mcqRes;
        const progData = progRes?.data ?? progRes;

        const normalizedMCQData: MCQReviewItem[] =
          Array.isArray(mcqData) ? mcqData : [];

        const normalizedProgrammingData: ProgrammingReviewItem[] =
          Array.isArray(progData) ? progData : [];

        setMcqReview(normalizedMCQData);
        setProgrammingReview(normalizedProgrammingData);

        // If there is no MCQ data but programming data exists,
        // automatically open the programming tab.
        if (
          normalizedMCQData.length === 0 &&
          normalizedProgrammingData.length > 0
        ) {
          setActiveTab('programming');
        }
      } catch (err: any) {
        console.error(
          'Failed to load assessment review:',
          err,
        );

        const errorMessage =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          t(
            'review.loadError',
            'Failed to load assessment review.',
          );

        AlertService.error(
          'Review Load Failed',
          errorMessage,
        );

        router.push(
          '/student/knowmato-plus/assignments',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [attemptId, router, t]);

  // ---------------------------------------------------------------------------
  // Loading
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-violet-400 border-t-transparent" />

          <p className="mt-2 text-sm text-white/70">
            {t('common.loading')}
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main UI
  // ---------------------------------------------------------------------------

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
      {/* ------------------------------------------------------------------- */}
      {/* Background blobs */}
      {/* ------------------------------------------------------------------- */}

      <div className="absolute -left-20 top-0 h-72 w-72 animate-blob rounded-full bg-purple-500/20 blur-3xl filter mix-blend-multiply" />

      <div className="animation-delay-2000 absolute -right-20 top-0 h-72 w-72 animate-blob rounded-full bg-fuchsia-500/20 blur-3xl filter mix-blend-multiply" />

      <div className="animation-delay-4000 absolute -bottom-20 left-40 h-72 w-72 animate-blob rounded-full bg-cyan-500/20 blur-3xl filter mix-blend-multiply" />

      {/* ------------------------------------------------------------------- */}
      {/* Main container */}
      {/* ------------------------------------------------------------------- */}

      <div className="relative z-10 mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
        {/* ----------------------------------------------------------------- */}
        {/* Header */}
        {/* ----------------------------------------------------------------- */}

        <div className="mb-8">
          <button
            type="button"
            onClick={() =>
              router.push(
                '/student/knowmato-plus/assignments/',
              )
            }
            className="mb-4 flex items-center gap-1 text-sm font-semibold text-violet-300 hover:text-violet-200"
          >
            ← {t('review.backToResult')}
          </button>

          <h1 className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-3xl font-extrabold text-transparent">
            📋 {t('review.title')}
          </h1>

          <p className="mt-2 text-white/70">
            {t('review.subtitle')}
          </p>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Tabs */}
        {/* ----------------------------------------------------------------- */}

        <div className="mb-6 flex gap-2">
          {(['mcq', 'programming'] as const).map(
            (tab) => (
              <button
                key={tab}
                type="button"
                onClick={() =>
                  setActiveTab(tab)
                }
                className={`rounded-full px-5 py-2 text-sm font-bold transition-all ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg'
                    : 'border border-white/20 text-white/70 hover:bg-white/10'
                }`}
              >
                {tab === 'mcq'
                  ? '📝 MCQ'
                  : '💻 Programming'}
              </button>
            ),
          )}
        </div>

        {/* ================================================================= */}
        {/* MCQ REVIEW */}
        {/* ================================================================= */}

        {activeTab === 'mcq' && (
          <div className="space-y-4">
            {mcqReview.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-8 text-center backdrop-blur-xl">
                <p className="text-white/50">
                  {t('review.noMCQ')}
                </p>
              </div>
            ) : (
              mcqReview.map((item) => (
                <div
                  key={item.question_id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg backdrop-blur-xl"
                >
                  {/* Question header */}

                  <div className="mb-3 flex items-start justify-between gap-3">
                    <h3 className="text-base font-bold text-white">
                      {item.question}
                    </h3>

                    <span
                      className={`ml-2 shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${
                        item.is_correct
                          ? 'border-emerald-400/30 bg-emerald-400/20 text-emerald-300'
                          : 'border-red-400/30 bg-red-400/20 text-red-300'
                      }`}
                    >
                      {item.is_correct
                        ? t('review.correct')
                        : t('review.incorrect')}
                    </span>
                  </div>

                  {/* Options */}

                  <div className="mb-3 space-y-1">
                    {item.options.map(
                      (opt) => {
                        const isSelected =
                          opt.option_id ===
                          item.selected_option;

                        const isCorrect =
                          opt.option_id ===
                          item.correct_option;

                        let style =
                          'text-white/60';

                        if (isCorrect) {
                          style =
                            'font-bold text-emerald-300';
                        } else if (
                          isSelected &&
                          !item.is_correct
                        ) {
                          style =
                            'text-red-300';
                        }

                        return (
                          <p
                            key={
                              opt.option_id
                            }
                            className={`ml-4 text-sm ${style}`}
                          >
                            {isSelected
                              ? '▸ '
                              : '  '}

                            {opt.option_text}

                            {isCorrect &&
                              ' ✓'}
                          </p>
                        );
                      },
                    )}
                  </div>

                  {/* Marks */}

                  <div className="flex items-center gap-4 text-xs text-white/50">
                    <span>
                      {t('review.marks')}:{' '}
                      {item.marks}
                    </span>

                    <span>
                      {t(
                        'review.obtained',
                      )}
                      :{' '}
                      {
                        item.obtained_marks
                      }
                    </span>
                  </div>

                  {/* Explanation */}

                  {item.explanation && (
                    <div className="mt-3 rounded-xl bg-black/20 p-3 text-xs text-white/70">
                      <span className="font-semibold">
                        {t(
                          'review.explanation',
                        )}
                        :
                      </span>{' '}
                      {item.explanation}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* PROGRAMMING REVIEW */}
        {/* ================================================================= */}

        {activeTab === 'programming' && (
          <div className="space-y-4">
            {programmingReview.length ===
            0 ? (
              <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-8 text-center backdrop-blur-xl">
                <p className="text-white/50">
                  {t(
                    'review.noProgramming',
                  )}
                </p>
              </div>
            ) : (
              programmingReview.map(
                (item) => (
                  <div
                    key={
                      item.question_id
                    }
                    className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg backdrop-blur-xl"
                  >
                    {/* Question header */}

                    <div className="mb-3 flex items-start justify-between gap-3">
                      <h3 className="text-base font-bold text-white">
                        {item.title}
                      </h3>

                      <span
                        className={`ml-2 shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${
                          item.status ===
                          'completed'
                            ? 'border-emerald-400/30 bg-emerald-400/20 text-emerald-300'
                            : 'border-amber-400/30 bg-amber-400/20 text-amber-300'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    {/* Code */}

                    <div className="mb-3">
                      <p className="mb-1 text-xs text-white/50">
                        {t(
                          'review.yourCode',
                        )}{' '}
                        (
                        {
                          item.language
                        }
                        ):
                      </p>

                      <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-xl bg-black/30 p-3 font-mono text-xs text-white/80">
                        {item.submitted_code ||
                          t(
                            'review.noCode',
                          )}
                      </pre>
                    </div>

                    {/* Test case summary */}

                    <div className="mb-2 flex items-center gap-4 text-xs text-white/50">
                      <span>
                        {t(
                          'review.passedCases',
                        )}
                        :{' '}
                        {
                          item.passed_cases
                        }
                        /
                        {
                          item.total_cases
                        }
                      </span>

                      <span>
                        {t(
                          'review.marks',
                        )}
                        :{' '}
                        {
                          item.maximum_marks
                        }
                      </span>

                      <span>
                        {t(
                          'review.obtained',
                        )}
                        :{' '}
                        {
                          item.obtained_marks
                        }
                      </span>
                    </div>

                    {/* Feedback */}

                    {item.feedback && (
                      <div className="rounded-xl bg-black/20 p-3 text-xs text-white/70">
                        <span className="font-semibold">
                          {t(
                            'review.feedback',
                          )}
                          :
                        </span>{' '}
                        {item.feedback}
                      </div>
                    )}
                  </div>
                ),
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}