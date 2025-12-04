"use client"
import React, { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

interface Submission {
  _id: string
  userId: string
  userName?: string
  code: string
  language: string
  status: string
  executionTime?: number
  memory?: number
  createdAt: string
}

interface Challenge {
  title: string
  creatorId: string
}

export default function AllSubmissionsPage({ params }: { params: { slug: string } }) {
  const slug = params.slug
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [filter, setFilter] = useState<'all' | 'accepted' | 'wrong'>('all')

  // Check if user is admin
  const isAdmin = (user?.publicMetadata?.role as string) === 'admin'

  useEffect(() => {
    async function load() {
      // Check admin access
      if (isLoaded && !isAdmin) {
        alert('Only administrators can view all submissions')
        router.push(`/challenges/${slug}`)
        return
      }

      try {
        // Load challenge
        const chalRes = await fetch(`/api/challenges?slug=${slug}`)
        const chalData = await chalRes.json()
        
        if (!chalData.challenge) {
          alert('Challenge not found')
          return
        }
        
        setChallenge(chalData.challenge)

        // Load all submissions
        const res = await fetch(`/api/submissions?slug=${slug}&all=true`)
        const data = await res.json()
        if (data.ok) {
          setSubmissions(data.submissions || [])
        }
      } catch (error) {
        console.error('Failed to load submissions', error)
      } finally {
        setLoading(false)
      }
    }
    
    if (isLoaded) load()
  }, [slug, isLoaded, isAdmin, router])

  const getStatusColor = (status: string) => {
    if (status === 'Accepted') return 'text-[#2cbb5d]'
    if (status.includes('Error') || status === 'Wrong Answer') return 'text-[#ff375f]'
    return 'text-[#ffc01e]'
  }

  const filteredSubmissions = submissions.filter(sub => {
    if (filter === 'accepted') return sub.status === 'Accepted'
    if (filter === 'wrong') return sub.status !== 'Accepted'
    return true
  })

  const stats = {
    total: submissions.length,
    accepted: submissions.filter(s => s.status === 'Accepted').length,
    uniqueUsers: new Set(submissions.map(s => s.userId)).size
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-gray-200">
      {/* Header */}
      <div className="h-12 flex items-center justify-between px-6 bg-[#282828] border-b border-[#333]">
        <div className="flex items-center gap-4">
          <a href={`/challenges/${slug}`} className="text-gray-400 hover:text-white transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </a>
          <h1 className="text-sm font-medium">All Submissions - {challenge?.title}</h1>
        </div>
        
        {/* Stats */}
        <div className="flex items-center gap-6 text-xs">
          <div>
            <span className="text-gray-500">Total: </span>
            <span className="text-white font-medium">{stats.total}</span>
          </div>
          <div>
            <span className="text-gray-500">Accepted: </span>
            <span className="text-[#2cbb5d] font-medium">{stats.accepted}</span>
          </div>
          <div>
            <span className="text-gray-500">Users: </span>
            <span className="text-white font-medium">{stats.uniqueUsers}</span>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-48px)]">
        {/* Submissions List */}
        <div className="w-1/2 border-r border-[#333] overflow-auto">
          {/* Filter tabs */}
          <div className="flex items-center gap-2 p-4 border-b border-[#333]">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded text-sm transition ${
                filter === 'all' ? 'bg-[#333] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setFilter('accepted')}
              className={`px-3 py-1.5 rounded text-sm transition ${
                filter === 'accepted' ? 'bg-[#2cbb5d]/20 text-[#2cbb5d]' : 'text-gray-400 hover:text-white'
              }`}
            >
              Accepted ({stats.accepted})
            </button>
            <button
              onClick={() => setFilter('wrong')}
              className={`px-3 py-1.5 rounded text-sm transition ${
                filter === 'wrong' ? 'bg-[#ff375f]/20 text-[#ff375f]' : 'text-gray-400 hover:text-white'
              }`}
            >
              Failed ({stats.total - stats.accepted})
            </button>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-t-transparent border-[#2cbb5d] rounded-full animate-spin"></div>
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No submissions found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-[#333]">
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">User</th>
                    <th className="pb-3 font-medium">Language</th>
                    <th className="pb-3 font-medium">Runtime</th>
                    <th className="pb-3 font-medium">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.map((sub) => (
                    <tr 
                      key={sub._id} 
                      onClick={() => setSelectedSubmission(sub)}
                      className={`border-b border-[#333] cursor-pointer hover:bg-[#333] transition ${
                        selectedSubmission?._id === sub._id ? 'bg-[#333]' : ''
                      }`}
                    >
                      <td className={`py-3 text-sm font-medium ${getStatusColor(sub.status)}`}>
                        {sub.status}
                      </td>
                      <td className="py-3 text-sm text-gray-400">
                        {sub.userId.slice(0, 8)}...
                      </td>
                      <td className="py-3 text-sm text-gray-400">{sub.language}</td>
                      <td className="py-3 text-sm text-gray-400">
                        {sub.executionTime ? `${(sub.executionTime * 1000).toFixed(0)} ms` : '-'}
                      </td>
                      <td className="py-3 text-sm text-gray-500">
                        {new Date(sub.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Code Preview */}
        <div className="w-1/2 bg-[#1e1e1e] overflow-auto">
          {selectedSubmission ? (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className={`text-lg font-semibold ${getStatusColor(selectedSubmission.status)}`}>
                    {selectedSubmission.status}
                  </span>
                  <span className="text-xs text-gray-500 bg-[#333] px-2 py-1 rounded">
                    {selectedSubmission.language}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(selectedSubmission.createdAt).toLocaleString()}
                </span>
              </div>

              <div className="mb-4 text-sm">
                <span className="text-gray-500">User ID: </span>
                <span className="text-gray-300 font-mono">{selectedSubmission.userId}</span>
              </div>
              
              {selectedSubmission.executionTime && (
                <div className="flex gap-6 mb-4 text-sm">
                  <div>
                    <span className="text-gray-500">Runtime: </span>
                    <span className="text-white">{(selectedSubmission.executionTime * 1000).toFixed(0)} ms</span>
                  </div>
                  {selectedSubmission.memory && (
                    <div>
                      <span className="text-gray-500">Memory: </span>
                      <span className="text-white">{(selectedSubmission.memory / 1024).toFixed(1)} MB</span>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-[#282828] rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <pre className="text-gray-300 whitespace-pre-wrap">{selectedSubmission.code}</pre>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a submission to view code
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
