/**
 * Navigation utility with fallback mechanisms for error handling
 * Ensures users can always reach the homepage even during backend failures
 */

import { User } from '@supabase/supabase-js';

/**
 * Navigate to the appropriate homepage based on user role
 * @param user - The authenticated user object
 * @param router - Next.js router instance
 */
export function navigateToHomepage(user: User | null, router: any) {
  try {
    // Log navigation attempt
    console.log('[Navigation] Attempting to navigate to homepage', {
      userId: user?.id,
      email: user?.email,
      userMetadata: user?.user_metadata
    });

    // If user is not authenticated, go to landing page
    if (!user) {
      console.log('[Navigation] No user found, redirecting to landing page');
      if (router && typeof router.replace === 'function') {
        router.replace('/landing-page');
      } else {
        // Fallback: use window.location
        if (typeof window !== 'undefined') {
          window.location.assign('/landing-page');
        }
      }
      return;
    }

    // Navigate all authenticated users to homepage
    console.log('[Navigation] Redirecting authenticated user to homepage');
    const targetPath = '/homepage';

    // Navigate to target path
    if (router && typeof router.replace === 'function') {
      router.replace(targetPath);
    } else {
      // Fallback: use window.location
      if (typeof window !== 'undefined') {
        window.location.assign(targetPath);
      }
    }
  } catch (error) {
    console.error('[Navigation] Error during navigation:', error);
    // Fallback: always go to landing page if there's an error (not homepage to avoid loops)
    try {
      if (router && typeof router.replace === 'function') {
        router.replace('/landing-page');
      } else if (router && typeof router.push === 'function') {
        router.push('/landing-page');
      } else if (typeof window !== 'undefined') {
        window.location.assign('/landing-page');
      }
    } catch (fallbackError) {
      // Try push as last resort before window.location
      try {
        if (router && typeof router.push === 'function') {
          router.push('/landing-page');
        } else if (typeof window !== 'undefined') {
          window.location.assign('/landing-page');
        }
      } catch (lastResortError) {
        console.error('[Navigation] Error during last resort navigation:', lastResortError);
        // Final fallback: do nothing, let the user manually navigate
      }
    }
  }
}

/**
 * Navigate to the next step in onboarding with fallback to homepage
 * @param router - Next.js router instance
 * @param currentStep - Current onboarding step
 * @param user - The authenticated user object
 */
export function navigateToNextStep(router: any, currentStep: string, user: User | null) {
  try {
    console.log('[Navigation] Navigating to next step from:', currentStep);
    
    switch (currentStep) {
      case 'onboarding':
        // From onboarding, go to term-plan
        if (router && typeof router.push === 'function') {
          router.push('/term-plan?onboarding=1');
        } else {
          // Fallback: use window.location
          if (typeof window !== 'undefined') {
            window.location.assign('/term-plan?onboarding=1');
          }
        }
        break;
        
      case 'term-plan':
        // From term-plan, go to homepage
        navigateToHomepage(user, router);
        break;
        
      default:
        // Fallback: always go to homepage
        navigateToHomepage(user, router);
        break;
    }
  } catch (error) {
    console.error('[Navigation] Error during step navigation:', error);
    // Fallback: always go to homepage if there's an error
    navigateToHomepage(user, router);
  }
}

/**
 * Skip current step and go directly to homepage
 * @param router - Next.js router instance
 * @param user - The authenticated user object
 */
export function skipToHomepage(router: any, user: User | null) {
  console.log('[Navigation] Skipping to homepage');
  // Mark that the user skipped onboarding (optional)
  try {
    // We could store this in localStorage for analytics if needed
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('onboardingSkipped', 'true');
    }
  } catch (e) {
    console.warn('[Navigation] Could not store skip preference:', e);
  }
  
  // Navigate to homepage
  navigateToHomepage(user, router);
}