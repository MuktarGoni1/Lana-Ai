import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

// Centralized auth gating and role-based redirects
export async function proxy(req: NextRequest) {
  const url = req.nextUrl
  const pathname = url.pathname

  // Skip middleware for public assets and health
  const PUBLIC_PATHS = [
    '/',
    '/landing-page',
    '/login',
    '/register',
    '/register/form',
    '/onboarding',
    '/child-login',
  ]
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  const isAsset = pathname.startsWith('/_next') || pathname.startsWith('/images') || pathname === '/favicon.ico'
  if (isPublic || isAsset) return NextResponse.next()

  const res = NextResponse.next()

  // Create Supabase middleware client via auth-helpers for Next.js
  const supabase = createMiddlewareClient({ req, res })

  const { data: { session } } = await supabase.auth.getSession()

  // If authenticated and trying to access the landing page, send to root
  if (session && pathname === '/landing-page') {
    const dest = new URL('/', req.url)
    return NextResponse.redirect(dest)
  }

  // If unauthenticated and not trying to access a public path, send to landing page
  if (!session && !isPublic && pathname !== '/landing-page') {
    const dest = new URL('/landing-page', req.url)
    return NextResponse.redirect(dest)
  }

  const role = session?.user?.user_metadata?.role as 'child' | 'guardian' | undefined

  // Role-based normalization
  if (pathname.startsWith('/guardian') && role !== 'guardian') {
    const dest = new URL('/', req.url)
    return NextResponse.redirect(dest)
  }

  // Otherwise allow
  return res
}

// Limit middleware to app routes, excluding assets
export const config = {
  matcher: [
    '/guardian/:path*',
    '/settings/:path*',
    '/video-learning/:path*',
    '/quiz/:path*',
  ],
}