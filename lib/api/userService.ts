// lib/api/userService.ts
import { getCSRFToken } from '@/lib/security/csrf-client';

interface UserProfile {
  id: string;
  email: string;
  user_metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface UpdateProfileData {
  first_name?: string;
  last_name?: string;
  phone?: string;
  timezone?: string;
  [key: string]: any;
}

/**
 * Client-side service for user-related API calls
 * This replaces direct Supabase client usage in the frontend
 */
export class UserService {
  private static baseUrl = '/api/user';

  /**
   * Get current user profile
   */
  static async getProfile(): Promise<UserProfile> {
    try {
      const response = await fetch(`${this.baseUrl}/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include' // Include cookies for authentication
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(data: UpdateProfileData): Promise<UserProfile> {
    try {
      const csrfToken = await getCSRFToken();
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }
      
      const response = await fetch(`${this.baseUrl}/profile`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      const profile = await this.getProfile();
      return !!profile.id;
    } catch (error) {
      return false;
    }
  }
}