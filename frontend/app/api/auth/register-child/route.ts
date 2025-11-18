import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { childEmail, guardianEmail, nickname, age, grade } = body

    // Validate required fields
    if (!childEmail || !guardianEmail || !nickname || !age || !grade) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'All fields are required'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // Validate email formats
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(childEmail) || !emailRegex.test(guardianEmail)) {
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

      // Generate unique IDs
      const child_uid = crypto.randomUUID()
      const password = crypto.randomUUID()

      // Create the auth user
      const { data, error: signUpError } = await adminClient.auth.signUp({
        email: childEmail,
        password: password,
        options: {
          data: { role: "child", nickname, age, grade, guardian_email: guardianEmail },
          emailRedirectTo: `${request.headers.get('origin')}/auth/confirmed/child`,
        }
      })

      if (signUpError) {
        console.error('[API Register Child] Supabase Auth error:', signUpError)
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Failed to create account'
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )
      }

      // Store child row in users table (if it exists)
      try {
        const { error: insertError } = await adminClient.from("users").insert({
          id: child_uid,
          email: childEmail,
          user_metadata: { 
            role: "child", 
            nickname, 
            age, 
            grade, 
            guardian_email: guardianEmail 
          },
        })
        
        if (insertError) {
          console.warn('[API Register Child] Failed to create user record:', insertError)
          // Don't throw here as the auth was successful
        }
      } catch (tableError) {
        // If the users table doesn't exist, that's okay
        console.debug('[API Register Child] Users table may not exist, continuing without it:', tableError)
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Account created successfully',
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
      console.error('[API Register Child] Unexpected error:', error)
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
    console.error('[API Register Child] Request parsing error:', error)
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