"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import CodeCompiler from "@/components/CodeCompiler";

import {
  getCodeSnippets,
  createCodeSnippet,
  updateCodeSnippet,
  deleteCodeSnippet,
  type CodeSnippet,
} from "@/services/v2Service";

import {
  getAgentCompilerPayload,
  clearAgentCompilerPayload,
  saveAgentCompilerResult,
  type AgentCompilerPayload,
} from "@/services/agentCompilerBridge";

import AlertService from "@/services/alertService";

// ============================================================
// Normalize common API response shapes into CodeSnippet[]
// ============================================================

function normalizeSnippetList(payload: unknown): CodeSnippet[] {
  if (Array.isArray(payload)) {
    return payload as CodeSnippet[];
  }

  const data = payload as any;

  if (Array.isArray(data?.data)) {
    return data.data as CodeSnippet[];
  }

  if (Array.isArray(data?.results)) {
    return data.results as CodeSnippet[];
  }

  if (Array.isArray(data?.data?.results)) {
    return data.data.results as CodeSnippet[];
  }

  if (Array.isArray(data?.items)) {
    return data.items as CodeSnippet[];
  }

  console.warn(
    "Unexpected code snippets response shape:",
    payload,
  );

  return [];
}

// ============================================================
// Tests Page
// ============================================================

