'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  getAssignmentDetails,
  MCQQuestion,
  evaluateAnswers,
  EvaluateAnswersResponse,
} from '@/services/assessmentService';

// ---------- Types ----------
interface AnswerMap {
  [questionIndex: number]: string; // 1‑based index → selected option string
}

export default function MCQPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const assignmentId = Number(params.id);
  const type = searchParams.get('type') || '';
  const subtype = searchParams.get('subtype') || '';

  // ─── State ──────────────────────────────────────────────
  const [mcqs, setMcqs] = useState<MCQQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [answers, setAnswers] = useState<AnswerMap>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<EvaluateAnswersResponse | null>(null);

  // ─── Fetch assignment MCQs ────────────────────────────
  useEffect(() => {
    if (!assignmentId || !type || !subtype) {
      setError('Invalid MCQ parameters.');
      setLoading(false);
      return;
    }

    const fetchMCQs = async () => {
      try {
        const assignmentDetails = await getAssignmentDetails(assignmentId);
        // Filter MCQs that match the given type and subtype
        const filtered = assignmentDetails.mcqs.filter(
          (mcq) => mcq.list === type && mcq.subtype === subtype
        );
        setMcqs(filtered);

        if (filtered.length === 0) {
          setError('No questions found for this category.');
        }
      } catch (err) {
        toast.error('Failed to load MCQ questions.');
        setError('Could not load questions.');
      } finally {
        setLoading(false);
      }
    };

    fetchMCQs();
  }, [assignmentId, type, subtype]);

  // ─── Answer selection handler ──────────────────────────
  const handleSelectAnswer = (questionIndex: number, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: option }));
  };

  // ─── Submit & evaluate ────────────────────────────────
  const handleSubmit = async () => {
    // Validate all questions answered
    const unanswered = mcqs.some((_, idx) => !answers[idx + 1]);
    if (unanswered) {
      toast.error('Please answer all questions before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        type,
        subtype,
        answers: Object.fromEntries(
          Object.entries(answers).map(([key, value]) => [String(key), String(value)])
        ),
      };

      const res = await evaluateAnswers(payload);
      setResults(res);
      toast.success('MCQ test completed!');
    } catch (err) {
      toast.error('Evaluation failed. Please try again.');
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
          <p className="mt-2 text-sm text-white/70">Loading questions…</p>
        </div>
      </div>
    );
  }

  if (error || mcqs.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center max-w-md rounded-2xl border border-dashed border-white/20 bg-white/5 p-8 backdrop-blur-xl">
          <p className="text-4xl mb-4">📭</p>
          <p className="text-white/70">{error || 'No questions found.'}</p>
          <button
            onClick={() => router.push(`/student/knowmato-plus/assignments/${assignmentId}`)}
            className="mt-4 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-2 text-sm font-bold text-white shadow-lg"
          >
            Back to Assignment
          </button>
        </div>
      </div>
    );
  }

  // ─── Main render ──────────────────────────────────────
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
            onClick={() => router.push(`/student/knowmato-plus/assignments/${assignmentId}`)}
            className="mb-4 flex items-center gap-1 text-sm font-semibold text-violet-300 hover:text-violet-200 transition-colors"
          >
            ← Back to Assignment
          </button>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 md:text-3xl">
            📝 {type} – {subtype !== 'default' && subtype !== '' ? subtype : 'General'}
          </h1>
          <p className="mt-2 text-sm text-white/50">
            {mcqs.length} question{mcqs.length > 1 ? 's' : ''} • Select the best answer for each
          </p>
        </div>

        {/* Results display (after submission) */}
        {results ? (
          <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-lg">
            <h2 className="text-xl font-bold text-white">✅ Test Completed</h2>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-xl bg-white/5 p-4 text-center">
                <p className="text-xs text-white/50">Correct</p>
                <p className="text-2xl font-bold text-emerald-300">{results.total_correct}</p>
              </div>
              <div className="rounded-xl bg-white/5 p-4 text-center">
                <p className="text-xs text-white/50">Total</p>
                <p className="text-2xl font-bold text-white">{results.total_questions}</p>
              </div>
              <div className="rounded-xl bg-white/5 p-4 text-center">
                <p className="text-xs text-white/50">Percentage</p>
                <p className="text-2xl font-bold text-cyan-300">{results.percentage.toFixed(0)}%</p>
              </div>
              <div className="rounded-xl bg-white/5 p-4 text-center">
                <p className="text-xs text-white/50">Status</p>
                <span className="inline-block mt-1 rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-bold text-emerald-300 border border-emerald-400/30">
                  Completed
                </span>
              </div>
            </div>

            {/* Detailed per‑question review */}
            <div className="mt-6 space-y-3">
              {mcqs.map((mcq, idx) => {
                const userAnswer = answers[idx + 1];
                const isCorrect = userAnswer === mcq.correct_answer;
                return (
                  <div
                    key={mcq.id}
                    className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg">{isCorrect ? '✅' : '❌'}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white mb-2">
                          {idx + 1}. {mcq.question}
                        </p>
                        <div className="space-y-1">
                          {mcq.options.map((opt) => {
                            let optStyle = 'text-white/60';
                            if (opt === mcq.correct_answer) optStyle = 'text-emerald-300 font-bold';
                            else if (opt === userAnswer && !isCorrect) optStyle = 'text-red-300';
                            return (
                              <p key={opt} className={`text-xs ml-4 ${optStyle}`}>
                                {opt === userAnswer ? '▸ ' : '  '}{opt}
                                {opt === mcq.correct_answer && ' ✓'}
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
                onClick={() => router.push(`/student/knowmato-plus/assignments/${assignmentId}`)}
                className="rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/25 hover:from-violet-600 hover:to-fuchsia-600 transition-all"
              >
                Back to Assignment
              </button>
            </div>
          </div>
        ) : (
          /* Questions & submit form */
          <>
            <div className="space-y-6">
              {mcqs.map((mcq, idx) => {
                const questionNum = idx + 1;
                return (
                  <div
                    key={mcq.id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-lg"
                  >
                    <h3 className="text-base font-bold text-white">
                      {questionNum}. {mcq.question}
                    </h3>
                    <div className="mt-3 space-y-2">
                      {mcq.options.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => handleSelectAnswer(questionNum, opt)}
                          className={`w-full text-left rounded-xl border px-4 py-3 text-sm transition-all ${
                            answers[questionNum] === opt
                              ? 'border-violet-400 bg-violet-400/10 text-violet-300 font-semibold'
                              : 'border-white/10 bg-white/5 text-white/70 hover:border-violet-400/40 hover:bg-white/10'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
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
                    Submitting…
                  </>
                ) : (
                  '📊 Submit Answers'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}