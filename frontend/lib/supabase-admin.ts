import 'server-only'

import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  throw new Error('Missing Supabase env vars on server')
}

// Server-only Supabase admin client
export const supabaseAdmin = createClient(url, serviceKey)