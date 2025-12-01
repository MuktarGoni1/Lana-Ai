import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Email is required'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid email format'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
        }
        }
      )
    }

    try {
      // Initialize Supabase admin client
      const adminClient = getSupabaseAdmin()

      // First, create a record in the guardians table
      const { error: insertError } = await adminClient.from("guardians").upsert({
        email: email.trim(),
        weekly_report: true,
        monthly_report: false,
      }, { onConflict: 'email' })
      
      if (insertError) {
        console.warn('[API Register Parent] Failed to create guardian record:', insertError)
        // Don't throw here as we still want to proceed with authentication
      } else {
        console.log('[API Register Parent] Successfully created guardian record')
      }
      
      if (insertError) {
        console.warn('[API Register Parent] Failed to create guardian record:', insertError)
        // Don't throw here as we still want to proceed with authentication
      }

      // Sign in with OTP (this will send the magic link)
      const { data, error } = await adminClient.auth.signInWithOtp({
        email: email.trim(),
        options: {
          data: { role: "guardian" },
          emailRedirectTo: `${request.headers.get('origin')}/auth/confirmed/guardian`,
        },
      })

      if (error) {
        console.error('[API Register Parent] Supabase Auth error:', error)
        
        // Try to provide more specific error messages
        let message = 'Failed to send magic link';
        if (error.message?.includes('Email rate limit exceeded')) {
          message = 'Too many requests. Please wait before trying again.';
        } else if (error.message?.includes('Invalid email')) {
          message = 'Invalid email address provided.';
        }
        
        return new Response(
          JSON.stringify({
            success: false,
            message
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Magic link sent successfully. Please check your email.',
          data
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    } catch (error: any) {
      console.error('[API Register Parent] Unexpected error:', error)
      
      // Provide more specific error messages based on error type
      let message = 'Unexpected error during registration';
      if (error instanceof Error) {
        if (error.message?.includes('NetworkError')) {
          message = 'Network error. Please check your connection and try again.';
        } else if (error.message?.includes('Timeout')) {
          message = 'Request timeout. Please try again.';
        }
      }
      
      return new Response(
        JSON.stringify({
          success: false,
          message
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }
  } catch (error: any) {
    console.error('[API Register Parent] Request parsing error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Invalid request format'
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
  }
}