/**
 * Navigation utility with fallback mechanisms for error handling
 * Ensures users can always reach the homepage even during backend failures
 */

import { User } from '@supabase/supabase-js';
import { handleErrorWithReload } from './error-handler';

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
        
    // Validate the path before redirecting
    try {
      const url = new URL(targetPath, typeof window !== 'undefined' ? window.location.origin : '');
          
      // Navigate to target path
      if (router && typeof router.replace === 'function') {
        router.replace(url.pathname);
      } else {
        // Fallback: use window.location
        if (typeof window !== 'undefined') {
          window.location.assign(url.pathname);
        }
      }
    } catch (e) {
      console.error('[Navigation] Invalid path for homepage redirect:', e);
      // Last resort fallback
      if (typeof window !== 'undefined') {
        window.location.href = targetPath;
      }
    }
  } catch (error) {
    console.error('[Navigation] Error during navigation:', error);
    // Use our error handler to reload the page instead of redirecting to landing page
    handleErrorWithReload(error, "Navigation failed. Reloading page to try again...");
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
        try {
          const url = new URL('/term-plan?onboarding=1', typeof window !== 'undefined' ? window.location.origin : '');
          if (router && typeof router.push === 'function') {
            router.push(url.pathname + url.search);
          } else {
            // Fallback: use window.location
            if (typeof window !== 'undefined') {
              window.location.assign(url.pathname + url.search);
            }
          }
        } catch (e) {
          console.error('[Navigation] Invalid path for onboarding to term-plan redirect:', e);
          // Fallback to homepage
          navigateToHomepage(user, router);
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
    // Use our error handler to reload the page instead of redirecting
    handleErrorWithReload(error, "Navigation to next step failed. Reloading page to try again...");
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
  
  try {
    // Navigate to homepage
    navigateToHomepage(user, router);
  } catch (error) {
    console.error('[Navigation] Error during skip navigation:', error);
    // Use our error handler to reload the page instead of redirecting
    handleErrorWithReload(error, "Skip navigation failed. Reloading page to try again...");
  }
}