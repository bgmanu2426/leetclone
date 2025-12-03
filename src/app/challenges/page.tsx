'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Challenge {
  _id: string
  title: string
  difficulty: string
  slug: string
  createdAt: string
}

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/challenges')
      const j = await res.json()
      if (j.ok) setChallenges(j.list || [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <section className="container mx-auto px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-sm uppercase tracking-widest text-slate-500">Playground</p>
          <h1 className="text-3xl font-semibold text-slate-900">Challenges</h1>
        </div>
        <Link
          href="/challenges/create"
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-glow transition duration-300 ease-swift-out hover:-translate-y-0.5"
        >
          <span>+ Create Challenge</span>
        </Link>
      </div>
      <div className="glass-panel rounded-2xl overflow-hidden animate-fade-up">
        {loading ? (
          <div className="p-6 grid gap-4">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="w-full h-14 rounded-lg bg-gradient-to-r from-slate-100 via-white to-slate-100 bg-[length:200%_100%] animate-shimmer"
              />
            ))}
          </div>
        ) : challenges.length === 0 ? (
          <p className="p-6 text-slate-500">No challenges yet. Create one!</p>
        ) : (
          <table className="w-full">
            <thead className="bg-white/70 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">
              <tr>
                <th className="p-4">Title</th>
                <th className="p-4">Difficulty</th>
                <th className="p-4">Created</th>
              </tr>
            </thead>
            <tbody>
              {challenges.map((c, idx) => (
                <tr
                  key={c._id}
                  className="border-t border-slate-100/70 transition duration-300 ease-swift-out hover:bg-slate-50/90"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <td className="p-4">
                    <Link href={`/challenges/${c.slug}`} className="text-slate-900 font-medium transition-colors hover:text-slate-600">
                      {c.title}
                    </Link>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-slate-700 ${
                        c.difficulty === 'Easy'
                          ? 'bg-green-100 text-green-700'
                          : c.difficulty === 'Medium'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-rose-100 text-rose-700'
                      } animate-pulse-border`}
                    >
                      {c.difficulty}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-500">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}
