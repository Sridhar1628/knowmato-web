// components/CodeCompiler.tsx
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import CodeEditor from '@uiw/react-textarea-code-editor';
import AlertService from '@/services/alertService';
import { getTokens } from '@/services/storageService';
import {
  connectCompilerSocket,
  sendCompilerMessage,
} from '@/services/compilerSocketService';

type Language = 'python' | 'Java' | 'C' | 'cpp' | 'html';

export interface CodeExecutionResult {
  output: string;
  status: 'success' | 'error' | 'stopped';
  exitCode?: number;
}

export interface CodeCompilerProps {
  questionId?: number;
  initialCode?: string;
  initialLanguage?: Language;

  onSave?: (code: string, language: Language) => void;
  onCodeChange?: (code: string) => void;

  hideRunButton?: boolean;
  hideOutput?: boolean;

  /**
   * Used by KnowMato Agent integration.
   * When provided, the final execution result is returned
   * to the parent after the program finishes.
   */
  onExecutionResult?: (result: CodeExecutionResult) => void;
}

const CodeCompiler: React.FC<CodeCompilerProps> = ({
  questionId,
  initialCode = '',
  initialLanguage = 'python',
  onSave,
  onCodeChange,
  hideRunButton = false,
  hideOutput = false,
  onExecutionResult,
}) => {
  // ---------- State ----------
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [sourceCode, setSourceCode] = useState(initialCode);
  const [terminalOutput, setTerminalOutput] = useState('');
  const [terminalInput, setTerminalInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState('');

  // Refs
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMounted = useRef(true);

  // ---------- Sync props ----------
  useEffect(() => {
    setLanguage(initialLanguage);
  }, [initialLanguage]);

  useEffect(() => {
    setSourceCode(initialCode);
  }, [initialCode]);

  // ---------- WebSocket lifecycle ----------
  useEffect(() => {
    isMounted.current = true;

    let unsubscribe: (() => void) | undefined;

    const initSocket = async () => {
      try {
        const tokens = await getTokens();

        if (!tokens?.access) {
          console.warn(
            '❌ No access token, cannot connect compiler WS'
          );

          return;
        }

        console.log(
          '🔌 Connecting/subscribing to Compiler WS'
        );

        unsubscribe = connectCompilerSocket(
          tokens.access,
          handleSocketEvent
        );
      } catch (err) {
        console.error(
          'Failed to connect compiler WS:',
          err
        );
      }
    };

    initSocket();

    return () => {
      isMounted.current = false;

      // IMPORTANT:
      // Only remove THIS component's listener.
      // Do NOT disconnect the shared socket.
      unsubscribe?.();

      console.log(
        '👂 CodeCompiler listener removed'
      );
    };
  }, []);

  // ---------- WebSocket event handler ----------
  const handleSocketEvent = useCallback(
    (event: string, data: any) => {
      console.log(`📩 Received event: ${event}`, data);

      if (!isMounted.current) return;

      switch (event) {
        case 'output': {
          setTerminalOutput((prev) => prev + (data.content ?? ''));
          break;
        }

        case 'error': {
          console.error('❌ Error event:', data);

          const errorMessage =
            data?.message || data?.error || 'Unknown compilation error';

          setTerminalOutput((prev) => {
            const finalOutput =
              prev + `\n❌ Error: ${errorMessage}`;

            onExecutionResult?.({
              output: finalOutput,
              status: 'error',
            });

            return finalOutput;
          });

          AlertService.error("Compilation Error", errorMessage);
          setIsRunning(false);
          setTerminalInput('');
          break;
        }

        case 'finished': {
          const exitCode =
            typeof data?.exit_code === 'number'
              ? data.exit_code
              : 0;

          setTerminalOutput((prev) => {
            const finalOutput =
              prev +
              `\n\n🏁 Process finished with exit code ${exitCode}`;

            onExecutionResult?.({
              output: finalOutput,
              status: exitCode === 0 ? 'success' : 'error',
              exitCode,
            });

            return finalOutput;
          });

          setIsRunning(false);
          setTerminalInput('');
          break;
        }

        default:
          console.log('Unhandled event:', event, data);
      }
    },
    [onExecutionResult]
  );

  // ---------- Auto-scroll terminal ----------
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalOutput]);

  // ---------- Focus input when running (only if applicable) ----------
  useEffect(() => {
    if (isRunning && language !== 'html' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isRunning, language]);

  // ---------- Ctrl+C to stop ----------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'c' && isRunning && language !== 'html') {
        e.preventDefault();
        handleStop();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, language]);

  // ---------- Console capture for HTML ----------
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'console' && event.data?.log) {
        setConsoleLogs((prev) => prev + event.data.log + '\n');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // ---------- Helpers ----------
  const getDefaultCode = (lang: Language): string => {
    switch (lang) {
      case 'Java':
        return `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, Java!");\n    }\n}`;
      case 'cpp':
        return `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, C++!" << endl;\n    return 0;\n}`;
      case 'C':
        return `#include <stdio.h>\n\nint main() {\n    printf("Hello, C!\\n");\n    return 0;\n}`;
      case 'html':
        return `<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    body { background: #1a1a2e; color: #eee; font-family: Arial; padding: 2rem; }\n    h1 { color: #e94560; }\n  </style>\n</head>\n<body>\n  <h1>Hello from HTML!</h1>\n  <p>This page has CSS and JavaScript.</p>\n  <script>\n    console.log('Page loaded');\n    console.log('2 + 3 =', 2 + 3);\n  </script>\n</body>\n</html>`;
      default:
        return `# Write your code here\nprint("Hello, World!")`;
    }
  };

  const getTerminalPlaceholder = (): string => {
    if (!isRunning) {
      return 'Run your code to see output here.';
    }
    if (language === 'html') {
      return '';
    }
    return 'Program is running...';
  };

  // ---------- Language change ----------
  const handleLanguageChange = (newLang: Language) => {
    if (isRunning) return;

    setLanguage(newLang);
    if (!initialCode) {
      setSourceCode(getDefaultCode(newLang));
    }
    setTerminalOutput('');
    setTerminalInput('');
    setConsoleLogs('');
  };

  // ---------- Run (interactive) ----------
  const handleRun = () => {
    if (isRunning) return;
    if (sourceCode.trim().length === 0) {
      AlertService.warning("Empty Code", "Please enter some source code before running.",[]);
      return;
    }

    if (language === 'html') {
      runHtml();
      return;
    }

    if (!questionId) {
      AlertService.error("Compiler Error", "No question ID was provided. Cannot compile this code.");
      return;
    }

    console.log('▶️ Starting interactive run...');
    setIsRunning(true);
    setTerminalOutput('');
    setTerminalInput('');

    sendCompilerMessage({
      type: 'compile',
      payload: {
        question_id: questionId,
        language: language,
        source_code: sourceCode,
      },
    });
  };

  // ---------- Stop execution ----------
  const handleStop = () => {
    if (!isRunning) return;
    console.log('⏹️ Stopping execution...');
    sendCompilerMessage({ type: 'stop' });
    setIsRunning(false);
    setTerminalInput('');
    setTerminalOutput((prev) => prev + '\n⏹️ Stopped by user');
  };

  // ---------- Terminal input submit ----------
  const handleTerminalSubmit = () => {
    if (!isRunning) return;

    const input = terminalInput; // preserve raw input (may contain spaces, but no newlines)
    // Echo input to terminal with prompt
    setTerminalOutput((prev) => prev + `> ${input}\n`);

    // Send via WebSocket
    sendCompilerMessage({
      type: 'input_response',
      payload: { input },
    });

    // Clear input field
    setTerminalInput('');

    // Keep focus for next input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  // ---------- Terminal input change (sanitize newlines) ----------
  const handleTerminalInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isRunning) return;
    // Remove any newline characters to keep single-line input
    const cleanText = e.target.value.replace(/\r?\n/g, '');
    setTerminalInput(cleanText);
  };

  // ---------- HTML runner ----------
  const runHtml = () => {
    if (iframeRef.current) {
      const htmlWithCapture = sourceCode.replace(
        '</body>',
        `<script>
          (function() {
            const originalLog = console.log;
            console.log = function(...args) {
              const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
              window.parent.postMessage({ type: 'console', log: message }, '*');
              originalLog.apply(console, args);
            };
            window.onerror = function(msg) {
              window.parent.postMessage({ type: 'console', log: 'Error: ' + msg }, '*');
            };
          })();
        </script></body>`
      );
      iframeRef.current.srcdoc = htmlWithCapture;
      setConsoleLogs('');
      setTerminalOutput('HTML preview updated. Console logs will appear below.');
    }
  };

  // ---------- Save & code change ----------
  const handleSaveClick = () => {
    if (onSave && sourceCode.trim().length > 0) {
      onSave(sourceCode, language);
    }
  };

  const handleCodeChange = (value: string) => {
    if (isRunning) return;
    setSourceCode(value);
    if (onCodeChange) onCodeChange(value);
  };

  // ---------- Render ----------
  const languageOptions = [
    { value: 'python', label: 'Python' },
    { value: 'Java', label: 'Java' },
    { value: 'C', label: 'C' },
    { value: 'cpp', label: 'C++' },
    { value: 'html', label: 'HTML / CSS / JS' },
  ] as const;

  const isSourceEmpty = sourceCode.trim().length === 0;

  return (
    <div className="space-y-6">
      {/* Language & buttons */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="language" className="block text-sm font-semibold text-white/80 mb-1">
            Language
          </label>
          <select
            id="language"
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value as Language)}
            disabled={isRunning}
            className="w-full rounded-xl border-2 border-white/20 bg-gray-900/60 backdrop-blur-sm px-4 py-2.5 text-sm text-white font-medium outline-none transition-all focus:border-violet-400 focus:ring-4 focus:ring-violet-500/50 disabled:opacity-60"
          >
            {languageOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {!hideRunButton && (
          <button
            onClick={handleRun}
            disabled={isRunning || isSourceEmpty || (language !== 'html' && !questionId)}
            className="mt-4 sm:mt-0 rounded-xl bg-gradient-to-r from-green-400 to-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
          >
            {isRunning ? (
              <span className="flex items-center gap-2">
                <svg className="h-5 w-5 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Running...
              </span>
            ) : (
              '▶ Run'
            )}
          </button>
        )}

        {isRunning && (
          <button
            onClick={handleStop}
            className="mt-4 sm:mt-0 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:scale-[1.02]"
          >
            ⏹ Stop
          </button>
        )}

        {onSave && (
          <button
            onClick={handleSaveClick}
            disabled={isRunning || isSourceEmpty}
            className="mt-4 sm:mt-0 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:scale-[1.02] disabled:opacity-50"
          >
            💾 Save
          </button>
        )}
      </div>

      {/* Hints */}
      {language === 'Java' && (
        <div className="rounded-xl border border-yellow-400/30 bg-yellow-400/10 p-3 text-sm text-yellow-200/80">
          ⚠️ <strong>Java requirement:</strong> Your code must have a{' '}
          <code className="bg-white/20 px-1 rounded">public class Main</code> with{' '}
          <code className="bg-white/20 px-1 rounded">public static void main(String[] args)</code>.
        </div>
      )}
      {language === 'html' && (
        <div className="rounded-xl border border-blue-400/30 bg-blue-400/10 p-3 text-sm text-blue-200/80">
          🖥️ <strong>HTML preview:</strong> The page will be rendered in an iframe. Console logs are captured and shown below.
        </div>
      )}

      {/* Code Editor - Now with fixed height and scrolling */}
      <div>
        <label className="block text-sm font-semibold text-white/80 mb-1">Source Code</label>
        <div className="rounded-xl border-2 border-white/20 overflow-hidden bg-gray-900/60 backdrop-blur-sm h-[420px]">
          <CodeEditor
            value={sourceCode}
            language={
              language === 'Java'
                ? 'java'
                : language === 'cpp'
                  ? 'cpp'
                  : language === 'C'
                    ? 'c'
                    : language === 'html'
                      ? 'html'
                      : 'python'
            }
            placeholder="Write your code here"
            onChange={(e) => handleCodeChange(e.target.value)}
            padding={16}
            disabled={isRunning}
            style={{
              fontSize: 14,
              fontFamily: 'Fira Code, monospace',
              backgroundColor: 'transparent',
              color: '#e2e8f0',
              minHeight: '100%',
              width: '100%',
              overflow: 'auto',
              lineHeight: 1.6,
            }}
            className="w-full h-full outline-none"
          />
        </div>
      </div>

      {/* Terminal Console - Now with fixed height and scrolling */}
      {!hideOutput && (
        <div>
          {/* Terminal Header */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center">
              <span className="w-2 h-2 rounded-full bg-green-400 mr-2"></span>
              <span className="text-sm font-semibold text-white/80">
                {language === 'html' ? 'Console Output' : 'Terminal'}
              </span>
            </div>
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${isRunning ? 'bg-green-400/20 text-green-300' : 'bg-white/10 text-gray-400'}`}>
              {isRunning ? '● Running' : '● Ready'}
            </span>
          </div>

          <div
            ref={terminalRef}
            tabIndex={0}
            className="rounded-xl border-2 border-white/20 bg-gray-900/60 backdrop-blur-sm p-4 h-[220px] overflow-y-auto text-sm font-mono text-white/90 focus:outline-none"
          >
            {isRunning && language !== 'html' ? (
              <>
                {terminalOutput && (
                  <pre className="whitespace-pre-wrap break-words">{terminalOutput}</pre>
                )}

                <div className="flex items-center mt-1">
                  <span className="text-green-400 mr-1">❯</span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={terminalInput}
                    onChange={handleTerminalInputChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleTerminalSubmit();
                      }
                    }}
                    className="flex-1 bg-transparent outline-none text-white caret-white placeholder-white/30"
                    placeholder="Type input..."
                    autoFocus
                  />
                  <span className="ml-1 animate-pulse text-white/80">▌</span>
                </div>
              </>
            ) : terminalOutput ? (
              <pre className="whitespace-pre-wrap break-words">{terminalOutput}</pre>
            ) : (
              <span className="text-white/40">{getTerminalPlaceholder()}</span>
            )}
          </div>

          {isRunning && language !== 'html' && (
            <p className="text-xs text-white/30 mt-1">
              Press Enter to send input • Ctrl+C to stop
            </p>
          )}
        </div>
      )}

      {/* HTML Preview */}
      {language === 'html' && (
        <div>
          <label className="block text-sm font-semibold text-white/80 mb-1">Preview</label>
          <div className="rounded-xl border-2 border-white/20 bg-white/5 backdrop-blur-sm p-2">
            <iframe
              ref={iframeRef}
              sandbox="allow-scripts allow-modals"
              className="w-full h-96 rounded-lg bg-white"
              title="HTML Preview"
              srcDoc={sourceCode}
            />
          </div>
          {consoleLogs && (
            <div className="mt-2">
              <label className="block text-sm font-semibold text-white/80 mb-1">Console Logs</label>
              <pre className="rounded-xl border-2 border-white/20 bg-gray-900/60 p-3 text-sm font-mono text-white/90 max-h-40 overflow-auto whitespace-pre-wrap">
                {consoleLogs}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CodeCompiler;