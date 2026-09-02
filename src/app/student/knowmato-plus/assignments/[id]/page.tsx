'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

import AlertService from '@/services/alertService';

import {
  getAttemptDetails,
} from '@/services/assessmentService';

// ----------------------------------------------------------------------
// Types for the attempt details
// Based on AssignmentAttemptDetailsSerializer
// ----------------------------------------------------------------------

interface AttemptDetails {
  attempt: {
    id: number;
    assignment: number;
    attempt_number: number;
    status: string;
    started_at: string;
    submitted_at: string | null;
    programming_score: number;
    mcq_score: number;
    total_marks: number;
    percentage: number;
    is_passed: boolean;
    is_locked: boolean;
  };

  assignment: {
    id: number;
    status: string;
    time: string | null;
    date_of_expiry: string;
    batch: number;
    total_marks: string | null;
  };

  programming_questions: {
    id: number;
    question: string;
    level: string;
    status: string;
    description: string | null;
    Assignment: number;
  }[];

  mcq_quizzes: {
    id: number;
    assignment: number;
    title: string;
    category: string;
    subtype: string | null;
    passing_percentage: number;
    duration_minutes: number;
    total_marks: number;
    is_active: boolean;
    status: string;
    description: string;
  }[];
}

// ----------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------

export default function AssignmentDetailPage() {
  const { t } = useTranslation();

  const params = useParams();
  const router = useRouter();

  const [attemptDetails, setAttemptDetails] =
    useState<AttemptDetails | null>(null);

  const [loading, setLoading] = useState(true);

  const attemptId = Number(params.id);

  // --------------------------------------------------------------------
  // Fetch attempt details
  // --------------------------------------------------------------------

  useEffect(() => {
    if (!attemptId || Number.isNaN(attemptId)) {
      AlertService.error(
        'Invalid Attempt',
        t(
          'assignmentDetail.invalidId',
          'Invalid assignment attempt.',
        ),
      );

      setLoading(false);

      router.replace(
        '/student/knowmato-plus/assignments',
      );

      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        const detailsRes =
          await getAttemptDetails(attemptId);

        const data =
          detailsRes?.data ?? detailsRes;

        if (!data) {
          throw new Error(
            t(
              'assignmentDetail.noData',
              'Assignment details could not be found.',
            ),
          );
        }

        setAttemptDetails(
          data as AttemptDetails,
        );
      } catch (error: any) {
        console.error(
          'Failed to load assignment details:',
          error,
        );

        const errorMessage =
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          t(
            'assignmentDetail.loadError',
            'Unable to load assignment details.',
          );

        AlertService.error(
          'Unable to Load Assignment',
          errorMessage,
        );

        router.replace(
          '/student/knowmato-plus/assignments',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [attemptId, router, t]);

  // --------------------------------------------------------------------
  // Loading state
  // --------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-violet-400 border-t-transparent" />

          <p className="mt-2 text-sm text-white/70">
            {t(
              'assignmentDetail.loading',
              'Loading…',
            )}
          </p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------
  // No data
  // --------------------------------------------------------------------

  if (!attemptDetails) {
    return null;
  }

  const {
    attempt,
    assignment,
    programming_questions,
    mcq_quizzes,
  } = attemptDetails;

  // --------------------------------------------------------------------
  // Check whether assignment is expired
  // --------------------------------------------------------------------

  const isExpired =
    assignment.status?.toLowerCase() ===
      'expired' ||
    Boolean(
      assignment.date_of_expiry &&
        new Date(
          assignment.date_of_expiry,
        ) < new Date(),
    );

  // --------------------------------------------------------------------
  // Group MCQ quizzes by category + subtype
  // --------------------------------------------------------------------

  const groupedQuizzes = () => {
    const groups: Record<
      string,
      {
        category: string;
        subtype: string;
        count: number;
        title: string;
        quizId: number;
      }
    > = {};

    mcq_quizzes.forEach((quiz) => {
      const key = `${quiz.category}|||${
        quiz.subtype || 'default'
      }`;

      if (!groups[key]) {
        groups[key] = {
          category: quiz.category,
          subtype:
            quiz.subtype || 'General',
          count: 0,
          title: quiz.title,
          quizId: quiz.id,
        };
      }

      groups[key].count += 1;
    });

    return Object.values(groups);
  };

  const quizGroups = groupedQuizzes();

  // --------------------------------------------------------------------
  // Main UI
  // --------------------------------------------------------------------

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
      {/* -------------------------------------------------------------- */}
      {/* Animated background blobs */}
      {/* -------------------------------------------------------------- */}

      <div className="absolute -left-20 top-0 h-72 w-72 animate-blob rounded-full bg-purple-500/20 blur-3xl filter mix-blend-multiply" />

      <div className="animation-delay-2000 absolute -right-20 top-0 h-72 w-72 animate-blob rounded-full bg-fuchsia-500/20 blur-3xl filter mix-blend-multiply" />

      <div className="animation-delay-4000 absolute -bottom-20 left-40 h-72 w-72 animate-blob rounded-full bg-cyan-500/20 blur-3xl filter mix-blend-multiply" />

      {/* -------------------------------------------------------------- */}
      {/* Main container */}
      {/* -------------------------------------------------------------- */}

      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        {/* ============================================================ */}
        {/* Header */}
        {/* ============================================================ */}

        <div className="mb-8">
          <h1 className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-2xl font-bold leading-tight text-transparent md:text-3xl">
            {t(
              'assignmentDetail.title',
              {
                id: attempt.id,
              },
            )}
          </h1>

          <p className="mt-2 text-sm text-white/50">
            {t(
              'assignmentDetail.subtitle',
            )}
          </p>

          {/* Expired notice */}

          {isExpired && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-red-400/30 bg-red-400/20 px-4 py-1.5 text-xs font-bold text-red-300">
              ⏰{' '}
              {t(
                'assignmentDetail.expiredNotice',
                'This assignment has expired.',
              )}
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* Programming Questions */}
        {/* ============================================================ */}

        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">
                {t(
                  'assignmentDetail.programmingQuestions',
                )}
              </h2>

              <p className="text-xs text-white/50">
                {t(
                  'assignmentDetail.questionsCount',
                  {
                    count:
                      programming_questions.length,
                  },
                )}
              </p>
            </div>
          </div>

          {/* No programming questions */}

          {programming_questions.length ===
          0 ? (
            <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-8 text-center backdrop-blur-xl">
              <p className="text-sm text-white/50">
                {t(
                  'assignmentDetail.noProgramming',
                )}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {programming_questions.map(
                (question) => (
                  <div
                    key={question.id}
                    className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-violet-400/40 hover:shadow-xl"
                  >
                    {/* Question badges */}

                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="rounded-full border border-violet-400/30 bg-violet-400/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-violet-300">
                        {question.level ||
                          t(
                            'assignmentDetail.levelMedium',
                          )}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-bold ${
                          question.status ===
                          'completed'
                            ? 'border border-emerald-400/30 bg-emerald-400/20 text-emerald-300'
                            : 'border border-amber-400/30 bg-amber-400/20 text-amber-300'
                        }`}
                      >
                        {question.status ||
                          t(
                            'assignmentDetail.statusPending',
                          )}
                      </span>
                    </div>

                    {/* Question */}

                    <h3 className="line-clamp-2 text-base font-bold text-white">
                      {question.question ||
                        t(
                          'assignmentDetail.untitledQuestion',
                        )}
                    </h3>

                    {/* Description */}

                    {question.description && (
                      <p className="mt-2 line-clamp-3 text-xs text-white/50">
                        {
                          question.description
                        }
                      </p>
                    )}

                    <div className="flex-1" />

                    {/* Attempt / History button */}

                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/student/knowmato-plus/assignments/${attempt.id}/question/${question.id}`,
                        )
                      }
                      className={`mt-4 w-full rounded-xl py-2 text-sm font-bold transition-all ${
                        isExpired
                          ? 'border border-white/20 bg-white/10 text-white/70 hover:bg-white/20'
                          : 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25 hover:from-violet-600 hover:to-fuchsia-600'
                      }`}
                    >
                      {isExpired
                        ? t(
                            'assignmentDetail.viewHistory',
                            'View History',
                          )
                        : t(
                            'assignmentDetail.attempt',
                          )}
                    </button>
                  </div>
                ),
              )}
            </div>
          )}
        </section>

        {/* ============================================================ */}
        {/* MCQ Quizzes */}
        {/* ============================================================ */}

        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">
                {t(
                  'assignmentDetail.mcqQuestions',
                )}
              </h2>

              <p className="text-xs text-white/50">
                {t(
                  'assignmentDetail.mcqCount',
                  {
                    questionCount:
                      mcq_quizzes.length,
                    groupCount:
                      quizGroups.length,
                  },
                )}
              </p>
            </div>
          </div>

          {/* No MCQ quizzes */}

          {mcq_quizzes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-8 text-center backdrop-blur-xl">
              <p className="text-sm text-white/50">
                {t(
                  'assignmentDetail.noMCQ',
                )}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {quizGroups.map(
                (group) => (
                  <div
                    key={`${group.category}-${group.subtype}`}
                    className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-fuchsia-400/40 hover:shadow-xl"
                  >
                    {/* Category */}

                    <span className="mb-2 inline-block w-fit rounded-full border border-fuchsia-400/30 bg-fuchsia-400/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-fuchsia-300">
                      {group.category}
                    </span>

                    {/* Group title */}

                    <h3 className="text-base font-bold text-white">
                      {group.subtype !==
                      'General'
                        ? group.subtype
                        : group.category}
                    </h3>

                    {/* Question count */}

                    <p className="mt-1 text-sm text-white/50">
                      {t(
                        'assignmentDetail.groupQuestionCount',
                        {
                          count:
                            group.count,
                        },
                      )}
                    </p>

                    <div className="flex-1" />

                    {/* Start / History button */}

                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/student/knowmato-plus/assignments/${attempt.id}/mcq/${group.quizId}`,
                        )
                      }
                      className={`mt-4 w-full rounded-xl py-2 text-sm font-bold transition-all ${
                        isExpired
                          ? 'border border-white/20 bg-white/10 text-white/70 hover:bg-white/20'
                          : 'bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white shadow-lg shadow-fuchsia-500/25 hover:from-fuchsia-600 hover:to-pink-600'
                      }`}
                    >
                      {isExpired
                        ? t(
                            'assignmentDetail.viewHistory',
                            'View History',
                          )
                        : t(
                            'assignmentDetail.startMCQs',
                          )}
                    </button>
                  </div>
                ),
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}