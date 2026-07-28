'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import {
  getAttemptDetails,
  getQuizQuestions,
  saveMCQAnswer,
  getSavedMCQAnswers,
  submitAssessment,
  getAssessmentResult,
} from '@/services/assessmentService';

// ---------- Types ----------
interface Option {
  id: number;
  option_text: string;
  is_correct?: boolean;
}

interface QuizQuestion {
  id: number;
  question: string;
  marks: number;
  options: Option[];
}

interface SavedAnswer {
  question_id: number;
  selected_option_id: number | null;
}

export default function MCQQuizPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();

  const attemptId = Number(params.id);
  const quizId = Number(params.quizId);

  console.log(params);
  console.log("attemptId =", attemptId);
  console.log("quizId =", quizId);

  // ─── State ──────────────────────────────────────────────
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDuration, setQuizDuration] = useState<number>(0);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Answers mapping: questionId -> selectedOptionId
  const [answers, setAnswers] = useState<Record<number, number | null>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resultSummary, setResultSummary] = useState<any>(null);

  // ─── Fetch quiz data & saved answers ────────────────────
  useEffect(() => {
    if (!attemptId || !quizId) {
      setError(t('mcq.invalidParams'));
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch attempt details to get quiz metadata
        const attemptRes = await getAttemptDetails(attemptId);
        const attemptData = attemptRes?.data ?? attemptRes;
        const quiz = attemptData.mcq_quizzes.find((q: any) => q.id === quizId);
        if (!quiz) throw new Error(t('mcq.quizNotFound'));
        setQuizTitle(quiz.title || quiz.category);
        setQuizDuration(quiz.duration_minutes || 0);

        // Fetch questions for this quiz
        const questionsRes = await getQuizQuestions(quizId);
        const questionsData = questionsRes?.data ?? questionsRes;
        setQuestions(questionsData as QuizQuestion[]);

        // Fetch previously saved answers
        const savedAnswersRes = await getSavedMCQAnswers(attemptId);
        const savedAnswers = savedAnswersRes?.data ?? savedAnswersRes;
        const answerMap: Record<number, number | null> = {};
        if (Array.isArray(savedAnswers)) {
          savedAnswers.forEach((ans: SavedAnswer) => {
            if (ans.question_id && ans.selected_option_id) {
              answerMap[ans.question_id] = ans.selected_option_id;
            }
          });
        }
        setAnswers(answerMap);
      } catch (err: any) {
        console.error(err);
        toast.error(t('mcq.loadError'));
        setError(err.message || t('mcq.loadError'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [attemptId, quizId, t]);

  // ─── Auto‑save answer on selection ──────────────────────
  const handleSelectAnswer = useCallback(
    async (questionId: number, optionId: number) => {
      // Optimistic UI update
      setAnswers((prev) => ({ ...prev, [questionId]: optionId }));

      try {
        await saveMCQAnswer(attemptId, {
          question_id: questionId,
          selected_option_id: optionId,
        });
      } catch (err) {
        toast.error(t('mcq.saveError'));
      }
    },
    [attemptId, t]
  );

  // ─── Submit the entire attempt ──────────────────────────
  const handleSubmit = async () => {
    // Check that every question has an answer (optional, but good UX)
    const unanswered = questions.some((q) => !answers[q.id]);
    if (unanswered) {
      toast.error(t('mcq.answerAll'));
      return;
    }

    setIsSubmitting(true);
    try {
      // Finalise the attempt (this will grade all answers)
      await submitAssessment(attemptId);
      // Fetch the result
      const resultRes = await getAssessmentResult(attemptId);
      const resultData = resultRes?.data ?? resultRes;
      setResultSummary(resultData);
      setSubmitted(true);
      toast.success(t('mcq.submitSuccess'));
    } catch (err) {
      toast.error(t('mcq.submitError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Loading / Error views ────────────────────────────
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-violet-400 border-t-transparent" />
          <p className="mt-2 text-sm text-white/70">{t('mcq.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center max-w-md rounded-2xl border border-dashed border-white/20 bg-white/5 p-8 backdrop-blur-xl">
          <p className="text-4xl mb-4">📭</p>
          <p className="text-white/70">{error || t('mcq.noQuestions')}</p>
          <button
            onClick={() => router.push(`/student/knowmato-plus/attempt/${attemptId}`)}
            className="mt-4 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-2 text-sm font-bold text-white shadow-lg"
          >
            {t('mcq.backToAssignment')}
          </button>
        </div>
      </div>
    );
  }

  // ─── Submitted result view ────────────────────────────
  if (submitted && resultSummary) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
        <div className="absolute -left-20 top-0 h-72 w-72 animate-blob rounded-full bg-purple-500/20 blur-3xl filter mix-blend-multiply" />
        <div className="animation-delay-2000 absolute -right-20 top-0 h-72 w-72 animate-blob rounded-full bg-fuchsia-500/20 blur-3xl filter mix-blend-multiply" />
        <div className="animation-delay-4000 absolute -bottom-20 left-40 h-72 w-72 animate-blob rounded-full bg-cyan-500/20 blur-3xl filter mix-blend-multiply" />

        <div className="relative z-10 p-4 sm:p-6 lg:p-8">
          <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-lg">
            <h2 className="text-xl font-bold text-white">{t('mcq.testCompleted')}</h2>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-xl bg-white/5 p-4 text-center">
                <p className="text-xs text-white/50">{t('mcq.score')}</p>
                <p className="text-2xl font-bold text-emerald-300">{resultSummary.mcq_score}</p>
              </div>
              <div className="rounded-xl bg-white/5 p-4 text-center">
                <p className="text-xs text-white/50">{t('mcq.total')}</p>
                <p className="text-2xl font-bold text-white">{resultSummary.total_marks}</p>
              </div>
              <div className="rounded-xl bg-white/5 p-4 text-center">
                <p className="text-xs text-white/50">{t('mcq.percentage')}</p>
                <p className="text-2xl font-bold text-cyan-300">{parseFloat(resultSummary.percentage).toFixed(0)}%</p>
              </div>
              <div className="rounded-xl bg-white/5 p-4 text-center">
                <p className="text-xs text-white/50">{t('mcq.status')}</p>
                <span className="inline-block mt-1 rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-bold text-emerald-300 border border-emerald-400/30">
                  {t('mcq.passed')}
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {questions.map((q, idx) => {
                const selectedOptId = answers[q.id];
                const correctOpt = q.options.find((o) => o.is_correct);
                const isCorrect = selectedOptId === correctOpt?.id;
                return (
                  <div
                    key={q.id}
                    className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg">{isCorrect ? '✅' : '❌'}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white mb-2">
                          {idx + 1}. {q.question}
                        </p>
                        <div className="space-y-1">
                          {q.options.map((opt) => {
                            let optStyle = 'text-white/60';
                            if (opt.id === correctOpt?.id) optStyle = 'text-emerald-300 font-bold';
                            else if (opt.id === selectedOptId && !isCorrect) optStyle = 'text-red-300';
                            return (
                              <p key={opt.id} className={`text-xs ml-4 ${optStyle}`}>
                                {opt.id === selectedOptId ? '▸ ' : '  '}{opt.option_text}
                                {opt.id === correctOpt?.id && ' ✓'}
                              </p>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => router.push(`/student/knowmato-plus/attempt/${attemptId}/result`)}
                className="rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/25 hover:from-violet-600 hover:to-fuchsia-600 transition-all"
              >
                {t('mcq.viewFullResult')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main quiz view (answering) ──────────────────────
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
      <div className="absolute -left-20 top-0 h-72 w-72 animate-blob rounded-full bg-purple-500/20 blur-3xl filter mix-blend-multiply" />
      <div className="animation-delay-2000 absolute -right-20 top-0 h-72 w-72 animate-blob rounded-full bg-fuchsia-500/20 blur-3xl filter mix-blend-multiply" />
      <div className="animation-delay-4000 absolute -bottom-20 left-40 h-72 w-72 animate-blob rounded-full bg-cyan-500/20 blur-3xl filter mix-blend-multiply" />

      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/student/knowmato-plus/attempt/${attemptId}`)}
            className="mb-4 flex items-center gap-1 text-sm font-semibold text-violet-300 hover:text-violet-200 transition-colors"
          >
            ← {t('mcq.backToAssignment')}
          </button>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 md:text-3xl">
            📝 {quizTitle}
          </h1>
          <p className="mt-2 text-sm text-white/50">
            {t('mcq.questionCount', { count: questions.length })} • {t('mcq.selectBest')}
            {quizDuration > 0 && ` • ${quizDuration} min`}
          </p>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {questions.map((q, idx) => (
            <div
              key={q.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-lg"
            >
              <h3 className="text-base font-bold text-white">
                {idx + 1}. {q.question}
              </h3>
              <div className="mt-3 space-y-2">
                {q.options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectAnswer(q.id, opt.id)}
                    className={`w-full text-left rounded-xl border px-4 py-3 text-sm transition-all ${
                      answers[q.id] === opt.id
                        ? 'border-violet-400 bg-violet-400/10 text-violet-300 font-semibold'
                        : 'border-white/10 bg-white/5 text-white/70 hover:border-violet-400/40 hover:bg-white/10'
                    }`}
                  >
                    {opt.option_text}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Submit button */}
        <div className="mt-8 text-center">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 mx-auto rounded-xl bg-gradient-to-r from-fuchsia-500 to-pink-500 px-8 py-3 text-base font-bold text-white shadow-lg shadow-fuchsia-500/25 hover:from-fuchsia-600 hover:to-pink-600 disabled:opacity-50 transition-all"
          >
            {isSubmitting ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {t('mcq.submitting')}
              </>
            ) : (
              t('mcq.submitAnswers')
            )}
          </button>
        </div>
      </div>
    </div>
  );
}