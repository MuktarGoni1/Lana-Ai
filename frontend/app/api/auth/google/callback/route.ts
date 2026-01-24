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

    // Update user metadata to set role if not already set
    if (!user.user_metadata?.role) {
      // Determine role based on email pattern - Google users are typically parents
      const role = user.email?.includes('@child.lana') ? 'child' : 'guardian';
      
      // Update user metadata to include role
      const { error: updateError } = await supabase.auth.updateUser({
        data: { 
          ...user.user_metadata,
          role,
          onboarding_complete: false // Mark as incomplete to force onboarding
        }
      });
      
      if (updateError) {
        console.error('Error updating user metadata:', updateError);
      }
    } else {
      // If user already has a role, make sure onboarding_complete is set appropriately
      if (!user.user_metadata?.onboarding_complete) {
        const { error: updateError } = await supabase.auth.updateUser({
          data: { 
            ...user.user_metadata,
            onboarding_complete: false
          }
        });
        
        if (updateError) {
          console.error('Error updating onboarding status:', updateError);
        }
      }
    }

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
        
    // Ensure the redirect URL is valid before redirecting
    let finalRedirectUrl;
    try {
      // Make sure we're constructing a proper absolute URL
      const baseUrl = request.url.split('/api/auth/google/callback')[0];
      
      // Validate the redirect URL
      if (!redirectUrl || redirectUrl === 'null' || redirectUrl === 'undefined') {
        console.error('Invalid redirect URL detected:', redirectUrl);
        // Fallback to onboarding if the URL is invalid
        finalRedirectUrl = new URL('/onboarding', baseUrl);
      } else {
        finalRedirectUrl = new URL(redirectUrl, baseUrl);
      }
            
      // Ensure we add the onboardingComplete param if needed for existing users
      if (redirectUrl !== '/onboarding' && !isNewUser) {
        finalRedirectUrl.searchParams.set('onboardingComplete', '1');
      }
    } catch (error) {
      console.error('Invalid redirect URL:', redirectUrl, 'Error:', error);
      // Fallback to onboarding if the URL is invalid
      const baseUrl = request.url.split('/api/auth/google/callback')[0];
      finalRedirectUrl = new URL('/onboarding', baseUrl);
    }
        
    return Response.redirect(finalRedirectUrl);
  } catch (error) {
    console.error('Unexpected Google OAuth error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}