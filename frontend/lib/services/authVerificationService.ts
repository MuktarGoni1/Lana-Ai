import { getSupabaseAdmin } from '@/lib/supabase-admin';

/**
 * Check if a specific email is authenticated in Supabase
 * This function is designed for server-side use in API routes or server components
 */
export async function verifyUserAuthentication(email: string): Promise<{
  isAuthenticated: boolean;
  user?: any;
  message: string;
}> {
  try {
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
    const adminClient = getSupabaseAdmin();
    
    // Search for users by email using a more efficient method
    const { data, error } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 100 // Limit to 100 users to prevent excessive data transfer
    });
    
    if (error) {
      console.error('[authVerificationService] Supabase error:', error);
      return {
        isAuthenticated: false,
        message: `Failed to retrieve users: ${error.message}`
      };
    }
    
    // Find the user with the matching email (case-insensitive)
    const user = data.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
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