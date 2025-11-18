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

      // Sign in with OTP (this will send the magic link)
      const { data, error } = await adminClient.auth.signInWithOtp({
        email: email.trim(),
        options: {
          data: { role: "guardian" },
          emailRedirectTo: `${request.headers.get('origin')}/term-plan?onboarding=1`,
        },
      })

      if (error) {
        console.error('[API Register Parent] Supabase Auth error:', error)
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Failed to send magic link'
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )
      }

      // Also create a record in the guardians table
      const { error: insertError } = await adminClient.from("guardians").upsert({
        email: email.trim(),
        weekly_report: true,
        monthly_report: false,
      }, { onConflict: 'email' })
      
      if (insertError) {
        console.warn('[API Register Parent] Failed to create guardian record:', insertError)
        // Don't throw here as the auth was successful
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Magic link sent successfully',
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
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Unexpected error during registration'
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