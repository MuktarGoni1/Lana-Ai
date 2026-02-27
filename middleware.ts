import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * LanaMind Middleware
 *
 * Philosophy: get users to the dashboard. Don't block them.
 *
 * Rules:
 *   1. Public routes are always accessible — no session needed
 *   2. Authenticated users can go anywhere
 *   3. Unauthenticated users trying to reach protected pages ? /login
 *   4. Unauthenticated users trying to reach /api/* ? 401
 *   5. NEVER redirect based on missing profile data (age, grade, etc.)
 *      That's the dashboard's job to handle with inline prompts.
 */

// Routes anyone can visit — logged in or not
const PUBLIC_ROUTES = [
  "/",               // landing page if not logged in, dashboard if logged in
  "/login",
  "/register",
  "/onboarding",
  "/landing-page",
  "/child-login",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
];

// Routes only logged-in users can visit
const PROTECTED_ROUTES = [
  "/dashboard",
  "/lesson",
  "/subject",
  "/term-plan",
  "/quiz",
  "/progress",
  "/settings",
  "/video-explainer",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow static assets and Next internals through
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Build response object — Supabase SSR needs to read/set cookies
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh session — this keeps the token alive
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isAuthenticated = !!session?.user;

  // -- Unauthenticated API requests ? 401 --------------------------
  if (!isAuthenticated && pathname.startsWith("/api/")) {
    // Allow public API routes through
    const publicApiRoutes = ["/api/contact", "/api/newsletter"];
    if (!publicApiRoutes.some((r) => pathname.startsWith(r))) {
      return new NextResponse(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  // -- Unauthenticated ? redirect to login for protected routes ----
  if (!isAuthenticated) {
    const isProtected = PROTECTED_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(route + "/")
    );
    if (isProtected) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    // All other routes: let them through (public pages, landing, etc.)
    return response;
  }

  // -- Authenticated users ------------------------------------------
  // Logged-in users visiting /login or /register ? send to dashboard
  if (pathname === "/login" || pathname === "/register") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Everything else: let them through — dashboard handles missing data
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};


