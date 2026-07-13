'use client';

import React, { useState, useRef, useEffect } from 'react';
import CodeEditor from '@uiw/react-textarea-code-editor';
import { toast } from 'sonner';
import { apiPost } from '@/services/apiService';

// Extend language list to include 'html'
type Language = 'python' | 'Java' | 'C' | 'cpp' | 'html';

const CodeCompiler: React.FC = () => {
  const [language, setLanguage] = useState<Language>('python');
  const [sourceCode, setSourceCode] = useState(`# Write your code here\nprint("Hello, World!")`);
  const [stdin, setStdin] = useState('');
  const [output, setOutput] = useState('');          // for text output / console logs
  const [isRunning, setIsRunning] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState(''); // separate for HTML

  // Reference to the iframe for preview
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const languageOptions: { value: Language; label: string }[] = [
    { value: 'python', label: 'Python' },
    { value: 'Java', label: 'Java' },
    { value: 'C', label: 'C' },
    { value: 'cpp', label: 'C++' },
    { value: 'html', label: 'HTML / CSS / JS' },
  ];

  const getDefaultCode = (lang: Language): string => {
    switch (lang) {
      case 'Java':
        return `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, Java!");
    }
}`;
      case 'cpp':
        return `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, C++!" << endl;\n    return 0;\n}`;
      case 'C':
        return `#include <stdio.h>\n\nint main() {\n    printf("Hello, C!\\n");\n    return 0;\n}`;
      case 'html':
        return `<!DOCTYPE html>
<html>
<head>
  <style>
    body { background: #1a1a2e; color: #eee; font-family: Arial; padding: 2rem; }
    h1 { color: #e94560; }
  </style>
</head>
<body>
  <h1>Hello from HTML!</h1>
  <p>This page has CSS and JavaScript.</p>
  <script>
    console.log('Page loaded');
    console.log('2 + 3 =', 2 + 3);
  </script>
</body>
</html>`;
      default: // python
        return `# Write your code here\nprint("Hello, World!")`;
    }
  };

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    setSourceCode(getDefaultCode(newLang));
    // Reset output when switching
    setOutput('');
    setConsoleLogs('');
  };

  const handleRun = async () => {
    setIsRunning(true);
    setOutput('');
    setConsoleLogs('');

    // If language is HTML, render preview immediately
    if (language === 'html') {
      if (iframeRef.current) {
        iframeRef.current.srcdoc = sourceCode;
      }
    }

    // Build payload (stdin is ignored for HTML)
    const payload = {
      language,
      source_code: sourceCode,
      stdin: language === 'html' ? '' : stdin,
    };

    try {
      const response = await apiPost('/assessment/compile/', payload);

      if (response.error) {
        throw new Error(response.error);
      }

      const backendOutput = response.output || response.stdout || '';

      if (language === 'html') {
        // For HTML, show console logs in a separate area
        setConsoleLogs(backendOutput || 'No console output');
        // Optionally, also show it in the main output
        setOutput(''); // we’ll show preview and logs separately
      } else {
        setOutput(backendOutput);
      }
    } catch (error: any) {
      let errorMessage = 'Compilation failed';
      if (error.response) {
        const data = error.response.data;
        errorMessage = data?.error || data?.message || data?.detail || JSON.stringify(data);
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
      if (language === 'html') {
        setConsoleLogs(`❌ Error: ${errorMessage}`);
      } else {
        setOutput(`❌ Error: ${errorMessage}`);
      }
    } finally {
      setIsRunning(false);
    }
  };

  // Automatically set iframe src when HTML code changes (optional – we only update on Run)
  // But we can also use useEffect to update preview on every code change (debounced).
  // We'll keep it manual via Run button.

  return (
    <div className="space-y-6">
      {/* Language selector & Run button */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="language" className="block text-sm font-semibold text-white/80 mb-1">
            Language
          </label>
          <select
            id="language"
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value as Language)}
            className="w-full rounded-xl border-2 border-white/20 bg-gray-900/60 backdrop-blur-sm px-4 py-2.5 text-sm text-white font-medium outline-none transition-all focus:border-violet-400 focus:ring-4 focus:ring-violet-500/50"
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
          disabled={isRunning}
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
      </div>

      {/* Language-specific hints */}
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
            language={language === 'Java' ? 'java' : language === 'cpp' ? 'cpp' : language === 'C' ? 'c' : language === 'html' ? 'html' : 'python'}
            placeholder="Write your code here"
            onChange={(e) => setSourceCode(e.target.value)}
            padding={16}
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

      {/* Standard Input (hidden for HTML) */}
      {language !== 'html' && (
        <div>
          <label htmlFor="stdin" className="block text-sm font-semibold text-white/80 mb-1">
            Standard Input (stdin)
          </label>
          <textarea
            id="stdin"
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            placeholder="Enter input for your program (e.g., 4 5)"
            rows={2}
            className="w-full rounded-xl border-2 border-white/20 bg-gray-900/60 backdrop-blur-sm px-4 py-3 text-sm text-white placeholder-white/40 outline-none transition-all focus:border-violet-400 focus:ring-4 focus:ring-violet-500/50"
          />
        </div>
      )}

      {/* Output Area */}
      <div>
        <label className="block text-sm font-semibold text-white/80 mb-1">
          {language === 'html' ? 'Console Output' : 'Output'}
        </label>
        <div className="rounded-xl border-2 border-white/20 bg-gray-900/60 backdrop-blur-sm p-4 min-h-[100px] max-h-[250px] overflow-auto text-sm font-mono text-white/90 whitespace-pre-wrap">
          {isRunning ? (
            <div className="flex items-center gap-3 text-white/60">
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Executing...
            </div>
          ) : (
            language === 'html' ? (consoleLogs || 'Run to see console output.') : (output || 'Run your code to see output here.')
          )}
        </div>
      </div>

      {/* HTML Preview (only when language is HTML) */}
      {language === 'html' && (
        <div>
          <label className="block text-sm font-semibold text-white/80 mb-1">Preview</label>
          <div className="rounded-xl border-2 border-white/20 bg-white/5 backdrop-blur-sm p-2">
            <iframe
              ref={iframeRef}
              sandbox="allow-scripts allow-modals"
              className="w-full h-96 rounded-lg bg-white"
              title="HTML Preview"
              srcDoc={sourceCode} // initial code
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeCompiler;