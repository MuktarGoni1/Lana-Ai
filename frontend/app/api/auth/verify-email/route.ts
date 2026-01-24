import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
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

    const cookieStore = await cookies();
    const supabase = await createServerClient();

    // Check if user exists in Supabase Auth
    // Since Supabase doesn't expose a direct way to check if an email exists without authentication,
    // we'll use a different approach - we'll try to send a magic link and handle the response accordingly
    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        shouldCreateUser: false, // This will fail if the user doesn't exist
      },
    });

    // If we get an error saying the user doesn't exist, that's fine for our verification
    if (error) {
      if (error.message.includes('Unable to validate email') || error.message.includes('does not exist')) {
        // User doesn't exist
        return new Response(
          JSON.stringify({ 
            exists: false, 
            confirmed: false,
            message: 'Email does not exist in our system' 
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } else {
        // Some other error occurred
        return new Response(
          JSON.stringify({ 
            exists: false, 
            confirmed: false,
            error: error.message 
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } } // Return 200 to distinguish from server errors
        );
      }
    }

    // If we got here without an error, the user exists
    // But we don't actually want to send the OTP, so we'll return that the user exists
    return new Response(
      JSON.stringify({ 
        exists: true, 
        confirmed: true, // For this simplified implementation, we assume if user exists, email is confirmed
        message: 'Email exists in our system' 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Unexpected error in verify-email API:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}