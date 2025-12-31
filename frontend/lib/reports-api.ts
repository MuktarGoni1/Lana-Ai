/**
 * API service for reports functionality in Lana AI
 * Provides functions to generate weekly and monthly reports for users
 */

import { createClient } from '@supabase/supabase-js';

// Type definitions for report data
export interface ReportData {
  user_id: string;
  report_type: 'weekly' | 'monthly';
  date_range: {
    start: string;
    end: string;
  };
  summary: {
    total_lessons_completed: number;
    total_activity_events: number;
    engagement_score: number;
    completion_rate: number;
  };
  lessons: {
    total: number;
    by_topic: Array<{ topic: string; count: number }>;
    by_date: Record<string, number>;
  };
  activity: {
    total_events: number;
    by_type: Record<string, number>;
    by_day: Record<string, number>;
  };
  engagement: {
    engagement_score: number;
    active_days: number;
    total_events: number;
    avg_daily_events: number;
  };
  recommendations: string[];
  generated_at: string;
}

/**
 * Generate a weekly report for a user
 */
export async function generateWeeklyReport(
  userId: string,
  startDate?: string
): Promise<ReportData> {
  try {
    const params = new URLSearchParams({
      user_id: userId,
    });
    
    if (startDate) {
      params.append('start_date', startDate);
    }
    
    const response = await fetch(`/api/reports/weekly?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to generate weekly report: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error generating weekly report:', error);
    throw error;
  }
}

/**
 * Generate a monthly report for a user
 */
export async function generateMonthlyReport(
  userId: string,
  startDate?: string
): Promise<ReportData> {
  try {
    const params = new URLSearchParams({
      user_id: userId,
    });
    
    if (startDate) {
      params.append('start_date', startDate);
    }
    
    const response = await fetch(`/api/reports/monthly?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to generate monthly report: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error generating monthly report:', error);
    throw error;
  }
}

/**
 * Generate a custom report for a specific date range
 */
export async function generateCustomReport(
  userId: string,
  reportType: 'weekly' | 'monthly',
  startDate: string,
  endDate?: string
): Promise<ReportData> {
  try {
    const params = new URLSearchParams({
      user_id: userId,
      report_type: reportType,
      start_date: startDate,
    });
    
    if (endDate) {
      params.append('end_date', endDate);
    }
    
    const response = await fetch(`/api/reports/generate?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to generate custom report: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error generating custom report:', error);
    throw error;
  }
}

/**
 * Get the current user's weekly report
 */
export async function getCurrentUserWeeklyReport(): Promise<ReportData> {
  // This would typically get the user ID from the current session
  // Implementation depends on your authentication system
  throw new Error('Not implemented: You need to provide the user ID');
}

/**
 * Get the current user's monthly report
 */
export async function getCurrentUserMonthlyReport(): Promise<ReportData> {
  // This would typically get the user ID from the current session
  // Implementation depends on your authentication system
  throw new Error('Not implemented: You need to provide the user ID');
}