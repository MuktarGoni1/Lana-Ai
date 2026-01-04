// lib/event-tracker.ts
// Service for tracking user events and sending them to the database

import { supabase } from './db';

import { TablesInsert } from '@/types/supabase';

interface UserEvent extends TablesInsert<'user_events'> {
  session_id?: string;
  event_type: string;
  metadata?: Record<string, any>;
  user_agent?: string;
  url?: string;
  ip_address?: string;
  user_id?: string;
}

class EventTracker {
  private static instance: EventTracker;
  
  private constructor() {}
  
  public static getInstance(): EventTracker {
    if (!EventTracker.instance) {
      EventTracker.instance = new EventTracker();
    }
    return EventTracker.instance;
  }
  
  async trackEvent(eventType: string, metadata?: Record<string, any>): Promise<void> {
    try {
      // Get session to identify user
      const { data: { session } } = await supabase.auth.getSession();
      
      // Get session ID from localStorage
      const sessionId = localStorage.getItem('lana_sid');
      
      // Prepare event data
      const eventData: UserEvent = {
        session_id: sessionId || undefined,
        event_type: eventType,
        metadata: metadata || {},
        user_agent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        user_id: session?.user?.id,
        timestamp: new Date().toISOString(),
      };
      
      // Send event to API endpoint
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });
      
      if (!response.ok) {
        console.error('Failed to track event:', await response.text());
      }
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }
}

export const eventTracker = EventTracker.getInstance();