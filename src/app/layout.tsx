import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import Header from '@/src/components/Header'

export const metadata = {
  title: 'LeetClone',
  description: 'A LeetCode-like clone'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-100 text-slate-900">
        <ClerkProvider>
          <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 relative overflow-hidden">
            <div className="pointer-events-none absolute inset-x-0 top-[-15%] h-80 bg-radial-grid opacity-70 blur-3xl" aria-hidden="true" />
            <Header />
            <div className="relative z-10">{children}</div>
          </div>
        </ClerkProvider>
      </body>
    </html>
  )
}
