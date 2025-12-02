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
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4">Create Challenge</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input className="w-full p-2 border rounded" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className="w-full p-2 border rounded h-32" placeholder="Description (Markdown supported)" value={description} onChange={(e) => setDescription(e.target.value)} />
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="border p-2 rounded">
          <option>Easy</option>
          <option>Medium</option>
          <option>Hard</option>
        </select>
        <div>
          <label className="block mb-2 font-medium">Supported Languages (Ctrl/Cmd+click to select multiple)</label>
          <select multiple value={languages} onChange={(e) => setLanguages(Array.from(e.target.selectedOptions, (o) => o.value))} className="border p-2 w-full rounded h-24">
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
          </select>
        </div>
        <div>
          <label className="block mb-2 font-medium">Starter Code (per language)</label>
          {languages.map((lang) => (
            <div key={lang} className="mb-2">
              <span className="text-sm text-gray-600">{lang}</span>
              <textarea
                className="w-full p-2 border rounded h-20 font-mono text-sm"
                placeholder={`// Starter code for ${lang}`}
                value={starterCode[lang] || ''}
                onChange={(e) => setStarterCode({ ...starterCode, [lang]: e.target.value })}
              />
            </div>
          ))}
        </div>
        <div>
          <label className="block mb-2 font-medium">Test Cases</label>
          {testCases.map((tc, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                className="flex-1 p-2 border rounded"
                placeholder="Input"
                value={tc.input}
                onChange={(e) => {
                  const updated = [...testCases]
                  updated[i].input = e.target.value
                  setTestCases(updated)
                }}
              />
              <input
                className="flex-1 p-2 border rounded"
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
          <button type="button" onClick={addTestCase} className="text-blue-600 text-sm">+ Add Test Case</button>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" type="submit">Create Challenge</button>
      </form>
    </div>
  )
}
