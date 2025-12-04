'use client'
import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'

interface Entry {
  userId: string
  status: string
  executionTime: number
  memory?: number
  createdAt: string
}

export default function LeaderboardPage({ params }: { params: { slug: string } }) {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)

  // Check if user is admin
  const isAdmin = (user?.publicMetadata?.role as string) === 'admin'

  useEffect(() => {
    async function load() {
      // Check admin access
      if (isLoaded && !isAdmin) {
        alert('Only administrators can view the leaderboard')
        router.push(`/challenges/${params.slug}`)
        return
      }

      try {
        const res = await fetch(`/api/challenges/${params.slug}/leaderboard`)
        const j = await res.json()
        if (j.ok) setEntries(j.entries)
      } finally {
        setLoading(false)
      }
    }
    
    if (isLoaded) load()
  }, [params.slug, isLoaded, isAdmin, router])

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'bg-[#ffc01e]/20 text-[#ffc01e]'
    if (rank === 2) return 'bg-gray-400/20 text-gray-400'
    if (rank === 3) return 'bg-amber-600/20 text-amber-600'
    return 'bg-[#333] text-gray-400'
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-200">
      {/* Header */}
      <div className="h-12 flex items-center justify-between px-6 bg-[#282828] border-b border-[#333]">
        <div className="flex items-center gap-4">
          <a href={`/challenges/${params.slug}`} className="text-gray-400 hover:text-white transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </a>
          <h1 className="text-sm font-medium">🏆 Leaderboard</h1>
        </div>
        <div className="text-xs text-gray-500">
          {entries.length} submissions
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Stats Cards */}
        {entries.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-[#282828] rounded-xl p-4 border border-[#333]">
              <p className="text-xs text-gray-500 mb-1">Fastest Runtime</p>
              <p className="text-2xl font-bold text-[#2cbb5d]">
                {entries[0]?.executionTime ? `${(entries[0].executionTime * 1000).toFixed(0)}ms` : '-'}
              </p>
            </div>
            <div className="bg-[#282828] rounded-xl p-4 border border-[#333]">
              <p className="text-xs text-gray-500 mb-1">Total Accepted</p>
              <p className="text-2xl font-bold text-white">{entries.length}</p>
            </div>
            <div className="bg-[#282828] rounded-xl p-4 border border-[#333]">
              <p className="text-xs text-gray-500 mb-1">Avg Runtime</p>
              <p className="text-2xl font-bold text-white">
                {entries.length > 0 
                  ? `${(entries.reduce((acc, e) => acc + (e.executionTime || 0), 0) / entries.length * 1000).toFixed(0)}ms`
                  : '-'
                }
              </p>
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="bg-[#282828] rounded-xl border border-[#333] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-t-transparent border-[#2cbb5d] rounded-full animate-spin"></div>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-4xl mb-3">🏆</p>
              <p>No accepted submissions yet</p>
              <p className="text-sm mt-1">Be the first to solve this challenge!</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-[#333]">
                  <th className="p-4 font-medium">Rank</th>
                  <th className="p-4 font-medium">User</th>
                  <th className="p-4 font-medium">Runtime</th>
                  <th className="p-4 font-medium">Memory</th>
                  <th className="p-4 font-medium">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e, i) => (
                  <tr key={i} className="border-b border-[#333] last:border-0 hover:bg-[#333]/50 transition">
                    <td className="p-4">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${getRankStyle(i + 1)}`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                          {e.userId.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-gray-300 font-mono text-sm">{e.userId.slice(0, 12)}...</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-[#2cbb5d] font-medium">
                        {e.executionTime ? `${(e.executionTime * 1000).toFixed(0)} ms` : '-'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400">
                      {e.memory ? `${(e.memory / 1024).toFixed(1)} MB` : '-'}
                    </td>
                    <td className="p-4 text-gray-500 text-sm">
                      {new Date(e.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
