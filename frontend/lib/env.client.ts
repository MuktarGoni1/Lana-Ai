// Client-side environment variable validation
// This file should only be imported in client components

export const clientEnv = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  API_BASE: process.env.NEXT_PUBLIC_API_BASE,
} as const

// Validate required environment variables on the client side
export function validateClientEnv() {
  const required = [
    { key: 'NEXT_PUBLIC_SUPABASE_URL', value: clientEnv.SUPABASE_URL },
    { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', value: clientEnv.SUPABASE_ANON_KEY },
  ]

  const missing = required.filter(({ value }) => !value)
  
  if (missing.length > 0) {
    const missingKeys = missing.map(({ key }) => key).join(', ')
    console.warn(`[client-env] Missing environment variables: ${missingKeys}`)
  }

  return true
}