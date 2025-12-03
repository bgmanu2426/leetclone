"use client"
import React, { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import dynamic from "next/dynamic"

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false })

interface TestCase {
  input: string
  output: string
}

interface Challenge {
  title: string
  description: string
  difficulty: string
  supportedLanguages: { name: string; id: number; monaco: string }[]
  starterCode: { language: string; code: string }[]
  testCases: TestCase[]
  slug: string
  creatorId: string
}

interface TestCaseResult {
  testCase: number
  input: string
  expected: string
  actual: string
  passed: boolean
}

type SubmissionResponse = {
  ok: boolean
  accepted?: boolean
  error?: string
  stdout?: string
  stderr?: string
  compile_output?: string
  testCaseResults?: TestCaseResult[]
  totalPassed?: number
  totalTests?: number
  submission?: {
    status?: string
    executionTime?: number
    memory?: number
    consecutiveFailures?: number
  }
  status?: {
    id: number
    description: string
  }
}

type Theme = 'dark' | 'light'

export default function ChallengePage({ params }: { params: { slug: string } }) {
  const slug = params.slug
  const { user } = useUser()
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [code, setCode] = useState("// write your code")
  const [language, setLanguage] = useState("javascript")
  const [result, setResult] = useState<SubmissionResponse | null>(null)
  const [hint, setHint] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'testcase' | 'result'>('testcase')
  const [selectedTestCase, setSelectedTestCase] = useState(0)
  const [theme, setTheme] = useState<Theme>('dark')
  const [leftPanelWidth, setLeftPanelWidth] = useState(45)

  // Load theme from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('lc-theme') as Theme
    if (saved) setTheme(saved)
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('lc-theme', newTheme)
  }

  async function handleDelete() {
    if (!user || !challenge) return
    if (!confirm('Are you sure you want to delete this challenge?')) return
    
    try {
      const res = await fetch(`/api/challenges?slug=${slug}&creatorId=${user.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.ok) {
        window.location.href = '/challenges'
      } else {
        alert(data.error || 'Failed to delete')
      }
    } catch (error) {
      alert('Failed to delete challenge')
    }
  }

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/challenges?slug=${slug}`)
      const j = await res.json()
      if (j.challenge) {
        setChallenge(j.challenge)
        if (j.challenge.supportedLanguages?.length) {
          const defaultLang = j.challenge.supportedLanguages[0].name
          setLanguage(defaultLang)
          const starter = j.challenge.starterCode?.find((s: any) => s.language === defaultLang)
          if (starter) setCode(starter.code)
        }
      }
    }
    load()
  }, [slug])

  useEffect(() => {
    if (challenge) {
      const starter = challenge.starterCode?.find((s) => s.language === language)
      if (starter) setCode(starter.code)
    }
  }, [language, challenge])

  async function handleRun() {
    if (!user) {
      alert("Please sign in")
      return
    }
    setLoading(true)
    setResult(null)
    setActiveTab('result')

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, challengeSlug: slug, code, language })
      })
      const parsed = await res.json()
      setResult(parsed)

      if (parsed.ok && !parsed.accepted && parsed.submission?.consecutiveFailures >= 2) {
        const hintRes = await fetch("/api/hints", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, challengeSlug: slug })
        })
        const hintJson = await hintRes.json()
        if (hintJson.ok) setHint(hintJson.hint)
      }
    } catch (error) {
      setResult({ ok: false, error: 'Submission failed' })
    } finally {
      setLoading(false)
    }
  }

  const monacoLanguage = challenge?.supportedLanguages?.find((l) => l.name === language)?.monaco || "javascript"
  
  const isDark = theme === 'dark'
  const bg = isDark ? 'bg-[#1a1a1a]' : 'bg-white'
  const bg2 = isDark ? 'bg-[#282828]' : 'bg-gray-50'
  const bg3 = isDark ? 'bg-[#333]' : 'bg-gray-100'
  const border = isDark ? 'border-[#333]' : 'border-gray-200'
  const text = isDark ? 'text-gray-200' : 'text-gray-800'
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500'
  const textMuted2 = isDark ? 'text-gray-500' : 'text-gray-400'

  return (
    <div className={`h-screen flex flex-col ${bg} ${text}`}>
      {/* Top Bar */}
      <div className={`h-12 flex items-center justify-between px-4 ${bg2} ${border} border-b`}>
        <div className="flex items-center gap-4">
          <a href="/challenges" className={`${textMuted} hover:text-white transition`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </a>
          <span className="text-sm font-medium">Problem List</span>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Run Button */}
          <button
            onClick={handleRun}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-1.5 rounded ${isDark ? 'bg-[#333] hover:bg-[#404040]' : 'bg-gray-200 hover:bg-gray-300'} transition text-sm`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
            Run
          </button>
          
          {/* Submit Button */}
          <button
            onClick={handleRun}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-1.5 rounded bg-[#2cbb5d] hover:bg-[#26a34d] text-white transition text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            {loading ? 'Running...' : 'Submit'}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded ${bg3} hover:opacity-80 transition`}
            title="Toggle theme"
          >
            {isDark ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
              </svg>
            )}
          </button>

          {/* Divider */}
          <div className={`w-px h-6 ${isDark ? 'bg-[#444]' : 'bg-gray-300'}`}></div>

          {/* Submissions - visible to all logged in users */}
          {user && (
            <a 
              href={`/challenges/${slug}/submissions`} 
              className={`flex items-center gap-2 px-3 py-1.5 rounded ${bg3} hover:opacity-80 transition text-sm ${textMuted} hover:text-white`}
              title="My Submissions"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Submissions
            </a>
          )}

          {/* Creator-only options */}
          {challenge?.creatorId === user?.id && (
            <>
              {/* Leaderboard */}
              <a 
                href={`/challenges/${slug}/leaderboard`} 
                className={`flex items-center gap-2 px-3 py-1.5 rounded ${bg3} hover:opacity-80 transition text-sm ${textMuted} hover:text-white`}
                title="Leaderboard"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Leaderboard
              </a>

              {/* All Submissions */}
              <a 
                href={`/challenges/${slug}/all-submissions`} 
                className={`flex items-center gap-2 px-3 py-1.5 rounded ${bg3} hover:opacity-80 transition text-sm ${textMuted} hover:text-white`}
                title="All Submissions"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                All Submissions
              </a>

              {/* Edit */}
              <a href={`/challenges/${slug}/edit`} className={`p-2 rounded ${bg3} hover:opacity-80`} title="Edit">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </a>

              {/* Delete */}
              <button onClick={handleDelete} className={`p-2 rounded ${bg3} hover:bg-red-500/20 text-red-400`} title="Delete">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content - Split Panes */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Problem Description */}
        <div className={`${bg2} ${border} border-r overflow-auto`} style={{ width: `${leftPanelWidth}%` }}>
          <div className="p-6">
            {/* Title & Difficulty */}
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-xl font-semibold">{challenge?.title || 'Loading...'}</h1>
              {challenge && (
                <span className={`px-2.5 py-0.5 rounded text-xs font-medium ${
                  challenge.difficulty === 'Easy' ? 'bg-[#2cbb5d]/20 text-[#2cbb5d]' :
                  challenge.difficulty === 'Medium' ? 'bg-[#ffc01e]/20 text-[#ffc01e]' :
                  'bg-[#ff375f]/20 text-[#ff375f]'
                }`}>
                  {challenge.difficulty}
                </span>
              )}
            </div>

            {/* Tags */}
            <div className="flex items-center gap-2 mb-6">
              <button className={`px-3 py-1 rounded-full text-xs ${bg3} ${textMuted} hover:text-white transition`}>
                📌 Topics
              </button>
              <button className={`px-3 py-1 rounded-full text-xs ${bg3} ${textMuted} hover:text-white transition`}>
                🏢 Companies
              </button>
              <button className={`px-3 py-1 rounded-full text-xs ${bg3} ${textMuted} hover:text-white transition`}>
                💡 Hint
              </button>
            </div>

            {/* Description */}
            <div className="prose prose-invert max-w-none">
              <div className={`whitespace-pre-wrap text-sm leading-relaxed ${text}`}>
                {challenge?.description}
              </div>

              {/* Example Test Cases */}
              {challenge?.testCases && challenge.testCases.length > 0 && (
                <div className="mt-6 space-y-4">
                  {challenge.testCases.map((tc, idx) => (
                    <div key={idx}>
                      <p className={`font-semibold text-sm mb-2 ${text}`}>Example {idx + 1}:</p>
                      <div className={`${bg3} rounded-lg p-4 font-mono text-sm`}>
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
              <div className={`mt-6 p-4 rounded-lg border ${isDark ? 'bg-amber-900/20 border-amber-700' : 'bg-amber-50 border-amber-200'}`}>
                <p className="text-amber-500 font-medium text-sm mb-2">💡 AI Hint</p>
                <p className={`text-sm ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>{hint}</p>
              </div>
            )}
          </div>
        </div>

        {/* Resize Handle */}
        <div 
          className={`w-1 ${isDark ? 'bg-[#333] hover:bg-[#555]' : 'bg-gray-300 hover:bg-gray-400'} cursor-col-resize transition`}
          onMouseDown={(e) => {
            const startX = e.clientX
            const startWidth = leftPanelWidth
            const onMouseMove = (e: MouseEvent) => {
              const delta = e.clientX - startX
              const newWidth = Math.min(70, Math.max(25, startWidth + (delta / window.innerWidth) * 100))
              setLeftPanelWidth(newWidth)
            }
            const onMouseUp = () => {
              document.removeEventListener('mousemove', onMouseMove)
              document.removeEventListener('mouseup', onMouseUp)
            }
            document.addEventListener('mousemove', onMouseMove)
            document.addEventListener('mouseup', onMouseUp)
          }}
        />

        {/* Right Panel - Code Editor & Test Cases */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Language Selector */}
          <div className={`h-10 flex items-center px-4 ${bg2} ${border} border-b`}>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className={`${bg3} ${text} text-sm px-3 py-1 rounded border-none outline-none cursor-pointer`}
            >
              {challenge?.supportedLanguages?.map((l) => (
                <option key={l.name} value={l.name}>{l.name}</option>
              ))}
            </select>
            <span className={`ml-auto text-xs ${textMuted2}`}>🔒 Auto</span>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1">
            <MonacoEditor
              height="100%"
              language={monacoLanguage}
              value={code}
              onChange={(val) => setCode(val || "")}
              theme={isDark ? "vs-dark" : "light"}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 4,
                padding: { top: 16 }
              }}
            />
          </div>

          {/* Bottom Panel - Testcase / Test Result */}
          <div className={`h-64 ${bg2} ${border} border-t flex flex-col`}>
            {/* Tabs */}
            <div className={`flex items-center gap-1 px-4 py-2 ${border} border-b`}>
              <button
                onClick={() => setActiveTab('testcase')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition ${
                  activeTab === 'testcase' 
                    ? `${bg3} ${text}` 
                    : `${textMuted} hover:text-white`
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isDark ? 'bg-green-500' : 'bg-green-600'}`}></span>
                Testcase
              </button>
              <button
                onClick={() => setActiveTab('result')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition ${
                  activeTab === 'result' 
                    ? `${bg3} ${text}` 
                    : `${textMuted} hover:text-white`
                }`}
              >
                <span className="text-xs">{'>'}_</span>
                Test Result
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-auto p-4">
              {activeTab === 'testcase' && challenge?.testCases && (
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
                    <button className={`px-2 py-1 rounded ${textMuted} hover:text-white`}>+</button>
                  </div>

                  {/* Selected Test Case Input */}
                  {challenge.testCases[selectedTestCase] && (
                    <div className="space-y-3">
                      <div>
                        <label className={`text-xs ${textMuted} block mb-1`}>Input =</label>
                        <div className={`${bg3} rounded-lg p-3 font-mono text-sm ${text}`}>
                          {challenge.testCases[selectedTestCase].input}
                        </div>
                      </div>
                      <div>
                        <label className={`text-xs ${textMuted} block mb-1`}>Expected Output =</label>
                        <div className={`${bg3} rounded-lg p-3 font-mono text-sm ${text}`}>
                          {challenge.testCases[selectedTestCase].output}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'result' && (
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
                      <div className={`text-lg font-semibold mb-4 ${result.accepted ? 'text-[#2cbb5d]' : 'text-[#ff375f]'}`}>
                        {result.accepted ? '✓ Accepted' : '✗ Wrong Answer'}
                      </div>

                      {/* Stats */}
                      {result.submission?.executionTime && (
                        <div className="flex items-center gap-6 mb-4 text-sm">
                          <div>
                            <span className={textMuted}>Runtime: </span>
                            <span className="font-medium">{(result.submission.executionTime * 1000).toFixed(0)} ms</span>
                          </div>
                          {result.submission?.memory && (
                            <div>
                              <span className={textMuted}>Memory: </span>
                              <span className="font-medium">{(result.submission.memory / 1024).toFixed(1)} MB</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Compile/Runtime Error */}
                      {result.compile_output && (
                        <div className={`p-3 rounded-lg mb-4 ${isDark ? 'bg-red-900/20' : 'bg-red-50'} border border-red-500/30`}>
                          <p className="text-red-400 text-xs uppercase mb-1">Compile Error</p>
                          <pre className="text-red-300 text-sm whitespace-pre-wrap">{result.compile_output}</pre>
                        </div>
                      )}
                      
                      {result.stderr && (
                        <div className={`p-3 rounded-lg mb-4 ${isDark ? 'bg-amber-900/20' : 'bg-amber-50'} border border-amber-500/30`}>
                          <p className="text-amber-400 text-xs uppercase mb-1">Runtime Error</p>
                          <pre className="text-amber-300 text-sm whitespace-pre-wrap">{result.stderr}</pre>
                        </div>
                      )}

                      {/* Test Case Results */}
                      {result.testCaseResults && result.testCaseResults.length > 0 && (
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
                                <span className={`w-1.5 h-1.5 rounded-full ${tc.passed ? 'bg-[#2cbb5d]' : 'bg-[#ff375f]'}`}></span>
                                Case {idx + 1}
                              </button>
                            ))}
                          </div>

                          {/* Selected Result */}
                          {result.testCaseResults[selectedTestCase] && (
                            <div className="space-y-3">
                              <div>
                                <label className={`text-xs ${textMuted} block mb-1`}>Input</label>
                                <div className={`${bg3} rounded-lg p-3 font-mono text-sm ${text}`}>
                                  {result.testCaseResults[selectedTestCase].input}
                                </div>
                              </div>
                              <div>
                                <label className={`text-xs ${textMuted} block mb-1`}>Output</label>
                                <div className={`${bg3} rounded-lg p-3 font-mono text-sm ${
                                  result.testCaseResults[selectedTestCase].passed ? 'text-[#2cbb5d]' : 'text-[#ff375f]'
                                }`}>
                                  {result.testCaseResults[selectedTestCase].actual || '(no output)'}
                                </div>
                              </div>
                              <div>
                                <label className={`text-xs ${textMuted} block mb-1`}>Expected</label>
                                <div className={`${bg3} rounded-lg p-3 font-mono text-sm text-[#2cbb5d]`}>
                                  {result.testCaseResults[selectedTestCase].expected}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <span className={textMuted}>You must run your code first</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
