'use client';

import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import CodeCompiler from '@/components/CodeCompiler';
import {
  getCodeSnippets,
  createCodeSnippet,
  updateCodeSnippet,
  deleteCodeSnippet,
  type CodeSnippet,
} from '@/services/v2Service';

export default function TestsPage() {
  const { t } = useTranslation();
  const [snippets, setSnippets] = useState<CodeSnippet[]>([]);
  const [selectedSnippet, setSelectedSnippet] = useState<CodeSnippet | null>(null);
  const [loadingSnippets, setLoadingSnippets] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch snippets on mount
  const fetchSnippets = async () => {
    setLoadingSnippets(true);
    try {
      const snippetList = await getCodeSnippets();
      setSnippets(snippetList);
    } catch (error: any) {
      toast.error('Failed to load snippets');
    } finally {
      setLoadingSnippets(false);
    }
  };

  useEffect(() => {
    fetchSnippets();
  }, []);

  // Load a snippet into the editor
  const handleLoadSnippet = (snippet: CodeSnippet) => {
    setSelectedSnippet(snippet);
  };

  // Start a new blank snippet
  const handleNewSnippet = () => {
    setSelectedSnippet(null);
  };

  // Save (create or update) when user clicks Save in compiler
  const handleSave = async (code: string, language: string) => {
    const title = window.prompt('Enter a title for this snippet:');
    if (!title) return;

    setSaving(true);
    try {
      if (selectedSnippet?.id) {
        // Update existing snippet
        const updatedSnippet = await updateCodeSnippet(selectedSnippet.id, {
          title,
          language,
          source_code: code,
        });
        if (updatedSnippet) {
          toast.success('Snippet updated');
          setSelectedSnippet(updatedSnippet);
          fetchSnippets();
        } else {
          toast.error('Update failed');
        }
      } else {
        // Create new snippet
        const newSnippet = await createCodeSnippet({
          title,
          language,
          source_code: code,
        });
        if (newSnippet) {
          toast.success('Snippet saved');
          setSelectedSnippet(newSnippet);
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

  // Delete the currently selected snippet
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

  // Code changed in editor (we don't need to save it here, just track)
  const handleCodeChange = (code: string) => {
    // Nothing needed, just for sync if required
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] p-4 sm:p-6 text-white">
      <div className="mx-auto max-w-7xl flex flex-col lg:flex-row gap-6">
        {/* Sidebar: Saved Snippets */}
        <div className="w-full lg:w-80 shrink-0">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 shadow-lg">
            <h2 className="text-lg font-bold mb-4">
              {t('knowmatoPlus.tests')} – Snippets
            </h2>
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
                      <div className="font-semibold text-white truncate">
                        {snip.title}
                      </div>
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
            {/* Delete button for loaded snippet */}
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
              initialCode={selectedSnippet?.source_code || ''}
              initialLanguage={(selectedSnippet?.language as any) || 'python'}
              onSave={handleSave}
              onCodeChange={handleCodeChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}