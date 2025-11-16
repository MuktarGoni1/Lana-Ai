import { searchUsersByEmail } from '@/lib/supabase/testing/user-retrieval';

/**
 * Check if a specific email is authenticated in Supabase
 */
export async function checkIfUserIsAuthenticated(email: string): Promise<{
  isAuthenticated: boolean;
  user?: any;
  message: string;
}> {
  try {
    const result = await searchUsersByEmail(email);
    
    if (!result.success) {
      return {
        isAuthenticated: false,
        message: `Failed to check user authentication: ${result.error || result.message}`
      };
    }
    
    if (!result.users || result.users.length === 0) {
      return {
        isAuthenticated: false,
        message: `No authenticated user found with email: ${email}`
      };
    }
    
    // Return the first matching user
    return {
      isAuthenticated: true,
      user: result.users[0],
      message: `User ${email} is authenticated`
    };
  } catch (error: any) {
    return {
      isAuthenticated: false,
      message: `Error checking user authentication: ${error.message || 'Unknown error'}`
    };
  }
}

// Example usage
if (require.main === module) {
  (async () => {
    const email = process.argv[2] || 'muktargoni1@gmail.com';
    const result = await checkIfUserIsAuthenticated(email);
    console.log(JSON.stringify(result, null, 2));
  })();
}