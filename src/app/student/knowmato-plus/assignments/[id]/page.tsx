'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next'; // ✅ added
import {
  getAssignmentDetails,
  AssignmentDetails,
  ProgrammingQuestion,
  MCQQuestion,
} from '@/services/assessmentService';

export default function AssignmentDetailPage() {
  const { t } = useTranslation(); // ✅ added
  const params = useParams();
  const router = useRouter();
  const assignmentId = Number(params.id);

  // ─── state ───────────────────────────────────────────────
  const [assignment, setAssignment] = useState<AssignmentDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // ─── fetch assignment details ───────────────────────────
  useEffect(() => {
    if (!assignmentId || isNaN(assignmentId)) {
      toast.error(t('assignmentDetail.invalidId'));
      router.replace('/student/knowmato-plus/assignments');
      return;
    }

    const fetchDetails = async () => {
      try {
        const data = await getAssignmentDetails(assignmentId);
        setAssignment(data);
      } catch (error) {
        console.error('Error fetching assignment details:', error);
        toast.error(t('assignmentDetail.loadError'));
        router.push('/student/knowmato-plus/assignments');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [assignmentId, router, t]);

  // ─── group MCQs by type + subtype ────────────────────────
  const mcqGroups = (mcqs: MCQQuestion[]) => {
    const groups: Record<string, { type: string; subtype: string; count: number }> = {};
    mcqs.forEach((mcq) => {
      const key = `${mcq.list}|||${mcq.subtype || 'default'}`;
      if (!groups[key]) {
        groups[key] = { type: mcq.list, subtype: mcq.subtype || 'default', count: 0 };
      }
      groups[key].count += 1;
    });
    return Object.values(groups);
  };

  // ─── loading skeleton ────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-violet-400 border-t-transparent" />
          <p className="mt-2 text-sm text-white/70">{t('assignmentDetail.loading')}</p>
        </div>
      </div>
    );
  }

  if (!assignment) return null; // redirected

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
            {t('assignmentDetail.title', { id: assignment.assignment_id })}
          </h1>
          <p className="mt-2 text-sm text-white/50">
            {t('assignmentDetail.subtitle')}
          </p>
        </div>

        {/* Programming Questions */}
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">
                {t('assignmentDetail.programmingQuestions')}
              </h2>
              <p className="text-xs text-white/50">
                {t('assignmentDetail.questionsCount', { count: assignment.questions.length })}
              </p>
            </div>
          </div>

          {assignment.questions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 backdrop-blur-xl p-8 text-center">
              <p className="text-sm text-white/50">
                {t('assignmentDetail.noProgramming')}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {assignment.questions.map((question) => (
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
                        `/student/knowmato-plus/assignments/${assignment.assignment_id}/question/${question.id}`
                      )
                    }
                    className="mt-4 w-full rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 py-2 text-sm font-bold text-white shadow-lg shadow-violet-500/25 hover:from-violet-600 hover:to-fuchsia-600 transition-all"
                  >
                    {t('assignmentDetail.attempt')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* MCQ Questions */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">
                {t('assignmentDetail.mcqQuestions')}
              </h2>
              <p className="text-xs text-white/50">
                {t('assignmentDetail.mcqCount', {
                  questionCount: assignment.mcqs.length,
                  groupCount: mcqGroups(assignment.mcqs).length,
                })}
              </p>
            </div>
          </div>

          {assignment.mcqs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 backdrop-blur-xl p-8 text-center">
              <p className="text-sm text-white/50">
                {t('assignmentDetail.noMCQ')}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mcqGroups(assignment.mcqs).map((group) => (
                <div
                  key={`${group.type}-${group.subtype}`}
                  className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-lg transition-all hover:-translate-y-1 hover:border-fuchsia-400/40 hover:shadow-xl"
                >
                  <span className="mb-2 inline-block w-fit rounded-full bg-fuchsia-400/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-fuchsia-300 border border-fuchsia-400/30">
                    {group.type}
                  </span>
                  <h3 className="text-base font-bold text-white">
                    {group.subtype !== 'default' ? group.subtype : t('assignmentDetail.general')}
                  </h3>
                  <p className="mt-1 text-sm text-white/50">
                    {t('assignmentDetail.groupQuestionCount', { count: group.count })}
                  </p>
                  <div className="flex-1" />
                  <button
                    onClick={() =>
                      router.push(
                        `/student/knowmato-plus/assignments/${assignment.assignment_id}/mcq?type=${encodeURIComponent(
                          group.type
                        )}&subtype=${encodeURIComponent(group.subtype)}`
                      )
                    }
                    className="mt-4 w-full rounded-xl bg-gradient-to-r from-fuchsia-500 to-pink-500 py-2 text-sm font-bold text-white shadow-lg shadow-fuchsia-500/25 hover:from-fuchsia-600 hover:to-pink-600 transition-all"
                  >
                    {t('assignmentDetail.startMCQs')}
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