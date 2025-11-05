// This file is deprecated. Use lib/supabase/client.ts and lib/supabase/server.ts instead.
// Keeping for backward compatibility but should be removed in future versions.

import { createClient } from '@supabase/supabase-js'
import { env } from './env'

// Ensure we're in a browser environment before initializing
let supabase: ReturnType<typeof createClient> | null = null;

if (typeof window !== 'undefined') {
  // Validate environment variables on the client side
  try {
    const url = env.SUPABASE_URL
    const key = env.SUPABASE_ANON_KEY
    
    if (url && key) {
      supabase = createClient(url, key)
    } else {
      console.warn('[db] Supabase URL or key is missing')
    }
  } catch (error) {
    console.error('[db] Error initializing Supabase client:', error)
  }
}

export { supabase }