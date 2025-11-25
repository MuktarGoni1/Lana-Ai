import { createBrowserClient } from '@supabase/ssr'
import { env } from './env'
import { Database } from '@/types/supabase'

const url = env.SUPABASE_URL!
const key = env.SUPABASE_ANON_KEY!

// Validate environment variables
if (!url || !key) {
  throw new Error('Missing Supabase environment variables')
}

console.log('[db.ts] Initializing Supabase client')
console.log('[db.ts] Supabase URL:', url)

// Create Supabase client with proper configuration
const supabase = createBrowserClient<Database>(url, key, {
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

// Add debugging
console.log('[db.ts] Supabase client created successfully')
console.log('[db.ts] Supabase auth object type:', typeof supabase.auth)
if (supabase.auth) {
  console.log('[db.ts] signInWithOAuth property:', supabase.auth.signInWithOAuth)
  console.log('[db.ts] typeof signInWithOAuth:', typeof supabase.auth.signInWithOAuth)
  
  // List all available methods
  const authMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(supabase.auth)).filter(
    name => typeof (supabase.auth as any)[name] === 'function'
  )
  console.log('[db.ts] Available auth methods:', authMethods)
  
  // Check if signInWithOAuth exists
  if (typeof supabase.auth.signInWithOAuth !== 'function') {
    console.warn('[db.ts] signInWithOAuth method is not available on supabase.auth')
    console.warn('[db.ts] This might be due to the Supabase client configuration')
    
    // Try to find alternative methods
    const alternativeMethods = authMethods.filter(method => 
      method.toLowerCase().includes('oauth') || 
      method.toLowerCase().includes('signin') ||
      method.toLowerCase().includes('login')
    )
    console.log('[db.ts] Potential alternative methods:', alternativeMethods)
  }
}

export { supabase }