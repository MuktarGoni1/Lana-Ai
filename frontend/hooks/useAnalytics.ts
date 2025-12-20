import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { activityTracker, EventType } from '../lib/tracking/activity-tracker';
import { useUnifiedAuth } from '../contexts/UnifiedAuthContext';

interface TrackEventOptions {
  metadata?: Record<string, any>;
  userId?: string;
}

// Hook to track page views automatically
export function usePageTracking() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useUnifiedAuth();

  useEffect(() => {
    // Set user ID in activity tracker when user is authenticated
    if (user?.id) {
      activityTracker.setUserId(user.id);
    }

    // Track page view
    const url = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    activityTracker.trackPageView(url);
  }, [pathname, searchParams, user?.id]);
}

// Main analytics hook
export function useAnalytics() {
  const { user } = useUnifiedAuth();

  // Initialize analytics with user ID
  useEffect(() => {
    if (user?.id) {
      activityTracker.setUserId(user.id);
    }
  }, [user?.id]);

  // Track custom events
  const trackEvent = (eventType: EventType, options: TrackEventOptions = {}) => {
    activityTracker.track(eventType, {
      ...options.metadata,
      userId: options.userId || user?.id || 'anonymous'
    });
  };

  // Track authentication events
  const trackAuthAttempt = (method: string) => {
    trackEvent('auth_attempt', {
      metadata: { method }
    });
  };

  const trackAuthSuccess = (method: string) => {
    trackEvent('auth_success', {
      metadata: { method }
    });
  };

  const trackAuthFailure = (method: string, error: string) => {
    trackEvent('auth_failure', {
      metadata: { method, error }
    });
  };

  // Track onboarding events
  const trackOnboardingStart = () => {
    trackEvent('onboarding_start');
  };

  const trackOnboardingComplete = () => {
    trackEvent('onboarding_complete');
  };

  const trackOnboardingSkip = () => {
    trackEvent('onboarding_skip');
  };

  // Track drop-off points
  const trackDropOff = (page: string, action?: string) => {
    trackEvent('drop_off', {
      metadata: { page, action }
    });
  };

  return {
    trackEvent,
    trackAuthAttempt,
    trackAuthSuccess,
    trackAuthFailure,
    trackOnboardingStart,
    trackOnboardingComplete,
    trackOnboardingSkip,
    trackDropOff
  };
}