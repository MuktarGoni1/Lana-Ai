import { NextRequest } from 'next/server';
import { supabase } from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const next = request.nextUrl.searchParams.get('next') || '/onboarding';

  if (!code) {
    return new Response('No authorization code received from Google', { status: 400 });
  }

  try {
    // Exchange the authorization code for tokens
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Google OAuth error:', error);
      return new Response('Authentication failed', { status: 400 });
    }

    // Check if user is completing onboarding by checking their state
    const user = data.user;
    
    // Check if this is a new user (first time signing in with Google)
    const isNewUser = !user.user_metadata?.onboarding_complete;

    // Set a temporary flag in cookies to indicate this is a Google signup
    // This will be used by the frontend to know to show the onboarding flow
    const cookieStore = await cookies();
    if (isNewUser) {
      cookieStore.set('lana_google_signup', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 10, // 10 minutes
        path: '/',
      });
    }

    // Redirect to onboarding for all new users, or to the intended destination
    const redirectUrl = isNewUser ? '/onboarding' : next;
    
    return Response.redirect(new URL(redirectUrl, request.url));
  } catch (error) {
    console.error('Unexpected Google OAuth error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}