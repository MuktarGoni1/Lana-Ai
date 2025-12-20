// User Activity Tracking Service

// Event types
export type EventType = 
  | 'page_view'
  | 'lesson_start'
  | 'lesson_complete'
  | 'quiz_start'
  | 'quiz_complete'
  | 'quiz_answer'
  | 'search'
  | 'chat_message'
  | 'content_engagement'
  | 'navigation'
  | 'error'
  | 'feature_usage'
  | 'auth_attempt'
  | 'auth_success'
  | 'auth_failure'
  | 'onboarding_start'
  | 'onboarding_complete'
  | 'onboarding_skip'
  | 'drop_off';

// Base event structure
export interface BaseEvent {
  id: string;
  userId: string;
  sessionId: string;
  timestamp: string;
  eventType: EventType;
  metadata?: Record<string, any>;
  userAgent?: string;
  ipAddress?: string;
  url?: string;
}

// Specific event types
export interface PageViewEvent extends BaseEvent {
  eventType: 'page_view';
  metadata: {
    page: string;
    referrer?: string;
    duration?: number;
  };
}

export interface LessonEvent extends BaseEvent {
  eventType: 'lesson_start' | 'lesson_complete';
  metadata: {
    topic: string;
    lessonId?: string;
    duration?: number;
    completionPercentage?: number;
  };
}

export interface QuizEvent extends BaseEvent {
  eventType: 'quiz_start' | 'quiz_complete' | 'quiz_answer';
  metadata: {
    quizId?: string;
    questionId?: string;
    answer?: string;
    isCorrect?: boolean;
    score?: number;
    totalTime?: number;
  };
}

export interface SearchEvent extends BaseEvent {
  eventType: 'search';
  metadata: {
    query: string;
    resultsCount?: number;
    selectedResult?: string;
  };
}

export interface ChatEvent extends BaseEvent {
  eventType: 'chat_message';
  metadata: {
    messageId?: string;
    message: string;
    responseType: 'user' | 'ai';
    conversationId?: string;
  };
}

export interface ContentEngagementEvent extends BaseEvent {
  eventType: 'content_engagement';
  metadata: {
    contentType: string;
    contentId: string;
    action: 'view' | 'play' | 'pause' | 'skip' | 'complete';
    duration?: number;
    position?: number;
  };
}

export interface NavigationEvent extends BaseEvent {
  eventType: 'navigation';
  metadata: {
    from: string;
    to: string;
    method: 'click' | 'swipe' | 'keyboard' | 'back';
  };
}

export interface ErrorEvent extends BaseEvent {
  eventType: 'error';
  metadata: {
    errorType: string;
    errorMessage: string;
    stackTrace?: string;
    component?: string;
  };
}

export interface FeatureUsageEvent extends BaseEvent {
  eventType: 'feature_usage';
  metadata: {
    featureName: string;
    action: string;
    value?: any;
  };
}

export interface AuthEvent extends BaseEvent {
  eventType: 'auth_attempt' | 'auth_success' | 'auth_failure';
  metadata: {
    method: string;
    error?: string;
  };
}

export interface OnboardingEvent extends BaseEvent {
  eventType: 'onboarding_start' | 'onboarding_complete' | 'onboarding_skip';
  metadata: {
    step?: string;
    duration?: number;
  };
}

export interface DropOffEvent extends BaseEvent {
  eventType: 'drop_off';
  metadata: {
    page: string;
    action?: string;
    timestamp?: string;
  };
}

// Union type for all events
export type TrackingEvent = 
  | PageViewEvent
  | LessonEvent
  | QuizEvent
  | SearchEvent
  | ChatEvent
  | ContentEngagementEvent
  | NavigationEvent
  | ErrorEvent
  | FeatureUsageEvent
  | AuthEvent
  | OnboardingEvent
  | DropOffEvent;

// Consent management
export interface ConsentPreferences {
  analytics: boolean;
  personalization: boolean;
  marketing: boolean;
  functional: boolean;
}

// Simple UUID generator (since we can't use the uuid package)
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Activity tracker class
export class ActivityTracker {
  private userId: string | null = null;
  private sessionId: string;
  private consent: ConsentPreferences;
  private queue: TrackingEvent[] = [];
  private isProcessing = false;
  
  constructor() {
    // Generate a session ID
    this.sessionId = generateUUID();
    
    // Load consent preferences from localStorage
    this.consent = this.loadConsentPreferences();
    
    // Load userId if available
    this.loadUserId();
    
    // Process queued events periodically
    setInterval(() => {
      this.processQueue();
    }, 5000);
  }
  
  // Set user ID (called after login)
  setUserId(userId: string) {
    this.userId = userId;
    try {
      localStorage.setItem('lana_user_id', userId);
    } catch (e) {
      console.warn('Could not save user ID to localStorage');
    }
  }
  
  // Load user ID from localStorage
  private loadUserId() {
    try {
      const userId = localStorage.getItem('lana_user_id');
      if (userId) {
        this.userId = userId;
      }
    } catch (e) {
      console.warn('Could not load user ID from localStorage');
    }
  }
  
