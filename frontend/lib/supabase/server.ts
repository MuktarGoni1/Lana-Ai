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
                // Handle base64 encoded values by decoding them first if needed
                let processedValue = value;
                if (value.startsWith('base64-')) {
                  try {
                    processedValue = Buffer.from(value.substring(7), 'base64').toString('utf8');
                  } catch (decodeError) {
                    console.warn(`Failed to decode base64 cookie ${name}:`, decodeError);
                    // Fall back to original value if decoding fails
                    processedValue = value;
                  }
                }
                cookieStore.set(name, processedValue, options)
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