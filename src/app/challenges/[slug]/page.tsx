"use client";
import React, { useEffect, useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import dynamic from "next/dynamic";
import type { editor } from "monaco-editor";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

interface TestCase {
  input: string;
  output: string;
}

interface Challenge {
  title: string;
  description: string;
  difficulty: string;
  supportedLanguages: { name: string; id: number; monaco: string }[];
  starterCode: { language: string; code: string }[];
  testCases: TestCase[];
  slug: string;
  creatorId: string;
}

interface TestCaseResult {
  testCase: number;
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
}

type SubmissionResponse = {
  ok: boolean;
  accepted?: boolean;
  error?: string;
  stdout?: string;
  stderr?: string;
  compile_output?: string;
  testCaseResults?: TestCaseResult[];
  totalPassed?: number;
  totalTests?: number;
  submission?: {
    status?: string;
    executionTime?: number;
    memory?: number;
    consecutiveFailures?: number;
  };
  status?: {
    id: number;
    description: string;
  };
};

type Theme = "dark" | "light";

export default function ChallengePage({
  params,
}: {
  params: { slug: string };
}) {
  const slug = params.slug;
  const { user } = useUser();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [code, setCode] = useState("// write your code");
  const [language, setLanguage] = useState("javascript");
  const [codeByLanguage, setCodeByLanguage] = useState<Record<string, string>>({});
  const [result, setResult] = useState<SubmissionResponse | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [activeTab, setActiveTab] = useState<"testcase" | "result">("testcase");
  const [selectedTestCase, setSelectedTestCase] = useState(0);
  const [theme, setTheme] = useState<Theme>("dark");
  const [leftPanelWidth, setLeftPanelWidth] = useState(45);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  // Load theme from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("lc-theme") as Theme;
    if (saved) setTheme(saved);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("lc-theme", newTheme);
  };

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/challenges?slug=${slug}`);
      const j = await res.json();
      if (j.challenge) {
        setChallenge(j.challenge);
        // Initialize code for all supported languages
        const initialCodes: Record<string, string> = {};
        j.challenge.starterCode?.forEach((s: { language: string; code: string }) => {
          initialCodes[s.language] = s.code;
        });
        setCodeByLanguage(initialCodes);
        
        if (j.challenge.supportedLanguages?.length) {
          const defaultLang = j.challenge.supportedLanguages[0].name;
          setLanguage(defaultLang);
          if (initialCodes[defaultLang]) {
            setCode(initialCodes[defaultLang]);
          }
        }
      }
    }
    load();
  }, [slug]);

  // Save code when it changes
  useEffect(() => {
    if (language && code) {
      setCodeByLanguage(prev => ({ ...prev, [language]: code }));
    }
  }, [code]);

  // Handle language switch - restore saved code or use starter
  const handleLanguageChange = (newLang: string) => {
    // Save current code before switching
    setCodeByLanguage(prev => ({ ...prev, [language]: code }));
    
    // Switch language
    setLanguage(newLang);
    
    // Restore saved code or use starter code
    if (codeByLanguage[newLang]) {
      setCode(codeByLanguage[newLang]);
    } else {
      const starter = challenge?.starterCode?.find(s => s.language === newLang);
      if (starter) setCode(starter.code);
    }
  };

  // Reset code to starter template
  const handleReset = () => {
    if (!confirm('Reset to default code template? Your changes will be lost.')) return;
    const starter = challenge?.starterCode?.find(s => s.language === language);
    if (starter) {
      setCode(starter.code);
      setCodeByLanguage(prev => ({ ...prev, [language]: starter.code }));
    }
  };

  // Format code using Monaco's built-in formatter
  const handleFormat = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run();
    }
  };

  // Run code without saving submission
  async function handleRun() {
    if (!user) {
      alert("Please sign in");
      return;
    }
    setIsRunning(true);
    setLoading(true);
    setResult(null);
    setActiveTab("result");

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          challengeSlug: slug,
          code,
          language,
          mode: "run", // Just run, don't save
        }),
      });
      const parsed = await res.json();
      setResult(parsed);
      setHasRun(true); // Enable submit button after running
    } catch (error) {
      setResult({ ok: false, error: "Run failed" });
    } finally {
      setIsRunning(false);
      setLoading(false);
    }
  }

  // Submit code and save the result
  async function handleSubmit() {
    if (!user) {
      alert("Please sign in");
      return;
    }
    if (!hasRun) {
      alert("Please run your code at least once before submitting");
      return;
    }
    setIsSubmitting(true);
    setLoading(true);
    setResult(null);
    setActiveTab("result");

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          challengeSlug: slug,
          code,
          language,
          mode: "submit", // Save the submission
        }),
      });
      const parsed = await res.json();
      setResult(parsed);

      // Show hint if failed multiple times
      if (
        parsed.ok &&
        !parsed.accepted &&
        parsed.submission?.consecutiveFailures >= 2
      ) {
        const hintRes = await fetch("/api/hints", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, challengeSlug: slug }),
        });
        const hintJson = await hintRes.json();
        if (hintJson.ok) setHint(hintJson.hint);
      }
    } catch (error) {
      setResult({ ok: false, error: "Submission failed" });
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  }

  const monacoLanguage =
    challenge?.supportedLanguages?.find((l) => l.name === language)?.monaco ||
    "javascript";

  const isDark = theme === "dark";
  const bg = isDark ? "bg-[#1a1a1a]" : "bg-white";
  const bg2 = isDark ? "bg-[#282828]" : "bg-gray-50";
  const bg3 = isDark ? "bg-[#333]" : "bg-gray-100";
  const border = isDark ? "border-[#333]" : "border-gray-200";
  const text = isDark ? "text-gray-200" : "text-gray-800";
  const textMuted = isDark ? "text-gray-400" : "text-gray-500";
  const textMuted2 = isDark ? "text-gray-500" : "text-gray-400";

  return (
    <div className={`h-screen flex flex-col ${bg} ${text}`}>
      {/* Top Bar */}
      <div
        className={`h-12 flex items-center justify-between px-4 ${bg2} ${border} border-b`}
      >
        <div className="flex items-center gap-4">
          <a
            href="/challenges"
            className={`${textMuted} hover:text-white transition`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </a>
          <span className="text-sm font-medium">Problem List</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Run Button */}
          <button
            onClick={handleRun}
            disabled={isRunning || isSubmitting}
            className={`flex items-center gap-2 px-4 py-1.5 rounded ${
              isDark
                ? "bg-[#333] hover:bg-[#404040]"
                : "bg-gray-200 hover:bg-gray-300"
            } transition text-sm disabled:opacity-50`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            {isRunning ? "Running..." : "Run"}
          </button>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isRunning || isSubmitting || !hasRun}
            className={`flex items-center gap-2 px-4 py-1.5 rounded text-white transition text-sm font-medium ${
              hasRun 
                ? "bg-[#2cbb5d] hover:bg-[#26a34d]" 
                : "bg-[#2cbb5d]/50 cursor-not-allowed"
            } disabled:opacity-50`}
            title={!hasRun ? "Run your code first before submitting" : "Submit your solution"}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>

          {/* My Submissions */}
          <a
            href={`/challenges/${slug}/submissions`}
            className={`flex items-center gap-2 px-3 py-1.5 rounded ${bg3} hover:opacity-80 transition text-sm`}
            title="My Submissions"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Submissions
          </a>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded ${bg3} hover:opacity-80 transition`}
            title="Toggle theme"
          >
            {isDark ? (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Main Content - Split Panes */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Problem Description */}
        <div
          className={`${bg2} ${border} border-r overflow-auto`}
          style={{ width: `${leftPanelWidth}%` }}
        >
          <div className="p-6">
            {/* Title & Difficulty */}
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-xl font-semibold">
                {challenge?.title || "Loading..."}
              </h1>
              {challenge && (
                <span
                  className={`px-2.5 py-0.5 rounded text-xs font-medium ${
                    challenge.difficulty === "Easy"
                      ? "bg-[#2cbb5d]/20 text-[#2cbb5d]"
                      : challenge.difficulty === "Medium"
                      ? "bg-[#ffc01e]/20 text-[#ffc01e]"
                      : "bg-[#ff375f]/20 text-[#ff375f]"
                  }`}
                >
                  {challenge.difficulty}
                </span>
              )}
            </div>

            {/* Tags */}
            <div className="flex items-center gap-2 mb-6">
              <button
                className={`px-3 py-1 rounded-full text-xs ${bg3} ${textMuted} hover:text-white transition`}
              >
                📌 Topics
              </button>
              <button
                className={`px-3 py-1 rounded-full text-xs ${bg3} ${textMuted} hover:text-white transition`}
              >
                🏢 Companies
              </button>
              <button
                className={`px-3 py-1 rounded-full text-xs ${bg3} ${textMuted} hover:text-white transition`}
              >
                💡 Hint
              </button>
            </div>

            {/* Description */}
            <div className="prose prose-invert max-w-none">
              <div
                className={`whitespace-pre-wrap text-sm leading-relaxed ${text}`}
              >
                {challenge?.description}
              </div>

              {/* Example Test Cases */}
              {challenge?.testCases && challenge.testCases.length > 0 && (
                <div className="mt-6 space-y-4">
                  {challenge.testCases.map((tc, idx) => (
                    <div key={idx}>
                      <p className={`font-semibold text-sm mb-2 ${text}`}>
                        Example {idx + 1}:
                      </p>
                      <div
                        className={`${bg3} rounded-lg p-4 font-mono text-sm`}
                      >
                        <div className="mb-2">
                          <span className={textMuted}>Input: </span>
                          <span className={text}>{tc.input}</span>
                        </div>
                        <div>
                          <span className={textMuted}>Output: </span>
                          <span className={text}>{tc.output}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Hint */}
            {hint && (
              <div
                className={`mt-6 p-4 rounded-lg border ${
                  isDark
                    ? "bg-amber-900/20 border-amber-700"
                    : "bg-amber-50 border-amber-200"
                }`}
              >
                <p className="text-amber-500 font-medium text-sm mb-2">
                  💡 AI Hint
                </p>
                <p
                  className={`text-sm ${
                    isDark ? "text-amber-200" : "text-amber-800"
                  }`}
                >
                  {hint}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Resize Handle */}
        <div
          className={`w-1 ${
            isDark
              ? "bg-[#333] hover:bg-[#555]"
              : "bg-gray-300 hover:bg-gray-400"
          } cursor-col-resize transition`}
          onMouseDown={(e) => {
            const startX = e.clientX;
            const startWidth = leftPanelWidth;
            const onMouseMove = (e: MouseEvent) => {
              const delta = e.clientX - startX;
              const newWidth = Math.min(
                70,
                Math.max(25, startWidth + (delta / window.innerWidth) * 100)
              );
              setLeftPanelWidth(newWidth);
            };
            const onMouseUp = () => {
              document.removeEventListener("mousemove", onMouseMove);
              document.removeEventListener("mouseup", onMouseUp);
            };
            document.addEventListener("mousemove", onMouseMove);
            document.addEventListener("mouseup", onMouseUp);
          }}
        />

        {/* Right Panel - Code Editor & Test Cases */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Language Selector & Editor Actions */}
          <div
            className={`h-10 flex items-center justify-between px-4 ${bg2} ${border} border-b`}
          >
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className={`${bg3} ${text} text-sm px-3 py-1 rounded border-none outline-none cursor-pointer`}
            >
              {challenge?.supportedLanguages?.map((l) => (
                <option key={l.name} value={l.name}>
                  {l.name}
                </option>
              ))}
            </select>
            
            <div className="flex items-center gap-2">
              {/* Format Button */}
              <button
                onClick={handleFormat}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${textMuted} hover:${text} ${bg3} hover:opacity-80 transition`}
                title="Format Code (Alt+Shift+F)"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
                Format
              </button>
              
              {/* Reset Button */}
              <button
                onClick={handleReset}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${textMuted} hover:${text} ${bg3} hover:opacity-80 transition`}
                title="Reset to Default"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset
              </button>
              
              <span className={`text-xs ${textMuted2} ml-2`}>🔒 Auto</span>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1">
            <MonacoEditor
              height="100%"
              language={monacoLanguage}
              value={code}
              onChange={(val) => setCode(val || "")}
              theme={isDark ? "vs-dark" : "light"}
              onMount={(editor) => { editorRef.current = editor; }}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                padding: { top: 16 },
              }}
            />
          </div>

          {/* Bottom Panel - Testcase / Test Result */}
          <div className={`h-64 ${bg2} ${border} border-t flex flex-col`}>
            {/* Tabs */}
            <div
              className={`flex items-center gap-1 px-4 py-2 ${border} border-b`}
            >
              <button
                onClick={() => setActiveTab("testcase")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition ${
                  activeTab === "testcase"
                    ? `${bg3} ${text}`
                    : `${textMuted} hover:text-white`
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isDark ? "bg-green-500" : "bg-green-600"
                  }`}
                ></span>
                Testcase
              </button>
              <button
                onClick={() => setActiveTab("result")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition ${
                  activeTab === "result"
                    ? `${bg3} ${text}`
                    : `${textMuted} hover:text-white`
                }`}
              >
                <span className="text-xs">{">"}_</span>
                Test Result
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-auto p-4">
              {activeTab === "testcase" && challenge?.testCases && (
                <div>
                  {/* Test Case Tabs */}
                  <div className="flex items-center gap-2 mb-4">
                    {challenge.testCases.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedTestCase(idx)}
                        className={`px-3 py-1 rounded text-sm transition ${
                          selectedTestCase === idx
                            ? `${bg3} ${text}`
                            : `${textMuted} hover:text-white`
                        }`}
                      >
                        Case {idx + 1}
                      </button>
                    ))}
                    <button
                      className={`px-2 py-1 rounded ${textMuted} hover:text-white`}
                    >
                      +
                    </button>
                  </div>

                  {/* Selected Test Case Input */}
                  {challenge.testCases[selectedTestCase] && (
                    <div className="space-y-3">
                      <div>
                        <label className={`text-xs ${textMuted} block mb-1`}>
                          Input =
                        </label>
                        <div
                          className={`${bg3} rounded-lg p-3 font-mono text-sm ${text}`}
                        >
                          {challenge.testCases[selectedTestCase].input}
                        </div>
                      </div>
                      <div>
                        <label className={`text-xs ${textMuted} block mb-1`}>
                          Expected Output =
                        </label>
                        <div
                          className={`${bg3} rounded-lg p-3 font-mono text-sm ${text}`}
                        >
                          {challenge.testCases[selectedTestCase].output}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "result" && (
                <div>
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-t-transparent border-[#2cbb5d] rounded-full animate-spin"></div>
                        <span className={textMuted}>Running...</span>
                      </div>
                    </div>
                  ) : result ? (
                    <div>
                      {/* Status Header */}
                      <div
                        className={`text-lg font-semibold mb-4 ${
                          result.accepted ? "text-[#2cbb5d]" : "text-[#ff375f]"
                        }`}
                      >
                        {result.accepted ? "✓ Accepted" : "✗ Wrong Answer"}
                      </div>

                      {/* Stats */}
                      {result.submission?.executionTime && (
                        <div className="flex items-center gap-6 mb-4 text-sm">
                          <div>
                            <span className={textMuted}>Runtime: </span>
                            <span className="font-medium">
                              {(result.submission.executionTime * 1000).toFixed(
                                0
                              )}{" "}
                              ms
                            </span>
                          </div>
                          {result.submission?.memory && (
                            <div>
                              <span className={textMuted}>Memory: </span>
                              <span className="font-medium">
                                {(result.submission.memory / 1024).toFixed(1)}{" "}
                                MB
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Compile/Runtime Error */}
                      {result.compile_output && (
                        <div
                          className={`p-3 rounded-lg mb-4 ${
                            isDark ? "bg-red-900/20" : "bg-red-50"
                          } border border-red-500/30`}
                        >
                          <p className="text-red-400 text-xs uppercase mb-1">
                            Compile Error
                          </p>
                          <pre className="text-red-300 text-sm whitespace-pre-wrap">
                            {result.compile_output}
                          </pre>
                        </div>
                      )}

                      {result.stderr && (
                        <div
                          className={`p-3 rounded-lg mb-4 ${
                            isDark ? "bg-amber-900/20" : "bg-amber-50"
                          } border border-amber-500/30`}
                        >
                          <p className="text-amber-400 text-xs uppercase mb-1">
                            Runtime Error
                          </p>
                          <pre className="text-amber-300 text-sm whitespace-pre-wrap">
                            {result.stderr}
                          </pre>
                        </div>
                      )}

                      {/* Test Case Results */}
                      {result.testCaseResults &&
                        result.testCaseResults.length > 0 && (
                          <div className="space-y-3">
                            {/* Result Tabs */}
                            <div className="flex items-center gap-2 mb-3">
                              {result.testCaseResults.map((tc, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setSelectedTestCase(idx)}
                                  className={`px-3 py-1 rounded text-sm flex items-center gap-1.5 transition ${
                                    selectedTestCase === idx
                                      ? `${bg3} ${text}`
                                      : `${textMuted} hover:text-white`
                                  }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      tc.passed
                                        ? "bg-[#2cbb5d]"
                                        : "bg-[#ff375f]"
                                    }`}
                                  ></span>
                                  Case {idx + 1}
                                </button>
                              ))}
                            </div>

                            {/* Selected Result */}
                            {result.testCaseResults[selectedTestCase] && (
                              <div className="space-y-3">
                                <div>
                                  <label
                                    className={`text-xs ${textMuted} block mb-1`}
                                  >
                                    Input
                                  </label>
                                  <div
                                    className={`${bg3} rounded-lg p-3 font-mono text-sm ${text}`}
                                  >
                                    {
                                      result.testCaseResults[selectedTestCase]
                                        .input
                                    }
                                  </div>
                                </div>
                                <div>
                                  <label
                                    className={`text-xs ${textMuted} block mb-1`}
                                  >
                                    Output
                                  </label>
                                  <div
                                    className={`${bg3} rounded-lg p-3 font-mono text-sm ${
                                      result.testCaseResults[selectedTestCase]
                                        .passed
                                        ? "text-[#2cbb5d]"
                                        : "text-[#ff375f]"
                                    }`}
                                  >
                                    {result.testCaseResults[selectedTestCase]
                                      .actual || "(no output)"}
                                  </div>
                                </div>
                                <div>
                                  <label
                                    className={`text-xs ${textMuted} block mb-1`}
                                  >
                                    Expected
                                  </label>
                                  <div
                                    className={`${bg3} rounded-lg p-3 font-mono text-sm text-[#2cbb5d]`}
                                  >
                                    {
                                      result.testCaseResults[selectedTestCase]
                                        .expected
                                    }
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <span className={textMuted}>
                        You must run your code first
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
