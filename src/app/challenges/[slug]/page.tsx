'use client'
import React, { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import dynamic from 'next/dynamic'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

interface Challenge {
  title: string
  description: string
  difficulty: string
  supportedLanguages: { name: string; id: number; monaco: string }[]
  starterCode: { language: string; code: string }[]
  slug: string
  creatorId: string
}

export default function ChallengePage({ params }: { params: { slug: string } }) {
  const slug = params.slug
  const { user } = useUser()
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [code, setCode] = useState('// write your code')
  const [language, setLanguage] = useState('javascript')
  const [result, setResult] = useState<any>(null)
  const [hint, setHint] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/challenges?slug=${slug}`)
      const j = await res.json()
      if (j.challenge) {
        setChallenge(j.challenge)
        if (j.challenge.supportedLanguages?.length) {
          setLanguage(j.challenge.supportedLanguages[0].name)
        }
        const starter = j.challenge.starterCode?.find((s: any) => s.language === language)
        if (starter) setCode(starter.code)
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

  async function handleSubmit() {
    if (!user) {
      alert('Please sign in to submit')
      return
    }
    setLoading(true)
    setResult(null)
    setHint(null)
    const body = { userId: user.id, challengeSlug: slug, code, language }
    const res = await fetch('/api/submissions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const j = await res.json()
    setResult(j)
    setLoading(false)

    // Check if hint is available (after 2 consecutive failures)
    if (!j.accepted && j.submission?.consecutiveFailures >= 2) {
      const hintRes = await fetch('/api/hints', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, challengeSlug: slug }) })
      const hintJson = await hintRes.json()
      if (hintJson.ok) setHint(hintJson.hint)
    }
  }

  const monacoLanguage = challenge?.supportedLanguages?.find((l) => l.name === language)?.monaco || 'javascript'

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">{challenge?.title || 'Loading...'}</h2>
        {challenge && (
          <span className={`px-2 py-1 rounded text-sm ${challenge.difficulty === 'Easy' ? 'bg-green-100 text-green-800' : challenge.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
            {challenge.difficulty}
          </span>
        )}
      </div>
      {challenge && (
        <div className="mb-4 p-4 bg-gray-100 rounded">
          <p className="whitespace-pre-wrap">{challenge.description}</p>
        </div>
      )}
      <div className="flex gap-4 mb-4 items-center">
        <select value={language} onChange={(e) => setLanguage(e.target.value)} className="border p-2 rounded">
          {challenge?.supportedLanguages?.map((l) => (
            <option key={l.name} value={l.name}>{l.name}</option>
          ))}
        </select>
        {challenge?.creatorId === user?.id && (
          <a href={`/challenges/${slug}/leaderboard`} className="text-blue-600 hover:underline text-sm">View Leaderboard</a>
        )}
      </div>
      <div className="border rounded overflow-hidden" style={{ height: '400px' }}>
        <MonacoEditor
          height="100%"
          language={monacoLanguage}
          value={code}
          onChange={(val) => setCode(val || '')}
          theme="vs-dark"
          options={{ minimap: { enabled: false }, fontSize: 14 }}
        />
      </div>
      <div className="mt-4 flex gap-4">
        <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Running...' : 'Submit'}
        </button>
      </div>
      {result && (
        <div className={`mt-4 p-4 rounded ${result.accepted ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          <p className="font-semibold">{result.accepted ? '✓ Accepted' : '✗ Wrong Answer'}</p>
          <p className="text-sm">Status: {result.submission?.status}</p>
          {result.submission?.executionTime && <p className="text-sm">Time: {result.submission.executionTime}s</p>}
        </div>
      )}
      {hint && (
        <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded">
          <p className="font-semibold text-yellow-800">💡 AI Hint</p>
          <p className="text-sm text-yellow-700 whitespace-pre-wrap">{hint}</p>
        </div>
      )}
    </div>
  )
}
