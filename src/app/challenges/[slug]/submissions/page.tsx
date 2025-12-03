"use client"
import React, { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"

interface Submission {
  _id: string
  userId: string
  code: string
  language: string
  status: string
  executionTime?: number
  memory?: number
  createdAt: string
}

export default function SubmissionsPage({ params }: { params: { slug: string } }) {
  const slug = params.slug
  const { user } = useUser()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)

  useEffect(() => {
    async function load() {
      if (!user) return
      try {
        const res = await fetch(`/api/submissions?slug=${slug}&userId=${user.id}`)
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
    load()
  }, [slug, user])

  const getStatusColor = (status: string) => {
    if (status === 'Accepted') return 'text-[#2cbb5d]'
    if (status.includes('Error') || status === 'Wrong Answer') return 'text-[#ff375f]'
    return 'text-[#ffc01e]'
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
          <h1 className="text-sm font-medium">My Submissions</h1>
        </div>
      </div>

      <div className="flex h-[calc(100vh-48px)]">
        {/* Submissions List */}
        <div className="w-1/2 border-r border-[#333] overflow-auto">
          <div className="p-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-t-transparent border-[#2cbb5d] rounded-full animate-spin"></div>
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No submissions yet</p>
                <a href={`/challenges/${slug}`} className="text-[#2cbb5d] hover:underline text-sm mt-2 inline-block">
                  Go solve the challenge →
                </a>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-[#333]">
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Language</th>
                    <th className="pb-3 font-medium">Runtime</th>
                    <th className="pb-3 font-medium">Memory</th>
                    <th className="pb-3 font-medium">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub) => (
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
                      <td className="py-3 text-sm text-gray-400">{sub.language}</td>
                      <td className="py-3 text-sm text-gray-400">
                        {sub.executionTime ? `${(sub.executionTime * 1000).toFixed(0)} ms` : '-'}
                      </td>
                      <td className="py-3 text-sm text-gray-400">
                        {sub.memory ? `${(sub.memory / 1024).toFixed(1)} MB` : '-'}
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
