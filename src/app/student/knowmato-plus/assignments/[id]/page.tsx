'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import {
  startAssessment,
  getAttemptDetails,
  StartAssessmentResponse,
} from '@/services/assessmentService';

// ----------------------------------------------------------------------
// Types for the attempt details (based on AssignmentAttemptDetailsSerializer)
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

export default function AssignmentDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();

  const [attemptDetails, setAttemptDetails] = useState<AttemptDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const attemptId = Number(params.id);

  useEffect(() => {
      if (!attemptId || isNaN(attemptId)) {
          toast.error(t('assignmentDetail.invalidId'));
          router.replace('/student/knowmato-plus/assignments');
          return;
      }

      const fetchData = async () => {
          try {
              const detailsRes = await getAttemptDetails(attemptId);

              const data = detailsRes.data ?? detailsRes;

              setAttemptDetails(data as AttemptDetails);
          } catch (error: any) {
              console.error(error);
          } finally {
              setLoading(false);
          }
      };

      fetchData();
  }, [attemptId, router, t]);

  // ─── loading skeleton ────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-violet-400 border-t-transparent" />
          <p className="mt-2 text-sm text-white/70">
            {t('assignmentDetail.loading', 'Loading…')}
          </p>
        </div>
      </div>
    );
  }

  if (!attemptDetails) return null;

  const { attempt, assignment, programming_questions, mcq_quizzes } = attemptDetails;
  const isExpired =
    assignment.status?.toLowerCase() === 'expired' ||
    (assignment.date_of_expiry && new Date(assignment.date_of_expiry) < new Date());

  // ─── helper: group quizzes by category + subtype ──────────
  const groupedQuizzes = () => {
    const groups: Record<string, { category: string; subtype: string; count: number; title: string; quizId: number }> = {};
    mcq_quizzes.forEach((quiz) => {
      const key = `${quiz.category}|||${quiz.subtype || 'default'}`;
      if (!groups[key]) {
        groups[key] = {
          category: quiz.category,
          subtype: quiz.subtype || 'General',
          count: 0,
          title: quiz.title,
          quizId: quiz.id,
        };
      }
      groups[key].count += 1;
    });
    return Object.values(groups);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
      {/* Animated background blobs */}
      <div className="absolute -left-20 top-0 h-72 w-72 animate-blob rounded-full bg-purple-500/20 blur-3xl filter mix-blend-multiply" />
      <div className="animation-delay-2000 absolute -right-20 top-0 h-72 w-72 animate-blob rounded-full bg-fuchsia-500/20 blur-3xl filter mix-blend-multiply" />
      <div className="animation-delay-4000 absolute -bottom-20 left-40 h-72 w-72 animate-blob rounded-full bg-cyan-500/20 blur-3xl filter mix-blend-multiply" />

      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold leading-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 md:text-3xl">
            {t('assignmentDetail.title', { id: attempt.id })}
          </h1>
          <p className="mt-2 text-sm text-white/50">
            {t('assignmentDetail.subtitle')}
          </p>
          {isExpired && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-red-400/20 px-4 py-1.5 text-xs font-bold text-red-300 border border-red-400/30">
              ⏰ {t('assignmentDetail.expiredNotice', 'This assignment has expired.')}
            </div>
          )}
        </div>

        {/* Programming Questions */}
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">
                {t('assignmentDetail.programmingQuestions')}
              </h2>
              <p className="text-xs text-white/50">
                {t('assignmentDetail.questionsCount', { count: programming_questions.length })}
              </p>
            </div>
          </div>

          {programming_questions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 backdrop-blur-xl p-8 text-center">
              <p className="text-sm text-white/50">
                {t('assignmentDetail.noProgramming')}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {programming_questions.map((question) => (
                <div
                  key={question.id}
                  className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-lg transition-all hover:-translate-y-1 hover:border-violet-400/40 hover:shadow-xl"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="rounded-full bg-violet-400/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-violet-300 border border-violet-400/30">
                      {question.level || t('assignmentDetail.levelMedium')}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-bold ${
                        question.status === 'completed'
                          ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                          : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                      }`}
                    >
                      {question.status || t('assignmentDetail.statusPending')}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white line-clamp-2">
                    {question.question || t('assignmentDetail.untitledQuestion')}
                  </h3>
                  {question.description && (
                    <p className="mt-2 text-xs text-white/50 line-clamp-3">
                      {question.description}
                    </p>
                  )}
                  <div className="flex-1" />
                  <button
                    onClick={() =>
                      router.push(
                        `/student/knowmato-plus/assignments/${attempt.id}/question/${question.id}`
                      )
                    }
                    className={`mt-4 w-full rounded-xl py-2 text-sm font-bold transition-all ${
                      isExpired
                        ? 'border border-white/20 bg-white/10 text-white/70 hover:bg-white/20'
                        : 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25 hover:from-violet-600 hover:to-fuchsia-600'
                    }`}
                  >
                    {isExpired
                      ? t('assignmentDetail.viewHistory', 'View History')
                      : t('assignmentDetail.attempt')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* MCQ Quizzes */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">
                {t('assignmentDetail.mcqQuestions')}
              </h2>
              <p className="text-xs text-white/50">
                {t('assignmentDetail.mcqCount', {
                  questionCount: mcq_quizzes.length,
                  groupCount: groupedQuizzes().length,
                })}
              </p>
            </div>
          </div>

          {mcq_quizzes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 backdrop-blur-xl p-8 text-center">
              <p className="text-sm text-white/50">
                {t('assignmentDetail.noMCQ')}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {groupedQuizzes().map((group) => (
                <div
                  key={`${group.category}-${group.subtype}`}
                  className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-lg transition-all hover:-translate-y-1 hover:border-fuchsia-400/40 hover:shadow-xl"
                >
                  <span className="mb-2 inline-block w-fit rounded-full bg-fuchsia-400/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-fuchsia-300 border border-fuchsia-400/30">
                    {group.category}
                  </span>
                  <h3 className="text-base font-bold text-white">
                    {group.subtype !== 'General' ? group.subtype : group.category}
                  </h3>
                  <p className="mt-1 text-sm text-white/50">
                    {t('assignmentDetail.groupQuestionCount', { count: group.count })}
                  </p>
                  <div className="flex-1" />
                  <button
                    onClick={() =>
                      router.push(
                        `/student/knowmato-plus/assignments/${attempt.id}/mcq/${group.quizId}`
                      )
                    }
                    className={`mt-4 w-full rounded-xl py-2 text-sm font-bold transition-all ${
                      isExpired
                        ? 'border border-white/20 bg-white/10 text-white/70 hover:bg-white/20'
                        : 'bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white shadow-lg shadow-fuchsia-500/25 hover:from-fuchsia-600 hover:to-pink-600'
                    }`}
                  >
                    {isExpired
                      ? t('assignmentDetail.viewHistory', 'View History')
                      : t('assignmentDetail.startMCQs')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}