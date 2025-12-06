import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { type User } from '@supabase/supabase-js';

/**
 * Check if a specific email is authenticated in Supabase
 * This function is designed for server-side use in API routes or server components
 */
export async function verifyUserAuthentication(email: string): Promise<{
  isAuthenticated: boolean;
  user?: User;
  message: string;
}> {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('[authVerificationService] Starting verification for email:', email);
    }
    
    if (!email) {
      return {
        isAuthenticated: false,
        message: 'Email is required'
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        isAuthenticated: false,
        message: 'Invalid email format'
      };
    }

    // Use the Supabase admin client to check if user exists
    let adminClient;
    try {
      console.log('[authVerificationService] Initializing Supabase admin client');
      adminClient = getSupabaseAdmin();
      console.log('[authVerificationService] Supabase admin client initialized successfully');
    } catch (envError: any) {
      console.error('[authVerificationService] Environment error:', envError);
      return {
        isAuthenticated: false,
        message: `Environment configuration error: ${envError.message || 'Missing Supabase credentials'}`
      };
    }
    
    // Search for users by email using a more efficient method
    // First try to get the user directly by email if the method is available
    try {
      console.log('[authVerificationService] Calling listUsers');
      const { data, error } = await adminClient.auth.admin.listUsers({
        page: 1,
        perPage: 100 // Limit to 100 users to prevent excessive data transfer
      });
      console.log('[authVerificationService] listUsers response:', { data, error });
      
      if (error) {
        console.error('[authVerificationService] Supabase error:', error);
        return {
          isAuthenticated: false,
          message: `Failed to retrieve users: ${error.message}`
        };
      }
      
      // Add debugging to see the structure of the data
      console.log('[authVerificationService] listUsers response structure', { 
        dataKeys: Object.keys(data),
        usersType: typeof data.users,
        usersLength: Array.isArray(data.users) ? data.users.length : 'not an array'
      });
      
      // Find the user with the matching email (case-insensitive)
      const user = Array.isArray(data.users) ? data.users.find(u => u.email?.toLowerCase() === email.toLowerCase()) : null;
      console.log('[authVerificationService] Found user:', user);
      
      if (!user) {
        return {
          isAuthenticated: false,
          message: `No authenticated user found with email: ${email}`
        };
      }
      
      // Check if email is confirmed
      if (!user.email_confirmed_at) {
        return {
          isAuthenticated: false,
          user,
          message: `User ${email} exists but email is not confirmed`
        };
      }
      
      // Return authenticated user
      return {
        isAuthenticated: true,
        user,
        message: `User ${email} is authenticated`
      };
    } catch (methodError: any) {
      console.error('[authVerificationService] Error querying users:', methodError);
      return {
        isAuthenticated: false,
        message: `Error querying users: ${methodError.message || 'Unknown error'}`
      };
    }

  } catch (error: any) {
    console.error('[authVerificationService] Unexpected error:', error);
    return {
      isAuthenticated: false,
      message: `Error checking user authentication: ${error.message || 'Unknown error'}`
    };
  }
}

/**
 * Simple client-side function to check if user is authenticated
 * This uses the regular Supabase client and checks the current session
 */
export async function checkCurrentUserAuthentication() {
  try {
    // This would be implemented if we needed client-side checking
    // For now, we'll focus on server-side verification
    return {
      isAuthenticated: false,
      message: 'Use server-side verification for email authentication'
    };
  } catch (error: any) {
    return {
      isAuthenticated: false,
      message: `Error checking current user authentication: ${error.message || 'Unknown error'}`
    };
  }
}