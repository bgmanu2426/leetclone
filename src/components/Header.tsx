'use client'
import Link from 'next/link'
import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs'

export default function Header() {
  const { isSignedIn, user } = useUser()

  return (
    <header className="bg-gray-900 text-white">
      <nav className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">
          LeetClone
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/challenges" className="hover:text-gray-300">
            Challenges
          </Link>
          {isSignedIn && (
            <Link href="/challenges/create" className="hover:text-gray-300">
              Create
            </Link>
          )}
          {isSignedIn ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">{user?.username || user?.firstName}</span>
              <UserButton afterSignOutUrl="/" />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <SignInButton mode="modal">
                <button className="px-3 py-1 text-sm hover:text-gray-300">Sign In</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="px-3 py-1 text-sm bg-blue-600 rounded hover:bg-blue-700">Sign Up</button>
              </SignUpButton>
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}
