'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Editor from '@monaco-editor/react';
import { useTranslation } from 'react-i18next';

import {
  getAttemptDetails,
  saveProgrammingCode,
  getSavedProgrammingCode,
  compileCode,
  runTestCases,
  getTestCases,
  submitAssessment,
  CompileResponse,
  RunTestResponse,
  TestCaseResponse,
} from '@/services/assessmentService';

const LANGUAGE_OPTIONS = [
  { label: 'C', value: 'C' },
  { label: 'C++', value: 'cpp' },
  { label: 'Java', value: 'Java' },
  { label: 'Python', value: 'python' },
] as const;

type Language = (typeof LANGUAGE_OPTIONS)[number]['value'];

const STARTER_CODES: Record<Language, string> = {
  C: `#include <stdio.h>\n\nint main() {\n    // Your code here\n    return 0;\n}`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your code here\n    return 0;\n}`,
  Java: `public class Main {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}`,
  python: `def solve():\n    # Your code here\n    pass\n\nsolve()`,
};

const storageKey = (attemptId: number, questionId: number, language: string) =>
  `attempt_${attemptId}_question_${questionId}_${language}`;

export default function ProgrammingQuestionPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const attemptId = Number(params.id);
  const questionId = Number(params.questionId);

  // Core data
  const [attempt, setAttempt] = useState<any>(null);
  const [assignment, setAssignment] = useState<any>(null);
  const [question, setQuestion] = useState<any>(null);
  const [allQuestions, setAllQuestions] = useState<any[]>([]);
  const [testCases, setTestCases] = useState<TestCaseResponse | null>(null);

  // Loading
  const [loading, setLoading] = useState(true);

  // Code editor
  const [language, setLanguage] = useState<Language>('python');
  const [code, setCode] = useState('');
  const [customInput, setCustomInput] = useState('');
  const editorMounted = useRef(false);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  // Compile / Run results
  const [compileOutput, setCompileOutput] = useState<string | null>(null);
  const [compileError, setCompileError] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [testResults, setTestResults] = useState<RunTestResponse | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);

  // Timer
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);

  // Question statuses: passed / failed / not_attempted
  const [questionStatuses, setQuestionStatuses] = useState<Record<number, 'passed' | 'failed' | 'not_attempted'>>({});

  // Fetch attempt details & saved code
  useEffect(() => {
    if (!attemptId || !questionId) return;

    const loadData = async () => {
      try {
        const res = await getAttemptDetails(attemptId);
        const data = res?.data ?? res;

        setAttempt(data.attempt);
        setAssignment(data.assignment);
        const questions = data.programming_questions ?? [];
        setAllQuestions(questions);

        const current = questions.find((q: any) => q.id === questionId);
        if (!current) {
          toast.error(t('codeEditor.questionNotFound'));
          router.push(`/student/knowmato-plus/assignments/${attemptId}`);
          return;
        }
        setQuestion(current);

        // Initialize question statuses
        const initial: Record<number, 'passed' | 'failed' | 'not_attempted'> = {};
        questions.forEach((q: any) => (initial[q.id] = 'not_attempted'));
        setQuestionStatuses(initial);

        // Load test cases
        try {
          const tcRes = await getTestCases(questionId);
          setTestCases(tcRes);
        } catch (e) {
          /* test cases optional */
        }

        // Load previously saved code
        const savedCodeRes = await getSavedProgrammingCode(attemptId);
        const savedCodes = savedCodeRes?.data ?? savedCodeRes;
        const saved = Array.isArray(savedCodes)
          ? savedCodes.find((sc: any) => sc.question_id === questionId)
          : null;

        if (saved?.code) {
          setCode(saved.code);
          if (saved.language) setLanguage(saved.language);
        } else {
          const local = localStorage.getItem(storageKey(attemptId, questionId, language));
          setCode(local || STARTER_CODES[language]);
        }
      } catch (error) {
        toast.error(t('codeEditor.loadFailed'));
        router.push(`/student/knowmato-plus/assignments/${attemptId}`);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [attemptId, questionId]);

  // Timer logic
  useEffect(() => {
    if (!assignment?.date_of_expiry) return;

    const calcRemaining = () => {
      const expiryDate = new Date(assignment.date_of_expiry);
      if (assignment.time) {
        const [h, m] = assignment.time.split(':');
        expiryDate.setHours(Number(h), Number(m), 0, 0);
      }
      const now = new Date();
      const diff = expiryDate.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeRemaining(t('codeEditor.timeExpired'));
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeRemaining(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
    };

    calcRemaining();
    const timer = setInterval(calcRemaining, 1000);
    return () => clearInterval(timer);
  }, [assignment, t]);

  // Auto‑save code
  const persistCode = useCallback(
    (newCode: string, lang: Language) => {
      localStorage.setItem(storageKey(attemptId, questionId, lang), newCode);
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => {
        saveProgrammingCode(attemptId, {
          question_id: questionId,
          language: lang,
          source_code: newCode,
        }).catch(console.error);
      }, 1000);
    },
    [attemptId, questionId]
  );

  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, []);

  // Language change
  const handleLanguageChange = (newLang: Language) => {
    if (newLang === language) return;
    const currentStarter = STARTER_CODES[language];
    const newStarter = STARTER_CODES[newLang];
    if (code.trim() === '' || code === currentStarter) {
      setCode(newStarter);
    }
    setLanguage(newLang);
  };

  // Compile & Run
  const handleCompile = async () => {
    if (!code.trim()) {
      toast.error(t('codeEditor.pleaseWriteCode'));
      return;
    }
    setIsCompiling(true);
    setCompileOutput(null);
    setCompileError(null);
    try {
      const result: CompileResponse = await compileCode({
        language,
        source_code: code,
        stdin: customInput || undefined,
      });
      if (result.error) setCompileError(result.error);
      else setCompileOutput(result.output || t('codeEditor.noOutput'));
    } catch (err: any) {
      setCompileError(err.message || t('codeEditor.compilationFailed'));
    } finally {
      setIsCompiling(false);
    }
  };

  const handleRunTests = async () => {
    if (!code.trim()) {
      toast.error(t('codeEditor.pleaseWriteCode'));
      return;
    }
    setIsRunningTests(true);
    setTestResults(null);
    try {
      const response = await runTestCases({
        language,
        question_id: questionId,
        source_code: code,
        input_data: customInput || undefined,
      });
      const result = response.data ?? response;
      setTestResults(result);

      // Update question status based on all test cases passed
      const allPassed = result.passed_cases === result.total_cases;
      setQuestionStatuses((prev) => ({
        ...prev,
        [questionId]: allPassed ? 'passed' : 'failed',
      }));

      toast.success(
        t('codeEditor.testsCompleted', {
          passed: result.passed_cases,
          total: result.total_cases,
        })
      );
    } catch (err: any) {
      toast.error(err.message || t('codeEditor.testsRunFailed'));
    } finally {
      setIsRunningTests(false);
    }
  };

  // Submit attempt
  const handleSubmitAttempt = async () => {
    if (!window.confirm(t('codeEditor.submitConfirm', 'Submit your assessment?'))) return;
    try {
      await submitAssessment(attemptId);
      toast.success(t('codeEditor.submitted'));
      router.push(`/student/knowmato-plus/assignments/${attemptId}/result`);
    } catch (err: any) {
      toast.error(err?.message || t('codeEditor.submitFailed'));
    }
  };

  // Navigation
  const currentIndex = allQuestions.findIndex((q) => q.id === questionId);
  const goToQuestion = (id: number) => {
      router.push(
          `/student/knowmato-plus/assignments/${attemptId}/question/${id}`
      );
  };
  const goToNext = () => {
    const nextIdx = currentIndex + 1;
    if (nextIdx < allQuestions.length) {
      goToQuestion(allQuestions[nextIdx].id);
    }
  };
  const goToPrev = () => {
    const prevIdx = currentIndex - 1;
    if (prevIdx >= 0) {
      goToQuestion(allQuestions[prevIdx].id);
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-violet-400 border-t-transparent" />
          <p className="mt-2 text-sm text-white/70">{t('codeEditor.loadingWorkspace')}</p>
        </div>
      </div>
    );
  }

  if (!question) return null;

  const sampleTestCases = testCases?.test_cases ?? [];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] flex flex-col">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -left-20 top-0 h-72 w-72 animate-blob rounded-full bg-purple-500/20 blur-3xl filter mix-blend-multiply" />
        <div className="animation-delay-2000 absolute -right-20 top-0 h-72 w-72 animate-blob rounded-full bg-fuchsia-500/20 blur-3xl filter mix-blend-multiply" />
        <div className="animation-delay-4000 absolute -bottom-20 left-40 h-72 w-72 animate-blob rounded-full bg-cyan-500/20 blur-3xl filter mix-blend-multiply" />
      </div>

      {/* Top bar */}
      <div className="relative z-10 px-4 sm:px-6 py-3 bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push(`/student/knowmato-plus/assignments/${attemptId}`)}
            className="text-sm font-semibold text-violet-300 hover:text-violet-200 transition-colors"
          >
            ← {t('codeEditor.backToAssignment')}
          </button>
          <div className="flex items-center gap-4">
            <button onClick={goToPrev} disabled={currentIndex === 0} className="text-white/70 disabled:opacity-30 text-lg">‹</button>
            <span className="text-sm text-white/70">
              {t('codeEditor.questionProgress', { current: currentIndex + 1, total: allQuestions.length })}
            </span>
            <button onClick={goToNext} disabled={currentIndex === allQuestions.length - 1} className="text-white/70 disabled:opacity-30 text-lg">›</button>
          </div>
          {timeRemaining && (
            <div className={`rounded-full px-3 py-1 text-xs font-bold ${
              timeRemaining === t('codeEditor.timeExpired')
                ? 'bg-red-400/20 text-red-300 border border-red-400/30'
                : 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
            }`}>
              {timeRemaining === t('codeEditor.timeExpired') ? `⏰ ${t('codeEditor.timeExpired')}` : `⏳ ${timeRemaining}`}
            </div>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto relative z-10 p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Question statement */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-lg">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full bg-violet-400/20 px-3 py-1 text-[10px] font-bold uppercase text-violet-300 border border-violet-400/30">
              {question.level}
            </span>
            <span className="text-xs text-white/50">
              {t('codeEditor.questionNumber', { id: question.id })}
            </span>
          </div>
          <h1 className="text-xl font-bold text-white">{question.question}</h1>
          {question.description && (
            <p className="mt-3 text-sm leading-relaxed text-white/70 whitespace-pre-wrap">
              {question.description}
            </p>
          )}
        </div>

        {/* Sample Test Cases */}
        {sampleTestCases.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-lg">
            <h3 className="mb-3 text-sm font-bold text-white/80">
              📋 {t('codeEditor.sampleTestCases')}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sampleTestCases.map((tc) => (
                <div key={tc.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <p className="text-xs text-violet-300 mb-1">{t('codeEditor.input')}:</p>
                  <pre className="text-xs text-white/80 whitespace-pre-wrap">{tc.input_data || '—'}</pre>
                  <p className="text-xs text-emerald-300 mt-2 mb-1">{t('codeEditor.expectedOutput')}:</p>
                  <pre className="text-xs text-white/80 whitespace-pre-wrap">{tc.expected_output || '—'}</pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Language selector + Compile/Run buttons */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white/70">{t('codeEditor.language')}:</span>
            <div className="flex gap-2">
              {LANGUAGE_OPTIONS.map((lang) => (
                <button
                  key={lang.value}
                  onClick={() => handleLanguageChange(lang.value)}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                    language === lang.value
                      ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg'
                      : 'border border-white/20 text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 ml-auto">
            <button
              onClick={handleCompile}
              disabled={isCompiling}
              className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-bold text-white hover:bg-white/10 disabled:opacity-50"
            >
              {isCompiling ? '...' : '▶️ ' + t('codeEditor.compileRun')}
            </button>
            <button
              onClick={handleRunTests}
              disabled={isRunningTests}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-bold text-white shadow-lg hover:from-violet-600 hover:to-fuchsia-600 disabled:opacity-50"
            >
              {isRunningTests ? '...' : '🚀 ' + t('codeEditor.submitRunTests')}
            </button>
          </div>
        </div>

        {/* Code Editor */}
        <div className="relative">
          {isCompiling && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-2xl">
              <div className="text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-violet-400 border-t-transparent" />
                <p className="mt-2 text-sm text-white/70">{t('codeEditor.compiling')}</p>
              </div>
            </div>
          )}
          <Editor
            height="400px"
            language={language === 'cpp' ? 'cpp' : language.toLowerCase()}
            value={code}
            theme="vs-dark"
            onChange={(value) => {
              const newCode = value ?? '';
              setCode(newCode);
              persistCode(newCode, language);
            }}
            onMount={() => { editorMounted.current = true; }}
            loading={
              <div className="flex h-full items-center justify-center text-white/50">
                {t('codeEditor.loadingEditor')}
              </div>
            }
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
            className="rounded-2xl overflow-hidden border-2 border-white/20"
          />
        </div>

        {/* Custom input */}
        <div>
          <details className="group">
            <summary className="cursor-pointer text-sm font-semibold text-white/70 hover:text-white">
              ⚙️ {t('codeEditor.customInput')}
            </summary>
            <textarea
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder={t('codeEditor.customInputPlaceholder')}
              className="mt-2 min-h-[80px] w-full rounded-xl border-2 border-white/20 bg-gray-900/60 p-4 text-sm font-mono text-white placeholder-white/30 outline-none focus:border-violet-400"
            />
          </details>
        </div>

        {/* Compile output / error */}
        {(compileOutput !== null || compileError) && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-lg">
            <h3 className="mb-2 text-sm font-bold text-white">
              {compileError ? '❌ ' + t('codeEditor.compilationError') : '✅ ' + t('codeEditor.output')}
            </h3>
            <pre className="max-h-60 overflow-auto rounded-xl bg-black/30 p-4 text-sm text-white/80 font-mono whitespace-pre-wrap">
              {compileError || compileOutput}
            </pre>
          </div>
        )}

        {/* Test Results */}
        {testResults && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-lg">
            <h3 className="mb-4 text-lg font-bold text-white">📊 {t('codeEditor.testResults')}</h3>
            {testResults.test_case_results && (
              <div className="mb-4 space-y-2">
                {testResults.test_case_results.map((tcRes) => (
                  <div
                    key={tcRes.test_case_id}
                    className={`rounded-xl border p-3 ${
                      tcRes.passed ? 'border-emerald-400/30 bg-emerald-400/10' : 'border-red-400/30 bg-red-400/10'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{tcRes.passed ? '✅' : '❌'}</span>
                      <span className="text-sm font-semibold text-white">
                        {t('codeEditor.testCase')} {tcRes.test_case_id}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-white/50">{t('codeEditor.input')}:</p>
                        <pre className="text-white/80 whitespace-pre-wrap">{tcRes.input || '—'}</pre>
                      </div>
                      <div>
                        <p className="text-white/50">{t('codeEditor.expected')}:</p>
                        <pre className="text-white/80 whitespace-pre-wrap">{tcRes.expected || '—'}</pre>
                      </div>
                      <div>
                        <p className="text-white/50">{t('codeEditor.yourOutput')}:</p>
                        <pre className="text-white/80 whitespace-pre-wrap">{tcRes.output || '—'}</pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-xl bg-white/5 p-4 text-center">
                <p className="text-xs text-white/50">{t('codeEditor.passed')}</p>
                <p className="text-2xl font-bold text-emerald-300">{testResults.passed_cases}</p>
              </div>
              <div className="rounded-xl bg-white/5 p-4 text-center">
                <p className="text-xs text-white/50">{t('codeEditor.total')}</p>
                <p className="text-2xl font-bold text-white">{testResults.total_cases}</p>
              </div>
              <div className="rounded-xl bg-white/5 p-4 text-center">
                <p className="text-xs text-white/50">{t('codeEditor.score')}</p>
                <p className="text-2xl font-bold text-cyan-300">{testResults.marks}%</p>
              </div>
              <div className="rounded-xl bg-white/5 p-4 text-center">
                <p className="text-xs text-white/50">{t('codeEditor.status')}</p>
                <span
                  className={`inline-block mt-1 rounded-full px-3 py-1 text-xs font-bold ${
                    testResults.status === 'completed'
                      ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                      : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                  }`}
                >
                  {testResults.status === 'completed'
                    ? t('codeEditor.completed')
                    : t('codeEditor.inProgress')}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Pagination row */}
        <div className="flex justify-center gap-2 flex-wrap pt-6">
          {allQuestions.map((q, idx) => {
            const status = questionStatuses[q.id] || 'not_attempted';
            const isCurrent = q.id === questionId;
            return (
              <button
                key={q.id}
                onClick={() => goToQuestion(q.id)}
                disabled={isCurrent}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition border-2 ${
                  isCurrent ? 'border-white' : 'border-transparent'
                } ${
                  status === 'passed'
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : status === 'failed'
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-orange-500 text-white hover:bg-orange-600'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Fixed submit bar */}
      <div className="relative z-10 px-4 sm:px-6 py-4 bg-black/40 backdrop-blur-md border-t border-white/10">
        <button
          onClick={handleSubmitAttempt}
          className="w-full max-w-md mx-auto block rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 py-3 text-base font-bold text-white shadow-lg hover:from-fuchsia-700 hover:to-pink-700 transition"
        >
          {t('codeEditor.submitAssessment', 'Submit Assessment')}
        </button>
      </div>
    </div>
  );
}