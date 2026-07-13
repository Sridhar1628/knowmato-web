'use client';

import React, { useState } from 'react';
import CodeEditor from '@uiw/react-textarea-code-editor';
import { toast } from 'sonner';
import { apiPost } from '@/services/apiService';

const CodeCompiler: React.FC = () => {
  // ✅ Correct language identifiers as per backend
  const [language, setLanguage] = useState<'python' | 'Java' | 'C' | 'cpp'>('python');
  const [sourceCode, setSourceCode] = useState(`# Write your code here\nprint("Hello, World!")`);
  const [stdin, setStdin] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const languageOptions = [
    { value: 'python', label: 'Python' },
    { value: 'Java', label: 'Java' },   // 👈 capital 'J'
    { value: 'C', label: 'C' },         // 👈 capital 'C'
    { value: 'cpp', label: 'C++' },     // 👈 lowercase 'cpp'
  ];

  const getDefaultCode = (lang: string) => {
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
      default: // python
        return `# Write your code here\nprint("Hello, World!")`;
    }
  };

  const handleLanguageChange = (newLang: typeof language) => {
    setLanguage(newLang);
    setSourceCode(getDefaultCode(newLang));
  };

  const handleRun = async () => {
    setIsRunning(true);
    setOutput('');

    const payload = {
      language,
      source_code: sourceCode,
      stdin: stdin || '',
    };

    try {
      const response = await apiPost('/assessment/compile/', payload);
      
      // Handle both dict and JsonResponse structures
      if (response.error) {
        throw new Error(response.error);
      }
      setOutput(response.output || response.stdout || 'No output');
    } catch (error: any) {
      let errorMessage = 'Compilation failed';
      if (error.response) {
        const data = error.response.data;
        errorMessage = data?.error || data?.message || data?.detail || JSON.stringify(data);
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
      setOutput(`❌ Error: ${errorMessage}`);
    } finally {
      setIsRunning(false);
    }
  };

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
            onChange={(e) => handleLanguageChange(e.target.value as typeof language)}
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

      {/* Java hint */}
      {language === 'Java' && (
        <div className="rounded-xl border border-yellow-400/30 bg-yellow-400/10 p-3 text-sm text-yellow-200/80">
          ⚠️ <strong>Java requirement:</strong> Your code must have a <code className="bg-white/20 px-1 rounded">public class Main</code> with <code className="bg-white/20 px-1 rounded">public static void main(String[] args)</code>.
        </div>
      )}

      {/* Code Editor */}
      <div>
        <label className="block text-sm font-semibold text-white/80 mb-1">Source Code</label>
        <div className="rounded-xl border-2 border-white/20 overflow-hidden bg-gray-900/60 backdrop-blur-sm">
          <CodeEditor
            value={sourceCode}
            language={language === 'Java' ? 'java' : language === 'cpp' ? 'cpp' : language === 'C' ? 'c' : 'python'}
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

      {/* Standard Input */}
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

      {/* Output */}
      <div>
        <label className="block text-sm font-semibold text-white/80 mb-1">Output</label>
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
            output || 'Run your code to see output here.'
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeCompiler;