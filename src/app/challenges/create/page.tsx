'use client'
import React, { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { JUDGE0_LANGUAGE_MAP } from '@/src/lib/constants'

export default function CreateChallengePage() {
  const { user } = useUser()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [difficulty, setDifficulty] = useState('Easy')
  const [languages, setLanguages] = useState<string[]>(['javascript'])
  const [testCases, setTestCases] = useState([{ input: '', output: '' }])
  const [starterCode, setStarterCode] = useState<Record<string, string>>({})

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const supportedLanguages = languages.map((l) => {
      const langInfo = JUDGE0_LANGUAGE_MAP[l as keyof typeof JUDGE0_LANGUAGE_MAP]
      return { name: l, id: langInfo?.id, monaco: langInfo?.monaco }
    })
    const starterCodeArray = Object.entries(starterCode).map(([language, code]) => ({ language, code }))
    const body = {
      title,
      description,
      difficulty,
      supportedLanguages,
      starterCode: starterCodeArray,
      testCases,
      creatorId: user?.id || 'ADMIN_PLACEHOLDER'
    }
    const res = await fetch('/api/challenges', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const json = await res.json()
    if (json.ok) {
      alert(`Challenge created! Share link: ${window.location.origin}/challenges/${json.challenge.slug}`)
    } else {
      alert('Error creating challenge')
    }
  }

  function addTestCase() {
    setTestCases([...testCases, { input: '', output: '' }])
  }

  return (
    <section className="container mx-auto px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-sm uppercase tracking-widest text-slate-500">Build</p>
          <h2 className="text-3xl font-semibold text-slate-900">Create Challenge</h2>
        </div>
        <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-8 space-y-6">
          <input
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-soft transition focus:border-indigo-400 focus:outline-none"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-soft transition focus:border-indigo-400 focus:outline-none h-32"
            placeholder="Description (Markdown supported)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium shadow-soft transition focus:border-indigo-400 focus:outline-none"
          >
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>
          <div>
            <label className="block mb-2 text-sm font-semibold text-slate-600">Supported Languages (Ctrl/Cmd+click to select multiple)</label>
            <select
              multiple
              value={languages}
              onChange={(e) => setLanguages(Array.from(e.target.selectedOptions, (o) => o.value))}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-soft transition focus:border-indigo-400 focus:outline-none h-28"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
            </select>
          </div>
          <div>
            <label className="block mb-2 text-sm font-semibold text-slate-600">Starter Code (per language)</label>
            {languages.map((lang) => (
              <div key={lang} className="mb-3">
                <span className="text-xs uppercase tracking-widest text-slate-500">{lang}</span>
                <textarea
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-mono shadow-soft transition focus:border-indigo-400 focus:outline-none h-24"
                  placeholder={`// Starter code for ${lang}`}
                  value={starterCode[lang] || ''}
                  onChange={(e) => setStarterCode({ ...starterCode, [lang]: e.target.value })}
                />
              </div>
            ))}
          </div>
          <div>
            <label className="block mb-2 text-sm font-semibold text-slate-600">Test Cases</label>
            {testCases.map((tc, i) => (
              <div key={i} className="flex flex-col gap-2 md:flex-row mb-3">
                <input
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-soft transition focus:border-indigo-400 focus:outline-none"
                  placeholder="Input"
                  value={tc.input}
                  onChange={(e) => {
                    const updated = [...testCases]
                    updated[i].input = e.target.value
                    setTestCases(updated)
                  }}
                />
                <input
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-soft transition focus:border-indigo-400 focus:outline-none"
                  placeholder="Expected Output"
                  value={tc.output}
                  onChange={(e) => {
                    const updated = [...testCases]
                    updated[i].output = e.target.value
                    setTestCases(updated)
                  }}
                />
              </div>
            ))}
            <button type="button" onClick={addTestCase} className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-800">
              + Add Test Case
            </button>
          </div>
          <button
            className="w-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500 px-6 py-3 text-sm font-semibold text-white shadow-glow transition duration-300 ease-swift-out hover:-translate-y-0.5"
            type="submit"
          >
            Create Challenge
          </button>
        </form>
      </div>
    </section>
  )
}
