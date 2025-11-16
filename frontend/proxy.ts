import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

// Generate a simple UUID-like string for guest sessions
function generateGuestId(): string {
  return 'guest-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
}

// Set guest cookie for unauthenticated users
function setGuestCookie(req: NextRequest, res: NextResponse) {
  const hasCookie = req.cookies.has('lana_guest_id')
  if (!hasCookie) {
    const id = generateGuestId()
    res.cookies.set('lana_guest_id', id, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    })
  }
}

// Centralized auth gating and role-based redirects
export async function proxy(req: NextRequest) {
  try {
    const url = req.nextUrl
    const pathname = url.pathname

    // Identify public routes and static assets
    const PUBLIC_PATHS = [
      '/landing-page',
      '/homepage',
      '/login',
      '/register',
      '/register/form',
      '/register/magic-link-sent',
      '/onboarding',
      '/child-login',
      '/term-plan', 
      '/auth/confirmed',
      '/auth/confirmed/guardian',
      '/auth/confirmed/child',
    ]
    const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
    // Treat any static asset (including files in /public root like /first-section.jpg) as pass-through
    const hasFileExtension = /\.[a-zA-Z0-9]+$/.test(pathname)
    const isAsset = pathname.startsWith('/_next') || pathname.startsWith('/images') || pathname === '/favicon.ico' || hasFileExtension
    if (isAsset) return NextResponse.next()

    const res = NextResponse.next()

    // Create Supabase middleware client via auth-helpers for Next.js
    const supabase = createMiddlewareClient({ req, res })

    const { data: { session } } = await supabase.auth.getSession();

    // First-time onboarding enforcement
    const onboardingComplete = Boolean(session?.user?.user_metadata?.onboarding_complete)
    const cookieComplete = req.cookies.get('lana_onboarding_complete')?.value === '1'
    const isOnboardingRoute = pathname.startsWith('/term-plan') || pathname.startsWith('/onboarding')
    const role = session?.user?.user_metadata?.role as 'child' | 'guardian' | undefined
    if (session && !onboardingComplete && !cookieComplete && !isOnboardingRoute && role !== 'child') {
      const returnTo = `${pathname}${url.search}`
      const dest = new URL(`/term-plan?onboarding=1&returnTo=${encodeURIComponent(returnTo)}`, req.url)
      return NextResponse.redirect(dest)
    }

    // If authenticated and trying to access the landing page, send to homepage
    if (session && pathname === '/landing-page') {
      const dest = new URL('/homepage', req.url)
      return NextResponse.redirect(dest)
    }

    // If authenticated and hitting root, normalize to landing page
    if (session && pathname === '/') {
      const dest = new URL('/landing-page', req.url)
      return NextResponse.redirect(dest)
    }

    // If unauthenticated and not trying to access a public path, send to landing page
    if (!session && !isPublic && pathname !== '/landing-page') {
      const dest = new URL('/landing-page', req.url)
      return NextResponse.redirect(dest)
    }

    // Role-based normalization
    if (pathname.startsWith('/guardian') && role !== 'guardian') {
      const dest = new URL('/landing-page', req.url)
      return NextResponse.redirect(dest)
    }

    // Set guest cookie for landing page visits
    if (pathname === '/landing-page') {
      setGuestCookie(req, res)
    }

    // Otherwise allow
    return res
  } catch (error) {
    // On any middleware error, redirect to landing page
    console.error('[proxy] error:', error)
    return NextResponse.redirect(new URL('/landing-page', req.url))
  }
}

// Limit middleware to app routes, excluding assets
export const config = {
  // Apply to all non-asset routes; internal public checks happen above
  // Also exclude typical files with extensions using a broad pattern
  matcher: ['/((?!_next|api|images|favicon.ico).*)'],
}