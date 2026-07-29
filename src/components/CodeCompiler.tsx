// components/CodeCompiler.tsx

'use client';
import React, { useState, useRef, useEffect } from 'react';
import CodeEditor from '@uiw/react-textarea-code-editor';
import { toast } from 'sonner';
import { getTokens } from '@/services/storageService';
import {
  connectCompilerSocket,
  disconnectCompilerSocket,
  sendCompilerMessage,
} from '@/services/compilerSocketService';

type Language = 'python' | 'Java' | 'C' | 'cpp' | 'html';

interface CodeCompilerProps {
  questionId?: number;
  initialCode?: string;
  initialLanguage?: Language;
  onSave?: (code: string, language: Language) => void;
  onCodeChange?: (code: string) => void;
}

const CodeCompiler: React.FC<CodeCompilerProps> = ({
  questionId,
  initialCode = '',
  initialLanguage = 'python',
  onSave,
  onCodeChange,
}) => {
  // ---------- State ----------
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [sourceCode, setSourceCode] = useState(initialCode);
  const [terminalOutput, setTerminalOutput] = useState('');
  const [terminalInput, setTerminalInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState('');

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

    const initSocket = async () => {
      try {
        const tokens = await getTokens();
        if (!tokens?.access) {
          console.warn('❌ No access token, cannot connect compiler WS');
          return;
        }
        console.log('🔌 Connecting compiler WS with token');
        connectCompilerSocket(tokens.access, handleSocketEvent);
      } catch (err) {
        console.error('Failed to connect compiler WS:', err);
      }
    };

    initSocket();

    return () => {
      isMounted.current = false;
      disconnectCompilerSocket();
      console.log('🔌 Compiler WS disconnected on unmount');
    };
  }, []); // run once

  // ---------- WebSocket event handler ----------
  const handleSocketEvent = (event: string, data: any) => {
    console.log(`📩 Received event: ${event}`, data);

    if (!isMounted.current) return;

    switch (event) {
      case 'output':
        setTerminalOutput((prev) => prev + data.content);
        break;

      case 'error':
        console.error('❌ Error event:', data);
        toast.error(data.message || 'Compilation error');
        setTerminalOutput((prev) => prev + `\n❌ Error: ${data.message || 'Unknown error'}`);
        setIsRunning(false);
        break;

      case 'finished':
        setTerminalOutput((prev) => prev + `\n\n🏁 Process finished with exit code ${data.exit_code}`);
        setIsRunning(false);
        break;

      default:
        console.log('Unhandled event:', event, data);
    }
  };

  // ---------- Auto-scroll terminal ----------
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalOutput]);

  // ---------- Focus input when running ----------
  useEffect(() => {
    if (isRunning && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isRunning]);

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

  const handleLanguageChange = (newLang: Language) => {
    if (isRunning) return;
    setLanguage(newLang);
    if (!initialCode) {
      setSourceCode(getDefaultCode(newLang));
    }
    setTerminalOutput('');
    setConsoleLogs('');
  };

  // ---------- Run ----------
  const handleRun = async () => {
    if (language === 'html') {
      runHtml();
      return;
    }

    if (!questionId) {
      toast.error('No question ID provided. Cannot compile.');
      return;
    }

    console.log('▶️ Starting run...');
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

  // ---------- Terminal input submit ----------
  const handleTerminalSubmit = () => {
    if (!isRunning) return;
    const input = terminalInput.trim();
    if (input === '') return;

    // Echo input to terminal
    setTerminalOutput((prev) => prev + input + '\n');
    // Send via WebSocket
    sendCompilerMessage({
      type: 'input_response',
      payload: { input },
    });
    // Clear input field
    setTerminalInput('');
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

  // ---------- Save & Code change ----------
  const handleSaveClick = () => {
    if (onSave) onSave(sourceCode, language);
  };

  const handleCodeChange = (value: string) => {
    if (isRunning) return;
    setSourceCode(value);
    if (onCodeChange) onCodeChange(value);
  };

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

  // ---------- Render ----------
  const languageOptions = [
    { value: 'python', label: 'Python' },
    { value: 'Java', label: 'Java' },
    { value: 'C', label: 'C' },
    { value: 'cpp', label: 'C++' },
    { value: 'html', label: 'HTML / CSS / JS' },
  ] as const;

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

        <button
          onClick={handleRun}
          disabled={isRunning || (language !== 'html' && !questionId)}
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

        {onSave && (
          <button
            onClick={handleSaveClick}
            className="mt-4 sm:mt-0 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:scale-[1.02]"
          >
            💾 Save
          </button>
        )}
      </div>

      {/* Hints */}
      {language === 'Java' && (
        <div className="rounded-xl border border-yellow-400/30 bg-yellow-400/10 p-3 text-sm text-yellow-200/80">
          ⚠️ <strong>Java requirement:</strong> Your code must have a <code className="bg-white/20 px-1 rounded">public class Main</code> with <code className="bg-white/20 px-1 rounded">public static void main(String[] args)</code>.
        </div>
      )}
      {language === 'html' && (
        <div className="rounded-xl border border-blue-400/30 bg-blue-400/10 p-3 text-sm text-blue-200/80">
          🖥️ <strong>HTML preview:</strong> The page will be rendered in an iframe. Console logs are captured and shown below.
        </div>
      )}

      {/* Code Editor */}
      <div>
        <label className="block text-sm font-semibold text-white/80 mb-1">Source Code</label>
        <div className="rounded-xl border-2 border-white/20 overflow-hidden bg-gray-900/60 backdrop-blur-sm">
          <CodeEditor
            value={sourceCode}
            language={
              language === 'Java' ? 'java' :
              language === 'cpp' ? 'cpp' :
              language === 'C' ? 'c' :
              language === 'html' ? 'html' :
              'python'
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
              minHeight: '200px',
            }}
            className="w-full outline-none"
          />
        </div>
      </div>

      {/* Terminal Console */}
      <div>
        <label className="block text-sm font-semibold text-white/80 mb-1">
          {language === 'html' ? 'Console Output' : 'Terminal'}
        </label>
        <div
          ref={terminalRef}
          className="rounded-xl border-2 border-white/20 bg-gray-900/60 backdrop-blur-sm p-4 min-h-[100px] max-h-[250px] overflow-auto text-sm font-mono text-white/90"
        >
          {isRunning || terminalOutput ? (
            <>
              <pre className="whitespace-pre-wrap break-words">{terminalOutput}</pre>
              {/* Input line – only visible when running */}
              {isRunning && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-white/40">$</span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={terminalInput}
                    onChange={(e) => setTerminalInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleTerminalSubmit();
                      }
                    }}
                    className="flex-1 bg-transparent outline-none text-white/90 caret-white placeholder-white/30"
                    placeholder={isRunning ? "Type input and press Enter..." : ""}
                    autoFocus
                    disabled={!isRunning}
                  />
                </div>
              )}
            </>
          ) : (
            <span className="text-white/40">Run your code to see output here.</span>
          )}
        </div>
      </div>

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
        </div>
      )}
    </div>
  );
};

export default CodeCompiler;