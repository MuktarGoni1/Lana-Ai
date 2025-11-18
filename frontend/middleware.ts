import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { type CookieOptions } from '@supabase/ssr'

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
export async function middleware(req: NextRequest) {
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
      '/quiz',
    ]
    const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
    // Treat any static asset (including files in /public root like /first-section.jpg) as pass-through
    const hasFileExtension = /\.[a-zA-Z0-9]+$/.test(pathname)
    const isAsset = pathname.startsWith('/_next') || pathname.startsWith('/images') || pathname === '/favicon.ico' || hasFileExtension
    if (isAsset) return NextResponse.next()

    const res = NextResponse.next()

    // Create Supabase middleware client using @supabase/ssr
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            try {
              return req.cookies.getAll()
            } catch (error) {
              console.error('Error getting cookies:', error)
              return []
            }
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                // Validate that the value is a valid string before setting
                if (typeof value === 'string') {
                  req.cookies.set(name, value)
                  res.cookies.set(name, value, options)
                } else {
                  console.warn(`Invalid cookie value for ${name}:`, value)
                }
              })
            } catch (error) {
              // Handle cookie setting errors in middleware
              console.error('Error setting cookies in middleware:', error)
            }
          },
        },
      }
    )

    // Use getUser() for secure user data instead of relying on session.user directly
    const { data: { user }, error } = await supabase.auth.getUser();
    const sessionExists = !error && user;

    // Define protected routes
    const protectedPaths = [
      '/dashboard',
      '/settings',
      '/guardian',
      '/term-plan',
      '/quiz',
      '/personalised-ai-tutor'
    ]

    const isProtectedRoute = protectedPaths.some(path => 
      pathname.startsWith(path)
    )

    // If the user is not authenticated and trying to access a protected route, redirect to login
    if (!sessionExists && isProtectedRoute) {
      const dest = new URL('/login', req.url)
      dest.searchParams.set('redirectedFrom', pathname)
      return NextResponse.redirect(dest)
    }

    // If the user is authenticated and trying to access login/register pages, redirect to homepage
    const authPaths = ['/login', '/register']
    const isAuthPath = authPaths.some(path => 
      pathname.startsWith(path)
    )

    if (sessionExists && isAuthPath) {
      const dest = new URL('/landing-page', req.url)
      return NextResponse.redirect(dest)
    }

    // First-time onboarding enforcement
    const onboardingComplete = Boolean(user?.user_metadata?.onboarding_complete)
    const cookieComplete = req.cookies.get('lana_onboarding_complete')?.value === '1'
    const isOnboardingRoute = pathname.startsWith('/term-plan') || pathname.startsWith('/onboarding')
    const role = user?.user_metadata?.role as 'child' | 'guardian' | undefined
    if (sessionExists && !onboardingComplete && !cookieComplete && !isOnboardingRoute && role !== 'child') {
      const returnTo = `${pathname}${url.search}`
      const dest = new URL(`/term-plan?onboarding=1&returnTo=${encodeURIComponent(returnTo)}`, req.url)
      return NextResponse.redirect(dest)
    }

    // If authenticated and trying to access the landing page, send to homepage
    if (sessionExists && pathname === '/landing-page') {
      // Redirect to appropriate dashboard based on role
      if (role === 'child') {
        const dest = new URL('/personalised-ai-tutor', req.url)
        return NextResponse.redirect(dest)
      } else if (role === 'guardian') {
        const dest = new URL('/guardian', req.url)
        return NextResponse.redirect(dest)
      } else {
        const dest = new URL('/homepage', req.url)
        return NextResponse.redirect(dest)
      }
    }

    // If authenticated and hitting root, normalize to landing page
    if (sessionExists && pathname === '/') {
      const dest = new URL('/landing-page', req.url)
      return NextResponse.redirect(dest)
    }

    // If unauthenticated and not trying to access a public path, send to landing page
    if (!sessionExists && !isPublic && pathname !== '/landing-page') {
      const dest = new URL('/landing-page', req.url)
      return NextResponse.redirect(dest)
    }

    // Role-based normalization
    if (pathname.startsWith('/guardian') && role !== 'guardian') {
      const dest = new URL('/landing-page', req.url)
      return NextResponse.redirect(dest)
    }

    // Set guest cookie for landing page visits
    if (pathname === '/homepage') {
      setGuestCookie(req, res)
    }

    // Otherwise allow
    return res
  } catch (error) {
    // On any middleware error, redirect to landing page
    console.error('[middleware] error:', error)
    return NextResponse.redirect(new URL('/landing-page', req.url))
  }
}

// Limit middleware to app routes, excluding assets
export const config = {
  // Apply to all non-asset routes; internal public checks happen above
  // Also exclude typical files with extensions using a broad pattern
  matcher: ['/((?!_next|api|images|favicon.ico).*)'],
}