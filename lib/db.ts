import { createBrowserClient } from '@supabase/ssr'
import { env } from './env'
import { Database } from '@/types/supabase'

const url = env.SUPABASE_URL!
const key = env.SUPABASE_ANON_KEY!

// Add error handling for the Supabase client creation
let supabase: ReturnType<typeof createBrowserClient<Database>>;

try {
  supabase = createBrowserClient<Database>(url, key, {
    auth: {
      // Handle cookie parsing errors more gracefully
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      headers: {
        'X-Client-Info': 'lana-ai-web'
      }
    }
  });
} catch (error) {
  console.error('Error creating Supabase client:', error);
  throw error;
}

export { supabase };