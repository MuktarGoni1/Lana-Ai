import { createBrowserClient } from '@supabase/ssr'
import { env } from '@/lib/env'
import { Database } from '@/types/supabase'

export function createClient() {
  try {
    return createBrowserClient<Database>(
      env.SUPABASE_URL!,
      env.SUPABASE_ANON_KEY!
    )
  } catch (error) {
    console.error('Error creating Supabase client:', error)
    throw error
  }
}