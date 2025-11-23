import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/server'

export default async function Homepage() {
  const user = await getCurrentUser()
  
  // Log for debugging
  console.log('[Homepage] User authentication status:', {
    isAuthenticated: !!user,
    userId: user?.id,
    email: user?.email,
    userMetadata: user?.user_metadata
  })
  
  // If user is not authenticated, redirect to landing page
  if (!user) {
    console.log('[Homepage] User not authenticated, redirecting to landing page')
    redirect('/landing-page')
  }
  
  // Check if user has completed onboarding
  const onboardingComplete = Boolean(user.user_metadata?.onboarding_complete)
  
  // Log onboarding status
  console.log('[Homepage] Onboarding status:', {
    onboardingComplete,
    userMetadata: user.user_metadata
  })
  
  // If onboarding is not complete, redirect to term-plan for onboarding
  if (!onboardingComplete) {
    console.log('[Homepage] Onboarding not complete, redirecting to term-plan')
    redirect('/term-plan?onboarding=1')
  }
  
  // If user is authenticated and onboarding is complete, stay on homepage for all users
  console.log('[Homepage] User has completed onboarding, staying on homepage')
  return (
    <div>
      <h1>Welcome to your dashboard</h1>
      <p>You are successfully logged in.</p>
    </div>
  )
}