export default function TestsPage() {
  const { t } = useTranslation();

  // ==========================================================
  // State
  // ==========================================================

  const [snippets, setSnippets] = useState<CodeSnippet[]>([]);
  const [selectedSnippet, setSelectedSnippet] =
    useState<CodeSnippet | null>(null);

  const [loadingSnippets, setLoadingSnippets] =
    useState(false);

  const [saving, setSaving] = useState(false);

  const [agentPayload, setAgentPayload] =
    useState<AgentCompilerPayload | null>(null);

  const [compilerKey, setCompilerKey] = useState(0);

  // ==========================================================
  // Fetch Snippets
  // ==========================================================

  const fetchSnippets = async () => {
    setLoadingSnippets(true);

    try {
      const response = await getCodeSnippets();

      const normalized = normalizeSnippetList(response);

      setSnippets(normalized);
    } catch (error: any) {
      console.error(
        "Failed to load code snippets:",
        error,
      );

      const errorMessage =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to load snippets.";

      setSnippets([]);

      AlertService.error(
        "Unable to Load Snippets",
        errorMessage,
      );
    } finally {
      setLoadingSnippets(false);
    }
  };

  // ==========================================================
  // Receive Agent Compiler Payload
  // ==========================================================

  useEffect(() => {
    const payload = getAgentCompilerPayload();

    if (!payload) {
      return;
    }

    console.log(
      "🤖 Agent compiler payload received:",
      payload,
    );

    setAgentPayload(payload);

    // Agent code takes priority over saved snippets.
    setSelectedSnippet(null);

    // Force CodeCompiler to mount with Agent code.
    setCompilerKey((previous) => previous + 1);

    // Payload has now been consumed.
    clearAgentCompilerPayload();
  }, []);

  // ==========================================================
  // Initial Snippet Load
  // ==========================================================

  useEffect(() => {
    fetchSnippets();
  }, []);

  // ==========================================================
  // Load Existing Snippet
  // ==========================================================

  const handleLoadSnippet = (
    snippet: CodeSnippet,
  ) => {
    // Once the user manually selects a saved snippet,
    // it should become the active compiler content.
    setAgentPayload(null);
    setSelectedSnippet(snippet);
  };

  // ==========================================================
  // Create New Snippet
  // ==========================================================

  const handleNewSnippet = () => {
    setAgentPayload(null);
    setSelectedSnippet(null);

    // Force a fresh compiler instance.
    setCompilerKey((previous) => previous + 1);
  };

  // ==========================================================
  // Save / Update Snippet
  // ==========================================================

  const handleSave = async (
    code: string,
    language: string,
  ) => {
    const title = window.prompt(
      "Enter a title for this snippet:",
    );

    if (title === null) {
      return;
    }

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      AlertService.warning(
        "Title Required",
        "Please enter a title for this snippet.",
        [],
      );

      return;
    }

    setSaving(true);

    try {
      // ======================================================
      // UPDATE EXISTING SNIPPET
      // ======================================================

      if (selectedSnippet?.id) {
        const updated =
          await updateCodeSnippet(
            selectedSnippet.id,
            {
              title: trimmedTitle,
              language,
              source_code: code,
            },
          );

        if (updated) {
          AlertService.success(
            "Snippet Updated",
            "Your code snippet was updated successfully.",
          );

          setSelectedSnippet(updated);

          await fetchSnippets();
        } else {
          AlertService.error(
            "Update Failed",
            "Unable to update the code snippet.",
          );
        }

        return;
      }

      // ======================================================
      // CREATE NEW SNIPPET
      // ======================================================

      const created =
        await createCodeSnippet({
          title: trimmedTitle,
          language,
          source_code: code,
        });

      if (created) {
        AlertService.success(
          "Snippet Saved",
          "Your code snippet was saved successfully.",
        );

        setSelectedSnippet(created);
        setAgentPayload(null);

        await fetchSnippets();
      } else {
        AlertService.error(
          "Save Failed",
          "Unable to save the code snippet.",
        );
      }
    } catch (error: any) {
      console.error(
        "Save snippet error:",
        error,
      );

      const errorMessage =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Unable to save the code snippet.";

      AlertService.error(
        "Save Failed",
        errorMessage,
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================================
  // Delete Snippet
  // ==========================================================

  const handleDelete = () => {
    if (!selectedSnippet?.id) {
      return;
    }

    AlertService.confirm(
      "Delete Snippet",
      "Are you sure you want to delete this snippet? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCodeSnippet(
                selectedSnippet.id,
              );

              AlertService.success(
                "Snippet Deleted",
                "The code snippet was deleted successfully.",
              );

              setSelectedSnippet(null);
              setAgentPayload(null);

              setCompilerKey(
                (previous) => previous + 1,
              );

              await fetchSnippets();
            } catch (error: any) {
              console.error(
                "Delete snippet error:",
                error,
              );

              const errorMessage =
                error?.response?.data?.detail ||
                error?.response?.data?.message ||
                error?.response?.data?.error ||
                error?.message ||
                "Unable to delete the code snippet.";

              AlertService.error(
                "Delete Failed",
                errorMessage,
              );
            }
          },
        },
      ],
    );
  };

  // ==========================================================
  // Code Change
  // ==========================================================

  const handleCodeChange = (
    code: string,
  ) => {
    // Intentionally kept for compiler synchronization.
  };

  // ==========================================================
  // Render
  // ==========================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] p-4 text-white sm:p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row">
        {/* ==================================================
            SIDEBAR — SAVED SNIPPETS
        =================================================== */}

        <div className="w-full shrink-0 lg:w-80">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur-xl">
            <h2 className="mb-4 text-lg font-bold">
              {t("knowmatoPlus.tests")} – Snippets
            </h2>

            {/* New Snippet */}

            <button
              type="button"
              onClick={handleNewSnippet}
              disabled={saving}
              className="mb-4 w-full rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-2 text-sm font-bold text-white shadow-md transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
            >
              + New Snippet
            </button>

            {/* Loading */}

            {loadingSnippets ? (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-400 border-t-transparent" />
              </div>
            ) : snippets.length === 0 ? (
              <p className="text-sm text-white/50">
                No saved snippets yet.
              </p>
            ) : (
              <ul className="max-h-96 space-y-2 overflow-y-auto pr-1">
                {snippets.map((snip) => (
                  <li key={snip.id}>
                    <button
                      type="button"
                      onClick={() =>
                        handleLoadSnippet(snip)
                      }
                      className={`w-full rounded-xl border p-3 text-left text-sm transition-all ${
                        selectedSnippet?.id ===
                        snip.id
                          ? "border-violet-400 bg-violet-400/10"
                          : "border-white/10 hover:bg-white/5"
                      }`}
                    >
                      <div className="truncate font-semibold text-white">
                        {snip.title}
                      </div>

                      <div className="mt-1 text-xs text-white/50">
                        {snip.language} ·{" "}
                        {new Date(
                          snip.updated_at,
                        ).toLocaleDateString()}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* ==================================================
            MAIN COMPILER AREA
        =================================================== */}

        <div className="min-w-0 flex-1">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg backdrop-blur-xl">
            {/* Delete button */}

            {selectedSnippet?.id && (
              <div className="mb-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="text-xs text-red-400 transition hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  🗑 Delete Snippet
                </button>
              </div>
            )}

            {/* Code Compiler */}

            <CodeCompiler
              key={
                agentPayload
                  ? `agent-${agentPayload.executionId}-${compilerKey}`
                  : selectedSnippet?.id ??
                    `new-snippet-${compilerKey}`
              }
              questionId={1}
              initialCode={
                agentPayload?.code ||
                selectedSnippet?.source_code ||
                ""
              }
              initialLanguage={
                (agentPayload?.language ||
                  selectedSnippet?.language ||
                  "python") as any
              }
              onSave={handleSave}
              onCodeChange={handleCodeChange}
              onExecutionResult={
                agentPayload
                  ? (result) => {
                      saveAgentCompilerResult({
                        executionId:
                          agentPayload.executionId,
                        output: result.output,
                        status: result.status,
                        exitCode:
                          result.exitCode,
                        completedAt:
                          Date.now(),
                      });

                      console.log(
                        "✅ Agent execution result saved:",
                        agentPayload.executionId,
                      );
                    }
                  : undefined
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}