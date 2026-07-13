'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Editor from '@monaco-editor/react';

import {
  getQuestionById,
  Question,
  compileCode,
  runTestCases,
  CompileResponse,
  RunTestResponse,
  getTestCases,
  TestCaseResponse,
  getAssignmentDetails,
  AssignmentDetails,
  getAssignments,
  Assignment,
} from '@/services/assessmentService';

// ---------- Supported languages ----------
const LANGUAGE_OPTIONS = [
  { label: 'C', value: 'C' },
  { label: 'C++', value: 'cpp' },
  { label: 'Java', value: 'Java' },
  { label: 'Python', value: 'python' },
] as const;

type Language = (typeof LANGUAGE_OPTIONS)[number]['value'];

// ---------- Starter code templates ----------
const STARTER_CODES: Record<Language, string> = {
  C: `#include <stdio.h>

int main() {
    // Your code here
    return 0;
}`,
  cpp: `#include <iostream>
using namespace std;

int main() {
    // Your code here
    return 0;
}`,
  Java: `public class Main {
    public static void main(String[] args) {
        // Your code here
    }
}`,
  python: `def solve():
    # Your code here
    pass

solve()`,
};

// ---------- LocalStorage helpers ----------
const storageKey = (questionId: number, language: string) =>
  `code_${questionId}_${language}`;

