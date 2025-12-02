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
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Challenges</h1>
        <Link href="/challenges/create" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          + Create Challenge
        </Link>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : challenges.length === 0 ? (
        <p className="text-gray-500">No challenges yet. Create one!</p>
      ) : (
        <div className="border rounded overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Title</th>
                <th className="p-3 text-left">Difficulty</th>
                <th className="p-3 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {challenges.map((c) => (
                <tr key={c._id} className="border-t hover:bg-gray-50">
                  <td className="p-3">
                    <Link href={`/challenges/${c.slug}`} className="text-blue-600 hover:underline">
                      {c.title}
                    </Link>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${c.difficulty === 'Easy' ? 'bg-green-100 text-green-800' : c.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                      {c.difficulty}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-gray-500">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
