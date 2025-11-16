import 'server-only'
import { createClient } from '@supabase/supabase-js'

/**
 * Lazily instantiate the Supabase admin client.
 * Avoids throwing at import-time during build when envs are absent.
 */
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Missing Supabase env vars on server')
  }
  return createClient(url, serviceKey)
}