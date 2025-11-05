// lib/supabase/middleware.ts - Route Protection
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protect dashboard routes
  if (req.nextUrl.pathname.startsWith('/homepage') && !session) {
    return NextResponse.redirect(new URL('/landing-page', req.url));
  }

  // Protect settings routes
  if (req.nextUrl.pathname.startsWith('/settings') && !session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return res;
}

export const config = {
  matcher: ['/homepage/:path*', '/settings/:path*'],
};