export default function ProgrammingQuestionPage() {
  const router = useRouter();
  const params = useParams();
  const assignmentId = Number(params.id);
  const questionId = Number(params.questionId);

  // ─── Core data ────────────────────────────────────────
  const [question, setQuestion] = useState<Question | null>(null);
  const [testCases, setTestCases] = useState<TestCaseResponse | null>(null);
  const [assignmentDetails, setAssignmentDetails] = useState<AssignmentDetails | null>(null);
  const [assignmentMeta, setAssignmentMeta] = useState<Assignment | null>(null); // for expiry timer

  // ─── Loading states ───────────────────────────────────
  const [loadingQuestion, setLoadingQuestion] = useState(true);
  const [loadingTestCases, setLoadingTestCases] = useState(true);
  const [loadingAssignment, setLoadingAssignment] = useState(true);

  // ─── Code editor ──────────────────────────────────────
  const [language, setLanguage] = useState<Language>('python');
  const [code, setCode] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [editorMounted, setEditorMounted] = useState(false);

  // ─── Compile / Run results ────────────────────────────
  const [compileOutput, setCompileOutput] = useState<string | null>(null);
  const [compileError, setCompileError] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [testResults, setTestResults] = useState<RunTestResponse | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);

  // ─── Timer ────────────────────────────────────────────
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);

  // ─── Progress & navigation ────────────────────────────
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const totalQuestions = assignmentDetails?.questions.length ?? 0;

  // ──────────────────────────────────────────────────────
  // Fetch everything needed
  // ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!questionId || !assignmentId) return;

    const loadData = async () => {
      try {
        // Question + test cases + assignment details + metadata
        const [qRes, tcRes, assignRes, allAssignments] = await Promise.all([
          getQuestionById(questionId),
          getTestCases(questionId),
          getAssignmentDetails(assignmentId),
          getAssignments(),
        ]);

        setQuestion(qRes);
        setTestCases(tcRes);

        // Assignment details (questions + mcqs) – needed for progress & next
        setAssignmentDetails(assignRes);
        const idx = assignRes.questions.findIndex((q) => q.id === questionId);
        setCurrentQuestionIndex(idx >= 0 ? idx : 0);

        // Find the assignment metadata for expiry timer
        const meta = allAssignments.find((a) => a.id === assignmentId);
        setAssignmentMeta(meta || null);

        // Load saved code from localStorage (respects questionId + language)
        const savedCode = localStorage.getItem(storageKey(questionId, language));
        if (savedCode) {
          setCode(savedCode);
        } else {
          setCode(STARTER_CODES[language]);
        }
      } catch (error) {
        toast.error('Failed to load question data.');
        router.push(`/student/knowmato-plus/assignments/${assignmentId}`);
      } finally {
        setLoadingQuestion(false);
        setLoadingTestCases(false);
        setLoadingAssignment(false);
      }
    };

    loadData();
  }, [questionId, assignmentId]);

  // ──────────────────────────────────────────────────────
  // Timer logic (if assignment has expiry)
  // ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!assignmentMeta || !assignmentMeta.date_of_expiry) return;

    const calcRemaining = () => {
      const expiryDate = new Date(assignmentMeta.date_of_expiry);
      if (assignmentMeta.time) {
        const [h, m] = assignmentMeta.time.split(':');
        expiryDate.setHours(Number(h), Number(m), 0, 0);
      }
      const now = new Date();
      const diff = expiryDate.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeRemaining('Expired');
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeRemaining(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    };

    calcRemaining();
    const timer = setInterval(calcRemaining, 1000);
    return () => clearInterval(timer);
  }, [assignmentMeta]);

  // ──────────────────────────────────────────────────────
  // Persist code to localStorage (debounced)
  // ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!editorMounted) return;
    const timeout = setTimeout(() => {
      localStorage.setItem(storageKey(questionId, language), code);
    }, 500);
    return () => clearTimeout(timeout);
  }, [code, language, questionId, editorMounted]);

  // ──────────────────────────────────────────────────────
  // Handle language change -> starter code if empty
  // ──────────────────────────────────────────────────────
  const handleLanguageChange = (newLang: Language) => {
    if (newLang === language) return;

    // If current code is the same as the starter for the current language (or empty), replace with new starter
    const currentStarter = STARTER_CODES[language];
    const newStarter = STARTER_CODES[newLang];
    if (code.trim() === '' || code === currentStarter) {
      setCode(newStarter);
    }

    setLanguage(newLang);
  };

  // ──────────────────────────────────────────────────────
  // Compile & Run (single input)
  // ──────────────────────────────────────────────────────
  const handleCompile = async () => {
    if (!code.trim()) {
      toast.error('Please write some code first.');
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
      if (result.error) {
        setCompileError(result.error);
      } else {
        setCompileOutput(result.output || 'No output');
      }
    } catch (err: any) {
      setCompileError(err.message || 'Compilation failed.');
    } finally {
      setIsCompiling(false);
    }
  };

  // ──────────────────────────────────────────────────────
  // Submit & Run all test cases
  // ──────────────────────────────────────────────────────
  const handleRunTests = async () => {
    if (!code.trim()) {
      toast.error('Please write some code first.');
      return;
    }
    setIsRunningTests(true);
    setTestResults(null);
    try {
      const result: RunTestResponse = await runTestCases({
        language,
        question_id: questionId,
        source_code: code,
        input_data: customInput || undefined,
      });
      setTestResults(result);
      toast.success(`Tests completed: ${result.passed_cases}/${result.total_cases}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to run tests.');
    } finally {
      setIsRunningTests(false);
    }
  };

  // ──────────────────────────────────────────────────────
  // Next question navigation
  // ──────────────────────────────────────────────────────
  const goToNextQuestion = () => {
    if (!assignmentDetails) return;
    const nextIdx = currentQuestionIndex + 1;
    if (nextIdx < assignmentDetails.questions.length) {
      const nextId = assignmentDetails.questions[nextIdx].id;
      router.push(`/student/knowmato-plus/assignments/${assignmentId}/question/${nextId}`);
    } else {
      router.push(`/student/knowmato-plus/assignments/${assignmentId}`);
    }
  };

  // ──────────────────────────────────────────────────────
  // Loading skeleton
  // ──────────────────────────────────────────────────────
  if (loadingQuestion || loadingTestCases || loadingAssignment) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-violet-400 border-t-transparent" />
          <p className="mt-2 text-sm text-white/70">Loading workspace…</p>
        </div>
      </div>
    );
  }

  if (!question) return null; // already redirected

  const sampleTestCases = testCases?.test_cases ?? [];

  // ──────────────────────────────────────────────────────
  // Main render
  // ──────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e]">
      {/* Background blobs */}
      <div className="absolute -left-20 top-0 h-72 w-72 animate-blob rounded-full bg-purple-500/20 blur-3xl filter mix-blend-multiply" />
      <div className="animation-delay-2000 absolute -right-20 top-0 h-72 w-72 animate-blob rounded-full bg-fuchsia-500/20 blur-3xl filter mix-blend-multiply" />
      <div className="animation-delay-4000 absolute -bottom-20 left-40 h-72 w-72 animate-blob rounded-full bg-cyan-500/20 blur-3xl filter mix-blend-multiply" />

      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        {/* Top bar: progress & timer */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          {/* Back + progress */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/student/knowmato-plus/assignments/${assignmentId}`)}
              className="text-sm font-semibold text-violet-300 hover:text-violet-200 transition-colors"
            >
              ← Back
            </button>
            {totalQuestions > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white/70">
                  Question {currentQuestionIndex + 1} / {totalQuestions}
                </span>
                <div className="h-2 w-28 rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all"
                    style={{
                      width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
          {/* Timer */}
          {timeRemaining && (
            <div
              className={`rounded-full px-4 py-1 text-xs font-bold ${
                timeRemaining === 'Expired'
                  ? 'bg-red-400/20 text-red-300 border border-red-400/30'
                  : 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
              }`}
            >
              {timeRemaining === 'Expired' ? '⏰ Time expired' : `⏳ ${timeRemaining} remaining`}
            </div>
          )}
        </div>

        {/* Question statement */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-lg">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-full bg-violet-400/20 px-3 py-1 text-[10px] font-bold uppercase text-violet-300 border border-violet-400/30">
              {question.level}
            </span>
            <span className="text-xs text-white/50">Question #{question.id}</span>
          </div>
          <h1 className="text-xl font-bold text-white">{question.question}</h1>
          {question.description && (
            <p className="mt-3 text-sm leading-relaxed text-white/70 whitespace-pre-wrap">
              {question.description}
            </p>
          )}
        </div>

        {/* Test Cases (sample) */}
        {(testCases?.test_cases?.length ?? 0) > 0 && (
          <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-lg">
            <h3 className="mb-3 text-sm font-bold text-white/80">📋 Sample Test Cases</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {testCases?.test_cases?.map((tc) => (
                <div
                  key={tc.id}
                  className="rounded-xl border border-white/10 bg-black/20 p-3"
                >
                  <p className="text-xs text-violet-300 mb-1">Input:</p>
                  <pre className="text-xs text-white/80 whitespace-pre-wrap">{tc.input_data || '—'}</pre>
                  <p className="text-xs text-emerald-300 mt-2 mb-1">Expected Output:</p>
                  <pre className="text-xs text-white/80 whitespace-pre-wrap">{tc.expected_output || '—'}</pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Language selector */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-white/70">Language:</span>
          <div className="flex gap-2">
            {LANGUAGE_OPTIONS.map((lang) => (
              <button
                key={lang.value}
                onClick={() => handleLanguageChange(lang.value)}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
                  language === lang.value
                    ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25'
                    : 'border border-white/20 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Monaco Editor with loading overlay */}
        <div className="relative mb-4">
          {isCompiling && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-2xl">
              <div className="text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-violet-400 border-t-transparent" />
                <p className="mt-2 text-sm text-white/70">Compiling…</p>
              </div>
            </div>
          )}
          <Editor
            height="400px"
            language={language === 'cpp' ? 'cpp' : language.toLowerCase()}
            value={code}
            theme="vs-dark"
            onChange={(value) => setCode(value ?? '')}
            onMount={() => setEditorMounted(true)}
            loading={
              <div className="flex h-full items-center justify-center text-white/50">
                Loading editor…
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

        {/* Custom input (collapsible) */}
        <div className="mb-6">
          <details className="group">
            <summary className="cursor-pointer text-sm font-semibold text-white/70 hover:text-white">
              ⚙️ Custom Input (stdin)
            </summary>
            <textarea
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Enter custom input for testing…"
              className="mt-2 min-h-[80px] w-full rounded-xl border-2 border-white/20 bg-gray-900/60 p-4 text-sm font-mono text-white placeholder-white/30 outline-none focus:border-violet-400"
            />
          </details>
        </div>

        {/* Action buttons */}
        <div className="mb-8 flex flex-wrap gap-3">
          <button
            onClick={handleCompile}
            disabled={isCompiling}
            className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/10 hover:border-violet-400/40 disabled:opacity-50"
          >
            {isCompiling ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Compiling…
              </>
            ) : (
              '▶️ Compile & Run'
            )}
          </button>

          <button
            onClick={handleRunTests}
            disabled={isRunningTests}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/25 transition-all hover:from-violet-600 hover:to-fuchsia-600 disabled:opacity-50"
          >
            {isRunningTests ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Running Tests…
              </>
            ) : (
              '🚀 Submit & Run Tests'
            )}
          </button>
        </div>

        {/* Compilation output / error */}
        {(compileOutput !== null || compileError) && (
          <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-lg">
            <h3 className="mb-2 text-sm font-bold text-white">
              {compileError ? '❌ Compilation Error' : '✅ Output'}
            </h3>
            <pre className="max-h-60 overflow-auto rounded-xl bg-black/30 p-4 text-sm text-white/80 font-mono whitespace-pre-wrap">
              {compileError || compileOutput}
            </pre>
          </div>
        )}

        {/* Detailed Test Results */}
        {testResults && (
          <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-lg">
            <h3 className="mb-4 text-lg font-bold text-white">📊 Test Results</h3>

            {/* Individual test case results (if backend provides them) */}
            {testResults.test_case_results ? (
              <div className="mb-4 space-y-2">
                {testResults.test_case_results.map((tcRes) => (
                  <div
                    key={tcRes.test_case_id}
                    className={`rounded-xl border p-3 ${
                      tcRes.passed
                        ? 'border-emerald-400/30 bg-emerald-400/10'
                        : 'border-red-400/30 bg-red-400/10'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{tcRes.passed ? '✅' : '❌'}</span>
                      <span className="text-sm font-semibold text-white">
                        Test Case {tcRes.test_case_id}
                      </span>
                      <span className="text-xs text-white/50">
                        ({tcRes.passed ? 'Passed' : 'Wrong Answer'})
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-white/50">Input:</p>
                        <pre className="text-white/80 whitespace-pre-wrap">{tcRes.input || '—'}</pre>
                      </div>
                      <div>
                        <p className="text-white/50">Expected:</p>
                        <pre className="text-white/80 whitespace-pre-wrap">{tcRes.expected || '—'}</pre>
                      </div>
                      <div>
                        <p className="text-white/50">Your Output:</p>
                        <pre className="text-white/80 whitespace-pre-wrap">{tcRes.output || '—'}</pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Aggregate summary */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-xl bg-white/5 p-4 text-center">
                <p className="text-xs text-white/50">Passed</p>
                <p className="text-2xl font-bold text-emerald-300">{testResults.passed_cases}</p>
              </div>
              <div className="rounded-xl bg-white/5 p-4 text-center">
                <p className="text-xs text-white/50">Total</p>
                <p className="text-2xl font-bold text-white">{testResults.total_cases}</p>
              </div>
              <div className="rounded-xl bg-white/5 p-4 text-center">
                <p className="text-xs text-white/50">Score</p>
                <p className="text-2xl font-bold text-cyan-300">{testResults.marks}%</p>
              </div>
              <div className="rounded-xl bg-white/5 p-4 text-center">
                <p className="text-xs text-white/50">Status</p>
                <span
                  className={`inline-block mt-1 rounded-full px-3 py-1 text-xs font-bold ${
                    testResults.status === 'completed'
                      ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                      : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                  }`}
                >
                  {testResults.status}
                </span>
              </div>
            </div>

            {/* Next question button */}
            {testResults.status === 'completed' && currentQuestionIndex < totalQuestions - 1 && (
              <div className="mt-6 text-center">
                <button
                  onClick={goToNextQuestion}
                  className="rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/25 hover:from-violet-600 hover:to-fuchsia-600 transition-all"
                >
                  Next Question →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}