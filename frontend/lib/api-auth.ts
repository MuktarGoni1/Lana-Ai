// Simple API authentication helper
// Verifies the user is authenticated via Supabase session cookie

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function requireAuth() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          // Read-only in this context
        },
        remove(name: string, options: any) {
          // Read-only in this context
        },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { 
      error: 'Unauthorized',
      message: 'You must be signed in to access this resource'
    },
    { status: 401 }
  );
}
