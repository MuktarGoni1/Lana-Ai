import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { type CookieOptions } from '@supabase/ssr'
import { authLogger } from '@/lib/services/authLogger'

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

    // Log for debugging
    console.log('[Middleware] Processing request:', {
      pathname,
      method: req.method,
      userAgent: req.headers.get('user-agent')
    })
    
    // Log authentication check start
    await authLogger.logAuthCheckStart(pathname, req.headers.get('user-agent') || undefined);

    // Identify public routes and static assets
    const PUBLIC_PATHS = [
      '/landing-page',
      '/login',
      '/register',
      '/register/form',
      '/register/magic-link-sent',
      '/child-login',
      '/auth/confirmed',
      '/auth/confirmed/guardian',
      '/auth/confirmed/child',
      '/auth/auto-login',
      '/quiz',
      '/diagnostic-quiz',
      '/term-plan',
      '/settings',
      '/children',
      '/feedback',
      '/demo',
      '/api',
      '/features',
      '/pricing',
      '/about',
      '/blog',
      '/careers',
      '/contact',
      '/privacy-policy',
      '/terms-of-service',
      '/security-policy',
      '/cookie-policy'
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
    
    // Log authentication status
    console.log('[Middleware] Authentication status:', {
      sessionExists,
      userId: user?.id,
      email: user?.email,
      userMetadata: user?.user_metadata,
      error: error?.message
    });
    
    // Log authentication check completion
    await authLogger.logAuthCheckComplete(
      pathname, 
      !!sessionExists, 
      user?.id, 
      user?.email
    );
    
    // Log authentication errors if any
    if (error) {
      await authLogger.logAuthError(
        pathname, 
        error.message, 
        user?.id, 
        user?.email
      );
    }

    // Define protected routes
    const protectedPaths = [
      '/dashboard',
      '/guardian',
      '/personalised-ai-tutor',
      '/children'
    ]

    const isProtectedRoute = protectedPaths.some(path => 
      pathname.startsWith(path)
    )

    // Special handling for homepage - allow access even without session
    if (pathname === '/homepage') {
      console.log('[Middleware] Allowing access to homepage');
      const hasGuestCookie = req.cookies.has('lana_guest_id');
      await authLogger.logGuestAccess(pathname, hasGuestCookie);
      setGuestCookie(req, res);
      return res;
    }
    
    // If there's an authentication error but we're trying to access a public path, allow it
    if (error && isPublic) {
      console.log('[Middleware] Authentication error but accessing public path, allowing access');
      return res;
    }
    
    // If there's an authentication error and we're not accessing a public path, redirect to landing page
    // Prevent infinite redirect loops by checking if we're already on the landing page
    if (error && !isPublic && pathname !== '/landing-page') {
      console.log('[Middleware] Authentication error and not public path, redirecting to landing page');
      const dest = new URL('/landing-page', req.url);
      return NextResponse.redirect(dest);
    }
    
    // If there's an authentication error and we're already on the landing page, allow access to prevent loop
    if (error && !isPublic && pathname === '/landing-page') {
      console.log('[Middleware] Authentication error but on landing page, allowing access to prevent redirect loop');
      return res;
    }

    // If the user is not authenticated and trying to access a protected route, redirect to login
    if (!sessionExists && isProtectedRoute) {
      console.log('[Middleware] Unauthenticated user accessing protected route, redirecting to login')
      await authLogger.logProtectedRouteAccess(pathname, false);
      const dest = new URL('/login', req.url)
      dest.searchParams.set('redirectedFrom', pathname)
      await authLogger.logRedirect(pathname, '/login', 'unauthenticated_protected_route_access');
      return NextResponse.redirect(dest)
    }

    // If the user is authenticated and trying to access login/register pages, redirect to appropriate dashboard
    const authPaths = ['/login', '/register']
    const isAuthPath = authPaths.some(path => 
      pathname.startsWith(path)
    )

    if (sessionExists && isAuthPath) {
      console.log('[Middleware] Authenticated user accessing auth path, redirecting to dashboard')
      await authLogger.logProtectedRouteAccess(pathname, true, user?.id, user?.email);
      // Redirect all authenticated users to homepage
      const dest = new URL('/homepage', req.url)
      await authLogger.logRedirect(pathname, '/homepage', 'authenticated_user_on_auth_page', user?.id, user?.email);
      return NextResponse.redirect(dest)
    }

    // Store the last visited page for authenticated users (excluding auth paths)
    if (sessionExists && !isAuthPath && !isAsset && pathname !== '/landing-page') {
      console.log('[Middleware] Storing last visited page:', pathname)
      // Set a cookie with the current path
      res.cookies.set('lana_last_visited', pathname, {
        maxAge: 60 * 60 * 24 * 7, // 1 week
        httpOnly: false, // Allow client-side access
        sameSite: 'lax',
        path: '/',
      })
      
      // Also set in a custom header for client-side access as fallback
      res.headers.set('x-last-visited', pathname)
    }

    // First-time onboarding enforcement - ONLY rely on server-side verified user metadata
    // Previously vulnerable to client-side cookie manipulation
    const onboardingComplete = Boolean(user?.user_metadata?.onboarding_complete)
    const hasConsent = Boolean(user?.user_metadata?.consent?.privacyPolicyAccepted && user?.user_metadata?.consent?.termsOfServiceAccepted)
    const isOnboardingRoute = pathname === '/onboarding' || pathname === '/term-plan'
    const role = user?.user_metadata?.role as 'child' | 'guardian' | undefined
    
    // Check if this is a redirect from onboarding completion
    const isOnboardingCompletion = req.nextUrl.searchParams.get('onboardingComplete') === '1'
    
    // Check if user just came from Google OAuth (by checking if they're newly registered via Google)
    const isNewGoogleUser = user && user.app_metadata?.provider === 'google' && !onboardingComplete;
    
    // Enhanced security: Check if user has given explicit consent before allowing access to most routes
    const consentRequiredRoutes = [
      '/dashboard',
      '/guardian',
      '/personalised-ai-tutor',
      '/children',
      '/settings',
      '/homepage'
    ];
    
    const isConsentRequiredRoute = consentRequiredRoutes.some(route => pathname.startsWith(route));
    
    // Redirect to consent form if user hasn't given explicit consent and is accessing a consent-required route
    if (sessionExists && !hasConsent && isConsentRequiredRoute && pathname !== '/onboarding' && pathname !== '/consent') {
      console.log('[Middleware] Authenticated user without explicit consent, redirecting to consent form')
      await authLogger.logRedirect(pathname, '/consent', 'missing_explicit_consent', user?.id, user?.email);
      const returnTo = `${pathname}${url.search}`
      const dest = new URL(`/consent?returnTo=${encodeURIComponent(returnTo)}`, req.url)
      return NextResponse.redirect(dest)
    }
    
    if (sessionExists && !onboardingComplete && !isOnboardingRoute && pathname !== '/term-plan') {
      console.log('[Middleware] Authenticated user with incomplete onboarding, redirecting to onboarding')
      await authLogger.logRedirect(pathname, '/onboarding', 'incomplete_onboarding', user?.id, user?.email);
      const returnTo = `${pathname}${url.search}`
      const dest = new URL(`/onboarding?returnTo=${encodeURIComponent(returnTo)}`, req.url)
      return NextResponse.redirect(dest)
    }
    
    // If onboarding is complete and user is on onboarding page, redirect to term-plan or homepage
    if (sessionExists && onboardingComplete && pathname === '/onboarding') {
      console.log('[Middleware] Onboarding complete but user is on onboarding page, redirecting to term-plan')
      await authLogger.logRedirect(pathname, '/term-plan', 'onboarding_complete_redirect', user?.id, user?.email);
      const dest = new URL('/term-plan', req.url);
      return NextResponse.redirect(dest);
    }
    
    // If onboarding was just completed, redirect to homepage regardless of role
    if (isOnboardingCompletion) {
      console.log('[Middleware] Onboarding just completed, redirecting to homepage')
      await authLogger.logRedirect(pathname, '/homepage', 'onboarding_completed', user?.id, user?.email);
      const dest = new URL('/homepage', req.url)
      return NextResponse.redirect(dest)
    }
    
    // Additional check: if user is authenticated and on term-plan but onboarding is complete, redirect to homepage
    if (sessionExists && pathname === '/term-plan' && onboardingComplete) {
      console.log('[Middleware] User has completed onboarding, redirecting term-plan to homepage')
      await authLogger.logRedirect(pathname, '/homepage', 'completed_onboarding_term_plan_redirect', user?.id, user?.email);
      const dest = new URL('/homepage', req.url);
      return NextResponse.redirect(dest);
    }
    
    // Additional check for onboarding complete state based on cookies as fallback
    const isOnboardingCompleteCookie = req.cookies.get('lana_onboarding_complete');
    if (sessionExists && pathname === '/onboarding' && isOnboardingCompleteCookie && isOnboardingCompleteCookie.value === '1') {
      console.log('[Middleware] User has onboarding complete cookie, redirecting to homepage')
      await authLogger.logRedirect(pathname, '/homepage', 'onboarding_complete_cookie_redirect', user?.id, user?.email);
      const dest = new URL('/homepage', req.url);
      return NextResponse.redirect(dest);
    }
    
    // If user is a new Google user, ensure they go through onboarding
    if (sessionExists && isNewGoogleUser && pathname !== '/onboarding') {
      console.log('[Middleware] New Google user detected, redirecting to onboarding')
      await authLogger.logRedirect(pathname, '/onboarding', 'new_google_user_redirect', user?.id, user?.email);
      const returnTo = `${pathname}${url.search}`
      const dest = new URL(`/onboarding?returnTo=${encodeURIComponent(returnTo)}&newGoogleUser=1`, req.url)
      return NextResponse.redirect(dest)
    }

    // If authenticated and trying to access the landing page, send to last visited page or homepage
    if (sessionExists && pathname === '/landing-page') {
      console.log('[Middleware] Authenticated user accessing landing page, redirecting to last visited or homepage')
      
      // Try to get last visited from cookies
      const lastVisitedCookie = req.cookies.get('lana_last_visited')?.value;
      
      // Redirect to last visited page if available and not an auth page, otherwise homepage
      const redirectPath = lastVisitedCookie && 
                           !lastVisitedCookie.startsWith('/login') && 
                           !lastVisitedCookie.startsWith('/register') && 
                           !lastVisitedCookie.startsWith('/auth') && 
                           lastVisitedCookie !== '/landing-page' ? 
                           lastVisitedCookie : '/homepage';
      
      // Prevent redirect loops by checking if we're already redirecting to the same place
      if (redirectPath === '/landing-page') {
        console.log('[Middleware] Preventing redirect loop, sending to homepage');
        await authLogger.logRedirect(pathname, '/homepage', 'prevent_redirect_loop', user?.id, user?.email);
        const dest = new URL('/homepage', req.url);
        return NextResponse.redirect(dest);
      }
      
      await authLogger.logRedirect(pathname, redirectPath, 'authenticated_landing_page_access', user?.id, user?.email);
      const dest = new URL(redirectPath, req.url)
      return NextResponse.redirect(dest)
    }

    // If authenticated and hitting root, redirect to last visited page or homepage
    if (sessionExists && pathname === '/') {
      console.log('[Middleware] Authenticated user accessing root, redirecting to last visited or homepage')
      
      // Try to get last visited from cookies
      const lastVisitedCookie = req.cookies.get('lana_last_visited')?.value;
      
      // Redirect to last visited page if available and not an auth page, otherwise homepage
      const redirectPath = lastVisitedCookie && 
                           !lastVisitedCookie.startsWith('/login') && 
                           !lastVisitedCookie.startsWith('/register') && 
                           !lastVisitedCookie.startsWith('/auth') && 
                           lastVisitedCookie !== '/landing-page' ? 
                           lastVisitedCookie : '/homepage';
      
      // Prevent redirect loops by checking if we're already redirecting to the same place
      if (redirectPath === '/' || redirectPath === '/landing-page') {
        console.log('[Middleware] Preventing redirect loop, sending to homepage');
        await authLogger.logRedirect(pathname, '/homepage', 'prevent_redirect_loop', user?.id, user?.email);
        const dest = new URL('/homepage', req.url);
        return NextResponse.redirect(dest);
      }
      
      await authLogger.logRedirect(pathname, redirectPath, 'authenticated_root_access', user?.id, user?.email);
      const dest = new URL(redirectPath, req.url)
      return NextResponse.redirect(dest)
    }

    // Role-based normalization
    if ((pathname.startsWith('/guardian') || pathname.startsWith('/children')) && role !== 'guardian') {
      console.log('[Middleware] Non-guardian user accessing guardian/children path, redirecting to landing page')
      await authLogger.logRedirect(pathname, '/landing-page', 'role_mismatch_guardian_path', user?.id, user?.email);
      const dest = new URL('/landing-page', req.url)
      return NextResponse.redirect(dest)
    }

    // Log successful middleware pass-through
    console.log('[Middleware] All checks passed, allowing request to proceed')
    
    // Otherwise allow
    return res
  } catch (error) {
    // On any middleware error, redirect to landing page
    // Prevent infinite redirect loops by checking if we're already on the landing page
    console.error('[middleware] error:', error)
    // Add error tracking
    try {
      // Log error details for debugging
      console.error('[middleware] detailed error info:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        url: req?.nextUrl?.pathname,
        timestamp: new Date().toISOString()
      });
      
      // Log the error using our auth logger
      await authLogger.error('AUTH_ERROR', 'Middleware error occurred', {
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          url: req?.nextUrl?.pathname,
          timestamp: new Date().toISOString()
        }
      });
    } catch (logError) {
      console.error('[middleware] failed to log error details:', logError);
    }
    
    // Redirect to landing page as fallback, but prevent infinite loops
    const currentPath = req.nextUrl.pathname;
    if (currentPath === '/landing-page') {
      console.log('[Middleware] Already on landing page, returning next to prevent redirect loop');
      return NextResponse.next();
    }
    
    try {
      return NextResponse.redirect(new URL('/landing-page', req.url))
    } catch (redirectError) {
      console.error('[middleware] failed to redirect to landing page:', redirectError);
      // If redirect fails, return the original response
      return NextResponse.next();
    }
  }
}

// Limit middleware to app routes, excluding assets
export const config = {
  // Apply to all non-asset routes; internal public checks happen above
  // Also exclude typical files with extensions using a broad pattern
  matcher: ['/((?!_next|api|images|favicon.ico).*)'],
}