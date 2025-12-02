'use client'
import { useEffect, useState } from 'react'

interface Entry {
  userId: string
  status: string
  executionTime: number
  createdAt: string
}

export default function LeaderboardPage({ params }: { params: { slug: string } }) {
  const [entries, setEntries] = useState<Entry[]>([])

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/challenges/${params.slug}/leaderboard`)
      const j = await res.json()
      if (j.ok) setEntries(j.entries)
    }
    load()
  }, [params.slug])

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4">Leaderboard</h2>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2 border">Rank</th>
            <th className="p-2 border">User</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border">Time (ms)</th>
            <th className="p-2 border">Submitted</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e, i) => (
            <tr key={i}>
              <td className="p-2 border text-center">{i + 1}</td>
              <td className="p-2 border">{e.userId}</td>
              <td className="p-2 border">{e.status}</td>
              <td className="p-2 border text-center">{e.executionTime ?? '-'}</td>
              <td className="p-2 border">{new Date(e.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
