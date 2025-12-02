'use client'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'

export default function Home() {
  const { isSignedIn } = useUser()

  return (
    <main className="container mx-auto p-8">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to LeetClone</h1>
        <p className="text-gray-600 mb-8">
          Practice coding challenges, compete with others, and improve your skills.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/challenges" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Browse Challenges
          </Link>
          {isSignedIn && (
            <Link href="/challenges/create" className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
              Create Challenge
            </Link>
          )}
        </div>
        <div className="mt-12 grid grid-cols-3 gap-6 text-left">
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">🚀 Code Execution</h3>
            <p className="text-sm text-gray-600">Run your code against test cases with Judge0</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">🏆 Leaderboards</h3>
            <p className="text-sm text-gray-600">Compete with others and track your ranking</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">💡 AI Hints</h3>
            <p className="text-sm text-gray-600">Get smart hints when you&apos;re stuck</p>
          </div>
        </div>
      </div>
    </main>
  )
}
