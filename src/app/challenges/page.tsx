'use client'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'

interface Challenge {
  _id: string
  title: string
  difficulty: string
  slug: string
  createdAt: string
  creatorId?: string
}

export default function ChallengesPage() {
  const { user } = useUser()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Check if user is admin from Clerk public metadata
  const isAdmin = (user?.publicMetadata?.role as string) === 'admin'

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/challenges')
      const j = await res.json()
      if (j.ok) setChallenges(j.list || [])
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleDelete = async (slug: string) => {
    if (!confirm('Are you sure you want to delete this challenge?')) return
    setDeleting(slug)
    try {
      const res = await fetch(`/api/challenges?slug=${slug}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.ok) {
        setChallenges(challenges.filter(c => c.slug !== slug))
      } else {
        alert(data.error || 'Failed to delete')
      }
    } catch {
      alert('Failed to delete challenge')
    }
    setDeleting(null)
    setOpenMenu(null)
  }

  return (
    <section className="container mx-auto px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-sm uppercase tracking-widest text-slate-500">Playground</p>
          <h1 className="text-3xl font-semibold text-slate-900">Challenges</h1>
        </div>
        {isAdmin && (
          <Link
            href="/challenges/create"
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-glow transition duration-300 ease-swift-out hover:-translate-y-0.5"
          >
            <span>+ Create Challenge</span>
          </Link>
        )}
      </div>
      <div className="glass-panel rounded-2xl animate-fade-up">
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
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {challenges.map((c, idx) => {
                return (
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
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/challenges/${c.slug}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Solve"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Solve
                      </Link>

                      {isAdmin && (
                        <div className="relative" ref={openMenu === c.slug ? menuRef : null}>
                          <button
                            onClick={() => setOpenMenu(openMenu === c.slug ? null : c.slug)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Manage"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Manage
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          {openMenu === c.slug && (
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                              <Link
                                href={`/challenges/${c.slug}/all-submissions`}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                onClick={() => setOpenMenu(null)}
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                All Submissions
                              </Link>
                              <Link
                                href={`/challenges/${c.slug}/leaderboard`}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                onClick={() => setOpenMenu(null)}
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                Leaderboard
                              </Link>
                              <div className="border-t border-slate-100 my-1"></div>
                              <Link
                                href={`/challenges/${c.slug}/edit`}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                onClick={() => setOpenMenu(null)}
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit Challenge
                              </Link>
                              <button
                                onClick={() => handleDelete(c.slug)}
                                disabled={deleting === c.slug}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left disabled:opacity-50"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                {deleting === c.slug ? 'Deleting...' : 'Delete Challenge'}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}
