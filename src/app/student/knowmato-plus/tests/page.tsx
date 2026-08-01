// app/tests/page.tsx (or wherever TestsPage is located)
'use client';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import CodeCompiler, { TestRunResult } from '@/components/CodeCompiler';
import {
  getCodeSnippets,
  createCodeSnippet,
  updateCodeSnippet,
  deleteCodeSnippet,
  type CodeSnippet,
} from '@/services/v2Service';
import { getTokens } from '@/services/storageService';

export default function TestsPage() {
  const { t } = useTranslation();
  const [snippets, setSnippets] = useState<CodeSnippet[]>([]);
  const [selectedSnippet, setSelectedSnippet] = useState<CodeSnippet | null>(null);
  const [loadingSnippets, setLoadingSnippets] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchSnippets = async () => {
    setLoadingSnippets(true);
    try {
      const response = await getCodeSnippets();
      let snippetList: CodeSnippet[] = [];
      if (Array.isArray(response)) {
        snippetList = response;
      } else if (response && typeof response === 'object' && Array.isArray(response.data)) {
        snippetList = response.data;
      }
      setSnippets(snippetList);
    } catch (error: any) {
      toast.error('Failed to load snippets');
      setSnippets([]);
    } finally {
      setLoadingSnippets(false);
    }
  };

  useEffect(() => {
    fetchSnippets();
  }, []);

  const handleLoadSnippet = (snippet: CodeSnippet) => {
    setSelectedSnippet(snippet);
  };

  const handleNewSnippet = () => {
    setSelectedSnippet(null);
  };

  const handleSave = async (code: string, language: string) => {
    const title = window.prompt('Enter a title for this snippet:');
    if (!title) return;

    setSaving(true);
    try {
      if (selectedSnippet?.id) {
        const updated = await updateCodeSnippet(selectedSnippet.id, { title, language, source_code: code });
        if (updated) {
          toast.success('Snippet updated');
          setSelectedSnippet(updated);
          fetchSnippets();
        } else {
          toast.error('Update failed');
        }
      } else {
        const created = await createCodeSnippet({ title, language, source_code: code });
        if (created) {
          toast.success('Snippet saved');
          setSelectedSnippet(created);
          fetchSnippets();
        } else {
          toast.error('Save failed');
        }
      }
    } catch (error: any) {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSnippet?.id) return;
    if (!confirm('Delete this snippet?')) return;
    try {
      await deleteCodeSnippet(selectedSnippet.id);
      toast.success('Snippet deleted');
      setSelectedSnippet(null);
      fetchSnippets();
    } catch (error: any) {
      toast.error('Delete failed');
    }
  };

  const handleCodeChange = (code: string) => {
    // Nothing needed, just for sync if required
  };

  // ---------- Run Tests against the question (example) ----------
  const runTestsForSnippet = async (language: string, code: string): Promise<TestRunResult> => {
    // Assume we have a question ID from the snippet or a fixed one for testing.
    // Here we use a dummy question ID = 1 (adjust as needed).
    const questionId = 1; // Replace with actual question ID

    const tokens = await getTokens();
    if (!tokens?.access) {
      throw new Error('No access token');
    }

    const response = await fetch('/api/assessment/run-test-cases/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.access}`,
      },
      body: JSON.stringify({
        question_id: questionId,
        language: language,
        source_code: code,
        input_data: '',  // can be left empty, backend will use test case inputs
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Test execution failed');
    }

    const resultData = await response.json();
    // The API response is wrapped in ApiResponse; extract data
    return resultData.data as TestRunResult;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] p-4 sm:p-6 text-white">
      <div className="mx-auto max-w-7xl flex flex-col lg:flex-row gap-6">
        {/* Sidebar: Saved Snippets */}
        <div className="w-full lg:w-80 shrink-0">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 shadow-lg">
            <h2 className="text-lg font-bold mb-4">{t('knowmatoPlus.tests')} – Snippets</h2>
            <button
              onClick={handleNewSnippet}
              disabled={saving}
              className="w-full mb-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2 text-sm font-bold text-white shadow-md hover:scale-[1.01] transition disabled:opacity-50"
            >
              + New Snippet
            </button>

            {loadingSnippets ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-400 border-t-transparent" />
              </div>
            ) : snippets.length === 0 ? (
              <p className="text-white/50 text-sm">No saved snippets yet.</p>
            ) : (
              <ul className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {snippets.map((snip) => (
                  <li key={snip.id}>
                    <button
                      onClick={() => handleLoadSnippet(snip)}
                      className={`w-full text-left p-3 rounded-xl border transition-all text-sm ${
                        selectedSnippet?.id === snip.id
                          ? 'border-violet-400 bg-violet-400/10'
                          : 'border-white/10 hover:bg-white/5'
                      }`}
                    >
                      <div className="font-semibold text-white truncate">{snip.title}</div>
                      <div className="text-xs text-white/50 mt-1">
                        {snip.language} · {new Date(snip.updated_at).toLocaleDateString()}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Main Compiler Area */}
        <div className="flex-1 min-w-0">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 shadow-lg">
            {selectedSnippet?.id && (
              <div className="flex justify-end mb-2">
                <button
                  onClick={handleDelete}
                  className="text-xs text-red-400 hover:text-red-300 transition"
                >
                  🗑 Delete Snippet
                </button>
              </div>
            )}
            <CodeCompiler
              questionId={1} // ← Replace with actual question ID as needed
              initialCode={selectedSnippet?.source_code || ''}
              initialLanguage={(selectedSnippet?.language as any) || 'python'}
              onSave={handleSave}
              onCodeChange={handleCodeChange}
              onRunTests={runTestsForSnippet}  // <-- NEW
            />
          </div>
        </div>
      </div>
    </div>
  );
}