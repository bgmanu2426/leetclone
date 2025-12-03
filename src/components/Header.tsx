'use client'
import Link from 'next/link'
import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs'

export default function Header() {
  const { isSignedIn, user } = useUser()

  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/90 border-b border-white/60 shadow-soft">
      <nav className="container mx-auto px-4 py-3 flex items-center justify-between animate-fade-down">
        <Link href="/" className="text-xl font-extrabold tracking-tight text-gradient">
          LeetClone
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href="/challenges"
            className="px-3 py-2 rounded-md text-sm font-medium text-slate-600 transition-colors duration-300 hover:text-slate-900"
          >
            Challenges
          </Link>
          {isSignedIn && (
            <Link
              href="/challenges/create"
              className="px-3 py-2 rounded-md text-sm font-medium text-slate-600 transition duration-300 hover:text-slate-900 hover:bg-slate-100"
            >
              Create
            </Link>
          )}
          {isSignedIn ? (
            <div className="flex items-center gap-2 pl-3">
              <span className="text-sm text-slate-500">{user?.username || user?.firstName}</span>
              <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: 'ring-2 ring-indigo-200 transition-all duration-300 hover:ring-indigo-400' } }} />
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-3">
              <SignInButton mode="modal">
                <button className="px-3 py-2 text-sm font-medium text-slate-600 transition-colors duration-300 hover:text-slate-900">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="px-4 py-2 text-sm font-semibold rounded-md bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-glow transition-transform duration-300 hover:-translate-y-0.5">
                  Sign Up
                </button>
              </SignUpButton>
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}
