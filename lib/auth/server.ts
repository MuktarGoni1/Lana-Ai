import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

/**
 * Server-side utility to get the current authenticated user
 * @returns The authenticated user or null if not authenticated
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const supabase = await createServerClient()
    // Use getUser() for secure user data instead of relying on session.user directly
    const { data: { user }, error } = await supabase.auth.getUser()
    if (!error && user) {
      return user
    }
    return null
  } catch (error) {
    console.error('Error getting current user:', error)
    // If there's a connection timeout or network error, we should still check
    // if there's a session cookie that indicates the user might be authenticated
    return null
  }
}

/**
 * Server-side utility to require authentication
 * Redirects to login if user is not authenticated
 * @returns The authenticated user
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }
  return user
}

/**
 * Server-side utility to redirect authenticated users
 * Redirects to appropriate dashboard if user is already authenticated
 */
export async function redirectIfAuthenticated(): Promise<void> {
  const user = await getCurrentUser()
  if (user) {
    // Check if user has completed onboarding
    const onboardingComplete = Boolean(user.user_metadata?.onboarding_complete)
    
    // If onboarding is not complete, redirect to term-plan for onboarding
    if (!onboardingComplete) {
      redirect('/term-plan?onboarding=1')
      return
    }
    
    // Redirect all authenticated users to homepage
    redirect('/homepage')
  }
}