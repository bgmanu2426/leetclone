'use client'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'

export default function Home() {
  const { isSignedIn } = useUser()

  // Redirect authenticated users to challenges page
  if (typeof window !== 'undefined' && isSignedIn) {
    window.location.href = '/challenges'
    return null
  }

  return (
    <main className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-72 bg-radial-grid opacity-60 blur-3xl" aria-hidden="true" />
      <section className="container mx-auto px-6 py-20 text-center relative z-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 shadow-soft animate-fade-up">
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">New</span>
          <p className="text-sm text-slate-600">Judge0-powered playground with AI hints</p>
        </div>
        <div className="max-w-3xl mx-auto mt-8 animate-fade-up">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
            Practice. Compete. <span className="text-gradient">Level Up.</span>
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Tackle curated challenges, get instant feedback, and climb the leaderboard with real-time Judge0 execution.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 animate-fade-up">
          <Link
            href="/challenges"
            className="px-8 py-3 rounded-full bg-slate-900 text-white text-sm font-semibold shadow-glow transition duration-300 ease-swift-out hover:-translate-y-0.5"
          >
            Browse Challenges
          </Link>
          {isSignedIn && (
            <Link
              href="/challenges/create"
              className="px-8 py-3 rounded-full border border-slate-200 text-sm font-semibold text-slate-600 transition duration-300 ease-swift-out hover:bg-white/80 hover:-translate-y-0.5"
            >
              Create Challenge
            </Link>
          )}
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {[
            {
              title: '🚀 Code Execution',
              desc: 'Run code safely in Judge0 with generous CPU and memory limits.'
            },
            {
              title: '🏆 Leaderboards',
              desc: 'Track personal bests and compete with friends in real time.'
            },
            {
              title: '💡 AI Hints',
              desc: 'Request context-aware tips powered by Gemini after tough runs.'
            }
          ].map((feature, idx) => (
            <div key={feature.title} className="glass-panel card-pressable p-6" style={{ animationDelay: `${idx * 0.08}s` }}>
              <h3 className="font-semibold text-lg text-slate-900">{feature.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
