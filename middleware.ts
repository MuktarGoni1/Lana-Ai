import { NextResponse, type NextRequest } from "next/server";

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

const PUBLIC_API_PREFIXES = ["/api/contact", "/api/newsletter"];

function isProtectedPath(pathname: string) {
  return PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const projectRef =
    supabaseUrl.match(/^https:\/\/([^.]+)\.supabase\.co/i)?.[1] ?? "";

  const authCookieBase = projectRef ? `sb-${projectRef}-auth-token` : "";
  const isAuthenticated = authCookieBase
    ? request.cookies.getAll().some(({ name }) =>
        name === authCookieBase || name.startsWith(`${authCookieBase}.`)
      )
    : false;

  if (!isAuthenticated && pathname.startsWith("/api/")) {
    const isPublicApi = PUBLIC_API_PREFIXES.some((prefix) =>
      pathname.startsWith(prefix)
    );
    if (!isPublicApi) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
  }

  if (!isAuthenticated && isProtectedPath(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
