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
      <body>
        <ClerkProvider>
          <Header />
          <div className="min-h-screen bg-gray-50">{children}</div>
        </ClerkProvider>
      </body>
    </html>
  )
}
