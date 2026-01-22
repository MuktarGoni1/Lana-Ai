import { NextRequest } from 'next/server';
import { supabase } from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { email, redirectTo = '/onboarding' } = await request.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if user exists in Supabase Auth
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    // Send magic link
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        // Don't create user if they don't exist - this prevents unauthorized account creation
        shouldCreateUser: false,
        emailRedirectTo: `${request.nextUrl.origin}/api/auth/magic-link/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
      },
    });

    if (error) {
      console.error('Magic link error:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send magic link. Please check your email and try again.' 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Magic link sent successfully. Please check your email.' 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected magic link error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}