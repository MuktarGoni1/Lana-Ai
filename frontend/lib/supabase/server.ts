import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { type CookieOptions } from '@supabase/ssr'

export async function createServerClient() {
  const cookieStore = await cookies()
  
  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          try {
            return cookieStore.getAll()
          } catch (error) {
            console.error('Error getting cookies:', error)
            return []
          }
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Validate that the value is a valid string before setting
              if (typeof value === 'string') {
                // Preserve Supabase-managed cookie payload format as-is.
                cookieStore.set(name, value, options)
              } else {
                console.warn(`Invalid cookie value for ${name}:`, value)
              }
            })
          } catch (error) {
            // Handle cookie setting errors in server components
            console.error('Error setting cookies:', error)
          }
        },
      },
    }
  )
}