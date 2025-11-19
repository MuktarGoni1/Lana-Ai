import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/server'

export default async function Homepage() {
  const user = await getCurrentUser()
  
  // If user is not authenticated, redirect to landing page
  if (!user) {
    redirect('/landing-page')
  }
  
  // If user is authenticated, redirect to appropriate dashboard
  const role = user.user_metadata?.role
  if (role === 'child') {
    redirect('/personalised-ai-tutor')
  } else if (role === 'guardian') {
    redirect('/guardian')
  } else {
    redirect('/term-plan')
  }
}