import 'server-only'
import { createClient } from '@supabase/supabase-js'

/**
 * Lazily instantiate the Supabase admin client.
 * Avoids throwing at import-time during build when envs are absent.
 */
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  // Log environment variable status for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('[SupabaseAdmin] Environment variables status:', {
      url: url ? 'SET' : 'NOT SET',
      serviceKey: serviceKey ? 'SET' : 'NOT SET',
      serviceKeyLength: serviceKey ? serviceKey.length : 0
    });
  }
  
  if (!url || !serviceKey) {
    const error = new Error('Missing Supabase env vars on server')
    console.error('[SupabaseAdmin] Error:', error.message, {
      url: url ? 'SET' : 'NOT SET',
      serviceKey: serviceKey ? 'SET' : 'NOT SET'
    });
    throw error;
  }
  
  return createClient(url, serviceKey)
}