  // Load consent preferences
  private loadConsentPreferences(): ConsentPreferences {
    try {
      const consentStr = localStorage.getItem('lana_consent_preferences');
      if (consentStr) {
        return JSON.parse(consentStr);
      }
    } catch (e) {
      console.warn('Could not load consent preferences from localStorage');
    }
    
    // Default consent preferences
    return {
      analytics: true,
      personalization: true,
      marketing: false,
      functional: true
    };
  }
  
  // Save consent preferences
  saveConsentPreferences(preferences: ConsentPreferences) {
    this.consent = preferences;
    try {
      localStorage.setItem('lana_consent_preferences', JSON.stringify(preferences));
    } catch (e) {
      console.warn('Could not save consent preferences to localStorage');
    }
  }
  
  // Check if tracking is allowed based on consent
  private isTrackingAllowed(): boolean {
    return this.consent.analytics && this.consent.functional;
  }
  
  // Track an event
  track(eventType: EventType, metadata: Record<string, any> = {}) {
    // Don't track if consent not given
    if (!this.isTrackingAllowed()) {
      return;
    }
    
    // Don't track if no user ID (except for anonymous tracking)
    if (!this.userId && eventType !== 'page_view') {
      return;
    }
    
    const event: BaseEvent = {
      id: generateUUID(),
      userId: this.userId || 'anonymous',
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      eventType,
      metadata,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined
    };
    
    // Add to queue
    this.queue.push(event as TrackingEvent);
  }
  
  // Process event queue
  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }
    
    this.isProcessing = true;
    
    try {
      // Send events to backend
      const eventsToSend = [...this.queue];
      this.queue = [];
      
      // Batch send events
      await this.sendEvents(eventsToSend);
    } catch (error) {
      console.error('Error processing tracking queue:', error);
      // Put events back in queue if failed
      this.queue.unshift(...this.queue);
    } finally {
      this.isProcessing = false;
    }
  }
  
  // Send events to backend
  private async sendEvents(events: TrackingEvent[]) {
    try {
      // In a real implementation, this would send to your analytics backend
      // For now, we'll just log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Tracking events:', events);
      }
      
      // Send to backend API
      const response = await fetch('/api/tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to send tracking events: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Tracking events sent successfully:', result);
    } catch (error) {
      console.error('Error sending tracking events:', error);
      // In a real implementation, you might want to retry or store locally
      throw error;
    }
  }
  
  // Convenience methods for common events
  trackPageView(page: string, referrer?: string) {
    this.track('page_view', { page, referrer });
  }
  
  trackLessonStart(topic: string, lessonId?: string) {
    this.track('lesson_start', { topic, lessonId });
  }
  
  trackLessonComplete(topic: string, lessonId?: string, duration?: number, completionPercentage?: number) {
    this.track('lesson_complete', { topic, lessonId, duration, completionPercentage });
  }
  
  trackQuizStart(quizId?: string) {
    this.track('quiz_start', { quizId });
  }
  
  trackQuizComplete(quizId?: string, score?: number, totalTime?: number) {
    this.track('quiz_complete', { quizId, score, totalTime });
  }
  
  trackQuizAnswer(questionId: string, answer: string, isCorrect: boolean) {
    this.track('quiz_answer', { questionId, answer, isCorrect });
  }
  
  trackSearch(query: string, resultsCount?: number) {
    this.track('search', { query, resultsCount });
  }
  
  trackChatMessage(message: string, messageType: 'user' | 'ai', conversationId?: string) {
    this.track('chat_message', { message, responseType: messageType, conversationId });
  }
  
  trackContentEngagement(contentType: string, contentId: string, action: string, duration?: number) {
    this.track('content_engagement', { contentType, contentId, action, duration });
  }
  
  trackNavigation(from: string, to: string, method: string) {
    this.track('navigation', { from, to, method });
  }
  
  trackError(errorType: string, errorMessage: string, stackTrace?: string, component?: string) {
    this.track('error', { errorType, errorMessage, stackTrace, component });
  }
  
  trackFeatureUsage(featureName: string, action: string, value?: any) {
    this.track('feature_usage', { featureName, action, value });
  }
  
  trackAuthAttempt(method: string) {
    this.track('auth_attempt', { method });
  }
  
  trackAuthSuccess(method: string) {
    this.track('auth_success', { method });
  }
  
  trackAuthFailure(method: string, error: string) {
    this.track('auth_failure', { method, error });
  }
  
  trackOnboardingStart() {
    this.track('onboarding_start', {});
  }
  
  trackOnboardingComplete() {
    this.track('onboarding_complete', {});
  }
  
  trackOnboardingSkip() {
    this.track('onboarding_skip', {});
  }
  
  trackDropOff(page: string, action?: string) {
    this.track('drop_off', { page, action });
  }
}

// Create a singleton instance
export const activityTracker = new ActivityTracker();