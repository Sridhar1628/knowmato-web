'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import CodeCompiler from '@/components/CodeCompiler';
import {
  getAttemptDetails,
  getQuizQuestions,
  saveMCQAnswer,
  getSavedMCQAnswers,
  saveProgrammingCode,
  getSavedProgrammingCode,
  runTestCases,
  getTestCases,
  submitAssessment,
  getAssessmentResult,
} from '@/services/assessmentService';

type Language = 'C' | 'cpp' | 'Java' | 'python';
type QuestionType = 'programming' | 'mcq';
type Status = 'not_attempted' | 'attempted' | 'passed' | 'failed';

interface Option { id: number; option_text: string; is_correct?: boolean; }
interface ProgrammingQuestion { id: number; question: string; description?: string; level?: string; marks?: number; [key: string]: any; }
interface MCQQuestion { id: number; question: string; marks?: number; options: Option[]; quizId: number; quizTitle?: string; [key: string]: any; }
type UnifiedQuestion =
  | { id: number; type: 'programming'; data: ProgrammingQuestion; uniqueId: string }
  | { id: number; type: 'mcq'; data: MCQQuestion; uniqueId: string };

interface ProgramState {
  code: string; language: Language; testResults: any | null; terminalOutput: string;
  terminalInput: string; customInput: string; isRunning: boolean; isCompiling: boolean;
}

const LANGUAGES: { label: string; value: Language }[] = [
  { label: 'C', value: 'C' }, { label: 'C++', value: 'cpp' },
  { label: 'Java', value: 'Java' }, { label: 'Python', value: 'python' },
];
const STARTER: Record<Language, string> = {
  C: '#include <stdio.h>\n\nint main() {\n    // Your code here\n    return 0;\n}',
  cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your code here\n    return 0;\n}',
  Java: 'public class Main {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}',
  python: 'def solve():\n    # Your code here\n    pass\n\nsolve()',
};
const payload = <T,>(r: any): T => (r?.data ?? r) as T;
const lang = (v: any): Language => {
  const x = String(v ?? '').toLowerCase();
  return x === 'cpp' || x === 'c++' ? 'cpp' : x === 'java' ? 'Java' : x === 'c' ? 'C' : 'python';
};
const codeKey = (a: number, q: number, l: string) => `assessment_${a}_program_${q}_${l}`;
const statusKey = (a: number) => `assessment_${a}_statuses`;
const answerKey = (a: number) => `assessment_${a}_answers`;
const timeText = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

