import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtectedRoute = createRouteMatcher(['/challenges(.*)'])
const isHomepage = createRouteMatcher(['/'])

export default clerkMiddleware((auth, req) => {
  const { userId } = auth()
  
  // Redirect authenticated users from homepage to challenges
  if (isHomepage(req) && userId && req.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/challenges', req.url))
  }
  
  // Protect challenges routes - redirect unauthenticated users to sign-in
  if (isProtectedRoute(req) && !userId) {
    const signInUrl = new URL('/sign-in', req.url)
    signInUrl.searchParams.set('redirect_url', req.url)
    return NextResponse.redirect(signInUrl)
  }
  
  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)'
  ]
}
