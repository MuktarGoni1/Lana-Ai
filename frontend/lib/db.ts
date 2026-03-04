import { createClient } from '@supabase/supabase-js'
import { env } from './env'
import { Database } from '@/types/supabase'

const url = env.SUPABASE_URL!
const key = env.SUPABASE_ANON_KEY!

// Validate environment variables
if (!url || !key) {
  throw new Error('Missing Supabase environment variables')
}

// Only log in development environment
if (process.env.NODE_ENV !== 'production') {
  console.log('[db.ts] Initializing Supabase client')
  console.log('[db.ts] Supabase URL:', url)
}

// Create Supabase client with proper configuration
const supabase = createClient<Database>(url, key, {
  auth: {
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'X-Client-Info': 'lana-ai-web'
    }
  }
})

// Add debugging only in development
if (process.env.NODE_ENV !== 'production') {
  console.log('[db.ts] Supabase client created successfully')
  console.log('[db.ts] Supabase auth object type:', typeof supabase.auth)
  if (supabase.auth) {
    console.log('[db.ts] onAuthStateChange property:', supabase.auth.onAuthStateChange)
    console.log('[db.ts] typeof onAuthStateChange:', typeof supabase.auth.onAuthStateChange)
  }
}

export { supabase }