import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    const isPro = Boolean(session?.user?.user_metadata?.is_pro || session?.user?.user_metadata?.pro);
    return NextResponse.json({ is_pro: isPro }, { status: 200 });
  } catch (e: unknown) {
    return NextResponse.json({ is_pro: false }, { status: 200 });
  }
}