export default function AssessmentPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const attemptId = Number(params?.id);
  const mounted = useRef(true);
  const saveTimers = useRef<Record<number, ReturnType<typeof setTimeout> | undefined>>({});

  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState<any>(null);
  const [assignment, setAssignment] = useState<any>(null);
  const [questions, setQuestions] = useState<UnifiedQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number | null>>({});
  const [programs, setPrograms] = useState<Record<number, ProgramState>>({});
  const [results, setResults] = useState<Record<number, any | null>>({});
  const [testCases, setTestCases] = useState<Record<number, any | null>>({});
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [savingAnswer, setSavingAnswer] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [finalResult, setFinalResult] = useState<any>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [expired, setExpired] = useState(false);
  const expirySubmit = useRef(false);

  const current = questions[index] ?? null;
  const currentProgram = current?.type === 'programming' ? programs[current.id] : null;
  const currentResult = current?.type === 'programming' ? results[current.id] : null;
  const currentCases = current?.type === 'programming' ? testCases[current.id] : null;

  const getStatus = useCallback((q: UnifiedQuestion): Status => {
    if (q.type === 'mcq') return answers[q.id] != null ? 'attempted' : 'not_attempted';
    const s = programs[q.id]; const r = results[q.id] ?? s?.testResults;
    if (!s?.code?.trim()) return 'not_attempted';
    if (r) return r.passed_cases === r.total_cases ? 'passed' : 'failed';
    return 'attempted';
  }, [answers, programs, results]);

  useEffect(() => {
    const next: Record<string, Status> = {};
    questions.forEach(q => { next[q.uniqueId] = getStatus(q); });
    setStatuses(next);
  }, [questions, getStatus]);

  useEffect(() => {
    mounted.current = true;
    if (!attemptId) { toast.error('Invalid assessment attempt.'); setLoading(false); return; }
    (async () => {
      try {
        const raw = payload<any>(await getAttemptDetails(attemptId));
        setAttempt(raw?.attempt ?? null); setAssignment(raw?.assignment ?? null);
        const unified: UnifiedQuestion[] = [];
        const pqs: ProgrammingQuestion[] = Array.isArray(raw?.programming_questions) ? raw.programming_questions : [];
        pqs.forEach(q => unified.push({ id: q.id, type: 'programming', data: q, uniqueId: `programming-${q.id}` }));
        const quizzes = Array.isArray(raw?.mcq_quizzes) ? raw.mcq_quizzes : [];
        const mcq = await Promise.allSettled(quizzes.map(async (quiz: any) => ({ quiz, questions: payload<any[]>(await getQuizQuestions(quiz.id)) })));
        mcq.forEach(x => {
          if (x.status !== 'fulfilled') return;
          const qs = Array.isArray(x.value.questions) ? x.value.questions : [];
          qs.forEach((q: any) => unified.push({
            id: q.id, type: 'mcq', uniqueId: `mcq-${q.id}`,
            data: { ...q, quizId: x.value.quiz.id, quizTitle: x.value.quiz.title || x.value.quiz.category || '' },
          }));
        });
        if (!unified.length) throw new Error('No assessment questions were found.');
        setQuestions(unified);

        const a: Record<number, number | null> = {};
        try {
          const saved = payload<any[]>(await getSavedMCQAnswers(attemptId));
          if (Array.isArray(saved)) saved.forEach(x => { if (x?.question_id != null) a[Number(x.question_id)] = x.selected_option_id ?? null; });
        } catch {}
        try {
          const local = localStorage.getItem(answerKey(attemptId));
          if (local) Object.entries(JSON.parse(local)).forEach(([k, v]) => { if (a[Number(k)] == null) a[Number(k)] = v as number; });
        } catch {}
        setAnswers(a);

        const ps: Record<number, ProgramState> = {};
        try {
          const saved = payload<any[]>(await getSavedProgrammingCode(attemptId));
          if (Array.isArray(saved)) saved.forEach(x => {
            const q = Number(x.question_id); if (!q) return;
            const l = lang(x.language);
            ps[q] = { code: x.code || STARTER[l], language: l, testResults: null, terminalOutput: '', terminalInput: '', customInput: '', isRunning: false, isCompiling: false };
          });
        } catch {}
        pqs.forEach(q => {
          if (ps[q.id]) return;
          let l: Language = 'python'; let c = STARTER[l];
          try { c = localStorage.getItem(codeKey(attemptId, q.id, l)) || c; } catch {}
          ps[q.id] = { code: c, language: l, testResults: null, terminalOutput: '', terminalInput: '', customInput: '', isRunning: false, isCompiling: false };
        });
        setPrograms(ps);

        const st: Record<string, Status> = {};
        try { const old = JSON.parse(localStorage.getItem(statusKey(attemptId)) || '{}'); unified.forEach(q => { st[q.uniqueId] = old[q.uniqueId] || 'not_attempted'; }); }
        catch { unified.forEach(q => { st[q.uniqueId] = 'not_attempted'; }); }
        setStatuses(st);

        const tc: Record<number, any | null> = {};
        const tcResults = await Promise.allSettled(pqs.map(async q => ({ id: q.id, value: await getTestCases(q.id) })));
        tcResults.forEach(x => { if (x.status === 'fulfilled') tc[x.value.id] = x.value.value; });
        setTestCases(tc);
      } catch (e: any) {
        console.error(e); toast.error(e?.message || t('codeEditor.loadFailed', 'Failed to load assessment.'));
        router.push(`/student/knowmato-plus/assignments/${attemptId}`);
      } finally { if (mounted.current) setLoading(false); }
    })();
    return () => {
      mounted.current = false;
      Object.values(saveTimers.current).forEach(x => x && clearTimeout(x));
    };
  }, [attemptId, router, t]);

  useEffect(() => {
    if (!assignment?.date_of_expiry) return;
    const tick = () => {
      const d = new Date(assignment.date_of_expiry);
      if (assignment.time) { const p = String(assignment.time).split(':'); d.setHours(Number(p[0] || 0), Number(p[1] || 0), Number(p[2] || 0), 0); }
      const ms = d.getTime() - Date.now(); setRemaining(Math.max(0, ms)); setExpired(ms <= 0);
    };
    tick(); const id = window.setInterval(tick, 1000); return () => window.clearInterval(id);
  }, [assignment]);

  const submit = useCallback(async (automatic = false) => {
    if (!attemptId || submitting || submitted) return;
    setSubmitting(true);
    try {
      await submitAssessment(attemptId);
      const r = payload<any>(await getAssessmentResult(attemptId));
      if (mounted.current) { setFinalResult(r); setSubmitted(true); }
      toast.success(automatic ? 'Time expired. Assessment submitted.' : 'Assessment submitted successfully.');
    } catch (e: any) { toast.error(e?.message || 'Failed to submit assessment.'); }
    finally { if (mounted.current) setSubmitting(false); }
  }, [attemptId, submitting, submitted]);

  useEffect(() => {
    if (expired && !expirySubmit.current && !loading && !submitted) { expirySubmit.current = true; submit(true); }
  }, [expired, loading, submitted, submit]);

  const persistCode = useCallback((q: number, c: string, l: Language) => {
    try { localStorage.setItem(codeKey(attemptId, q, l), c); } catch {}
    if (saveTimers.current[q]) clearTimeout(saveTimers.current[q]);
    saveTimers.current[q] = setTimeout(() => {
      saveProgrammingCode(attemptId, { question_id: q, language: l, source_code: c }).catch(e => console.warn('Code autosave failed', e));
    }, 800);
  }, [attemptId]);

  const changeCode = useCallback((q: number, c: string) => {
    const l = programs[q]?.language || 'python';
    setPrograms(p => p[q] ? { ...p, [q]: { ...p[q], code: c } } : p);
    persistCode(q, c, l);
  }, [programs, persistCode]);

  const changeLanguage = useCallback((q: number, l: Language) => {
    setPrograms(p => {
      const s = p[q]; if (!s || s.language === l) return p;
      const c = !s.code.trim() || s.code === STARTER[s.language] ? STARTER[l] : s.code;
      return { ...p, [q]: { ...s, language: l, code: c, testResults: null } };
    });
    setResults(r => ({ ...r, [q]: null }));
    const s = programs[q]; const c = !s?.code?.trim() || s?.code === STARTER[s.language] ? STARTER[l] : s.code;
    persistCode(q, c, l);
  }, [programs, persistCode]);

  const runTests = useCallback(async (q: number) => {
    const s = programs[q]; if (!s || !s.code.trim()) { toast.error('Please write some code first.'); return; }
    setPrograms(p => ({ ...p, [q]: { ...p[q], isRunning: true } })); setResults(r => ({ ...r, [q]: null }));
    try {
      const r = payload<any>(await runTestCases({ language: s.language, question_id: q, source_code: s.code }));
      setResults(x => ({ ...x, [q]: r })); setPrograms(p => ({ ...p, [q]: { ...p[q], testResults: r, isRunning: false, isCompiling: false } }));
      const st: Status = r.passed_cases === r.total_cases ? 'passed' : 'failed';
      setStatuses(x => { const n = { ...x, [`programming-${q}`]: st }; try { localStorage.setItem(statusKey(attemptId), JSON.stringify(n)); } catch {} return n; });
      toast.success(`Tests completed: ${r.passed_cases}/${r.total_cases}`);
    } catch (e: any) { toast.error(e?.message || 'Failed to run tests.'); setPrograms(p => ({ ...p, [q]: { ...p[q], isRunning: false, isCompiling: false } })); }
  }, [programs, attemptId]);

  const selectMCQ = useCallback(async (q: number, option: number) => {
    if (expired || submitted) return;
    setAnswers(a => { const n = { ...a, [q]: option }; try { localStorage.setItem(answerKey(attemptId), JSON.stringify(n)); } catch {} return n; });
    setStatuses(s => ({ ...s, [`mcq-${q}`]: 'attempted' })); setSavingAnswer(q);
    try { await saveMCQAnswer(attemptId, { question_id: q, selected_option_id: option }); }
    catch (e: any) { toast.error(e?.message || 'Failed to save answer.'); }
    finally { if (mounted.current) setSavingAnswer(null); }
  }, [attemptId, expired, submitted]);

  const unanswered = useMemo(() => questions.filter(q => q.type === 'mcq' ? answers[q.id] == null : !programs[q.id]?.code?.trim()), [questions, answers, programs]);
  const go = (i: number) => { if (i >= 0 && i < questions.length) { setIndex(i); window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0); } };

  const finalSubmit = async () => {
    if (expired || submitting || submitted) return;
    const msg = unanswered.length ? `You have ${unanswered.length} unanswered question${unanswered.length === 1 ? '' : 's'}. Do you still want to submit?` : 'Submit your assessment?';
    if (window.confirm(msg)) await submit(false);
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white"><div className="text-center"><div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-violet-400 border-t-transparent" /><p className="mt-3 text-sm text-white/60">Loading assessment...</p></div></div>;

  if (submitted) return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] p-4 text-white sm:p-8">
      <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-xl shadow-2xl sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/15 text-3xl">✅</div>
        <h1 className="mt-4 text-2xl font-bold">Assessment Completed</h1>
        <p className="mt-2 text-sm text-white/55">Your assessment has been submitted successfully.</p>
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-xl bg-white/5 p-4"><p className="text-xs text-white/45">Questions</p><p className="mt-1 text-2xl font-bold">{questions.length}</p></div>
          <div className="rounded-xl bg-white/5 p-4"><p className="text-xs text-white/45">MCQ Score</p><p className="mt-1 text-2xl font-bold text-emerald-300">{finalResult?.mcq_score ?? finalResult?.mcq_marks ?? '—'}</p></div>
          <div className="rounded-xl bg-white/5 p-4"><p className="text-xs text-white/45">Programming</p><p className="mt-1 text-2xl font-bold text-cyan-300">{finalResult?.programming_score ?? finalResult?.programming_marks ?? '—'}</p></div>
          <div className="rounded-xl bg-white/5 p-4"><p className="text-xs text-white/45">Percentage</p><p className="mt-1 text-2xl font-bold text-violet-300">{finalResult?.percentage != null ? `${Number(finalResult.percentage).toFixed(0)}%` : '—'}</p></div>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button onClick={() => router.push(`/student/knowmato-plus/attempt/${attemptId}/result`)} className="rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-7 py-3 text-sm font-bold">View Full Result</button>
          <button onClick={() => router.push(`/student/knowmato-plus/assignments/${attemptId}`)} className="rounded-xl border border-white/15 bg-white/5 px-7 py-3 text-sm font-bold text-white/75">Back to Assignment</button>
        </div>
      </div>
    </div>
  );

  if (!current) return <div className="min-h-screen bg-[#17132f] p-8 text-center text-white">No assessment questions found.</div>;

  const progress = questions.length ? ((index + 1) / questions.length) * 100 : 0;
  const currentStatus = statuses[current.uniqueId] || getStatus(current);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="mx-auto max-w-[1600px] px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><button onClick={() => router.push(`/student/knowmato-plus/assignments/${attemptId}`)} className="text-xs font-semibold text-violet-300">← Back to Assignment</button><h1 className="mt-1 text-lg font-bold">{assignment?.title || assignment?.name || 'Assessment'}</h1></div>
            <div className="flex items-center gap-3"><div className={`rounded-full border px-4 py-2 text-sm font-bold ${expired ? 'border-red-400/30 bg-red-400/10 text-red-300' : remaining != null && remaining <= 300000 ? 'border-amber-400/30 bg-amber-400/10 text-amber-300' : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'}`}>{expired ? '⏰ Expired' : `⏳ ${remaining != null ? timeText(remaining) : '--:--:--'}`}</div><button onClick={finalSubmit} disabled={submitting || expired} className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-pink-500 px-5 py-2.5 text-sm font-bold disabled:opacity-50">{submitting ? 'Submitting...' : 'Submit Assessment'}</button></div>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 transition-all" style={{ width: `${progress}%` }} /></div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] p-4 pb-28 sm:p-6 lg:p-8"><div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-24 lg:self-start"><div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl shadow-xl"><p className="text-sm font-bold">Questions</p><p className="mt-1 text-xs text-white/45">{index + 1} of {questions.length}</p><div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-4">
          {questions.map((q, i) => { const s = statuses[q.uniqueId] || 'not_attempted'; return <button key={q.uniqueId} onClick={() => go(i)} title={q.type === 'programming' ? 'Programming' : 'MCQ'} className={`relative flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold ${s === 'passed' ? 'bg-emerald-500' : s === 'failed' ? 'bg-red-500' : s === 'attempted' ? 'bg-amber-500' : 'bg-white/10 text-white/60'} ${i === index ? 'ring-2 ring-white ring-offset-2 ring-offset-[#17132f]' : ''}`}>{i + 1}<span className="absolute -right-1 -top-1 text-[9px]">{q.type === 'programming' ? '💻' : '📝'}</span></button>; })}
        </div><div className="mt-5 border-t border-white/10 pt-4 text-[11px] text-white/50"><p>⚪ Not attempted</p><p className="mt-1">🟠 Attempted</p><p className="mt-1">🟢 Passed</p><p className="mt-1">🔴 Failed</p></div><div className="mt-4 rounded-xl bg-black/20 p-3"><p className="text-xs text-white/45">Progress</p><p className="mt-1 text-xl font-bold">{questions.filter(q => (statuses[q.uniqueId] || 'not_attempted') !== 'not_attempted').length} / {questions.length}</p></div></div></aside>

        <section className="min-w-0">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-xl"><div className="flex flex-wrap items-center justify-between gap-3"><span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${current.type === 'programming' ? 'bg-cyan-400/10 text-cyan-300' : 'bg-violet-400/10 text-violet-300'}`}>{current.type === 'programming' ? 'Programming' : 'MCQ'}</span><span className="text-xs text-white/45">Question {index + 1} / {questions.length}</span></div><h2 className="mt-4 text-xl font-bold leading-relaxed sm:text-2xl">{current.data.question}</h2>{current.type === 'programming' && current.data.description && <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-white/65">{current.data.description}</p>}{current.type === 'mcq' && current.data.quizTitle && <p className="mt-2 text-xs text-white/40">{current.data.quizTitle}</p>}</div>

          {current.type === 'programming' && currentProgram && <div className="mt-6 space-y-5">
            <div className="flex flex-wrap items-center gap-2"><span className="mr-1 text-sm font-semibold text-white/60">Language:</span>{LANGUAGES.map(l => <button key={l.value} onClick={() => changeLanguage(current.id, l.value)} disabled={currentProgram.isRunning || currentProgram.isCompiling || expired} className={`rounded-full px-4 py-2 text-xs font-bold ${currentProgram.language === l.value ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500' : 'border border-white/15 bg-white/5 text-white/65'} disabled:opacity-50`}>{l.label}</button>)}</div>
            {currentCases?.test_cases?.length > 0 && <div className="rounded-2xl border border-white/10 bg-white/5 p-5"><h3 className="mb-3 text-sm font-bold">📋 Sample Test Cases</h3><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{currentCases.test_cases.map((tc: any) => <div key={tc.id} className="rounded-xl bg-black/20 p-3"><p className="text-xs text-violet-300">Input</p><pre className="mt-1 whitespace-pre-wrap text-xs text-white/70">{tc.input_data || '—'}</pre><p className="mt-2 text-xs text-emerald-300">Expected Output</p><pre className="mt-1 whitespace-pre-wrap text-xs text-white/70">{tc.expected_output || '—'}</pre></div>)}</div></div>}
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-1 shadow-2xl"><CodeCompiler key={`${current.id}-${currentProgram.language}`} questionId={current.id} initialCode={currentProgram.code} initialLanguage={currentProgram.language} onCodeChange={c => changeCode(current.id, c)} /></div>
            <div className="flex justify-end"><button onClick={() => runTests(current.id)} disabled={currentProgram.isRunning || currentProgram.isCompiling || expired} className="rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-3 text-sm font-bold disabled:opacity-50">{currentProgram.isRunning || currentProgram.isCompiling ? '⏳ Running...' : '🚀 Run Test Cases'}</button></div>
            {currentResult && <div className="rounded-2xl border border-white/10 bg-white/5 p-5"><h3 className="mb-4 text-lg font-bold">📊 Test Results</h3><div className="grid grid-cols-2 gap-3 md:grid-cols-4"><div className="rounded-xl bg-white/5 p-4 text-center"><p className="text-xs text-white/45">Passed</p><p className="text-2xl font-bold text-emerald-300">{currentResult.passed_cases}</p></div><div className="rounded-xl bg-white/5 p-4 text-center"><p className="text-xs text-white/45">Total</p><p className="text-2xl font-bold">{currentResult.total_cases}</p></div><div className="rounded-xl bg-white/5 p-4 text-center"><p className="text-xs text-white/45">Score</p><p className="text-2xl font-bold text-cyan-300">{currentResult.marks}%</p></div><div className="rounded-xl bg-white/5 p-4 text-center"><p className="text-xs text-white/45">Status</p><p className="mt-2 text-sm font-bold">{currentResult.passed_cases === currentResult.total_cases ? '✅ Passed' : '❌ Failed'}</p></div></div>{currentResult.public_results?.length > 0 && <div className="mt-5 space-y-3">{currentResult.public_results.map((r: any) => <div key={r.test_case_id} className={`rounded-xl border p-4 ${r.passed ? 'border-emerald-400/25 bg-emerald-400/10' : 'border-red-400/25 bg-red-400/10'}`}><div className="flex justify-between text-sm font-bold"> <span>{r.passed ? '✅' : '❌'} Test Case #{r.test_case_id}</span><span>{r.passed ? 'Passed' : 'Failed'}</span></div><div className="mt-3 grid gap-3 md:grid-cols-3"><pre className="rounded-lg bg-black/20 p-3 text-xs whitespace-pre-wrap">Input: {r.input || '—'}</pre><pre className="rounded-lg bg-black/20 p-3 text-xs whitespace-pre-wrap">Expected: {r.expected || '—'}</pre><pre className="rounded-lg bg-black/20 p-3 text-xs whitespace-pre-wrap">Output: {r.output || r.error || '—'}</pre></div></div>)}</div>}{currentResult.hidden_summary && <div className="mt-4 rounded-xl bg-white/5 p-4 text-sm">🕵️ Hidden Cases: <b>{currentResult.hidden_summary.passed} / {currentResult.hidden_summary.count}</b> passed</div>}</div>}
          </div>}

          {current.type === 'mcq' && <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-xl"><div className="mb-5 flex items-center justify-between"><div><p className="text-xs uppercase text-white/40">Choose one answer</p>{current.data.marks != null && <p className="mt-1 text-xs text-white/40">{current.data.marks} mark{current.data.marks === 1 ? '' : 's'}</p>}</div>{savingAnswer === current.id && <span className="text-xs text-violet-300">Saving...</span>}</div><div className="space-y-3">{current.data.options.map((o, oi) => { const selected = answers[current.id] === o.id; return <button key={o.id} onClick={() => selectMCQ(current.id, o.id)} disabled={savingAnswer === current.id || expired} className={`flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition ${selected ? 'border-violet-400 bg-violet-400/10' : 'border-white/10 bg-white/5 hover:bg-white/10'} disabled:opacity-60`}><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${selected ? 'border-violet-300 bg-violet-500' : 'border-white/20'}`}>{String.fromCharCode(65 + oi)}</span><span className="pt-1 text-sm leading-relaxed">{o.option_text}</span></button>; })}</div></div>}

          <div className="mt-6 flex items-center justify-between gap-3"><button onClick={() => go(index - 1)} disabled={index === 0} className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold disabled:opacity-30">← Previous</button><span className="text-xs text-white/45">{currentStatus === 'passed' ? '✅ Passed' : currentStatus === 'failed' ? '❌ Failed' : currentStatus === 'attempted' ? '🟠 Attempted' : '⚪ Not attempted'}</span>{index < questions.length - 1 ? <button onClick={() => go(index + 1)} className="rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-3 text-sm font-bold">Next →</button> : <button onClick={finalSubmit} disabled={submitting || expired} className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-pink-500 px-6 py-3 text-sm font-bold disabled:opacity-50">Submit Assessment</button>}</div>
        </section>
      </div></main>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-black/60 p-3 backdrop-blur-xl lg:hidden"><div className="mx-auto flex max-w-3xl items-center gap-3"><div className="flex-1"><div className="h-1 overflow-hidden rounded bg-white/10"><div className="h-full bg-violet-500" style={{ width: `${progress}%` }} /></div></div><button onClick={finalSubmit} disabled={submitting || expired} className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-pink-500 px-4 py-2.5 text-xs font-bold disabled:opacity-50">{submitting ? 'Submitting...' : 'Submit'}</button></div></div>
    </div>
  );
}