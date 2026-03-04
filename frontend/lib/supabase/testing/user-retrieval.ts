import { getSupabaseAdmin } from '@/lib/supabase-admin';

export interface AuthenticatedUser {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  role: string | null;
  email_confirmed_at: string | null;
}

/**
 * Retrieve a paginated list of authenticated users from Supabase Auth
 * @param page Page number (1-based)
 * @param perPage Number of users per page (max 1000)
 */
export async function getAuthenticatedUsers(
  page: number = 1,
  perPage: number = 100
): Promise<{
  success: boolean;
  users?: AuthenticatedUser[];
  totalCount?: number;
  message: string;
  error?: string;
}> {
  try {
    // Validate parameters
    if (page < 1) page = 1;
    if (perPage < 1) perPage = 1;
    if (perPage > 1000) perPage = 1000;

    const adminClient = getSupabaseAdmin();
    
    // Calculate offset
    const offset = (page - 1) * perPage;
    
    // Retrieve users with pagination
    const { data, error } = await adminClient.auth.admin.listUsers({
      page: page,
      perPage: perPage
    });
    
    if (error) {
      return {
        success: false,
        message: 'Failed to retrieve users from Supabase Auth',
        error: error.message
      };
    }
    
    // Transform user data to our interface
    const users: AuthenticatedUser[] = data.users.map(user => ({
      id: user.id,
      email: user.email || null,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at || null,
      role: user.role || null,
      email_confirmed_at: user.email_confirmed_at || null
    }));
    
    return {
      success: true,
      users,
      totalCount: data.total,
      message: `Successfully retrieved ${users.length} users`
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Unexpected error during user retrieval',
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Retrieve all authenticated users (use with caution for large datasets)
 */
export async function getAllAuthenticatedUsers(): Promise<{
  success: boolean;
  users?: AuthenticatedUser[];
  message: string;
  error?: string;
}> {
  try {
    const adminClient = getSupabaseAdmin();
    
    // Start with first page
    let allUsers: AuthenticatedUser[] = [];
    let page = 1;
    const perPage = 1000; // Maximum allowed
    let hasMore = true;
    
    while (hasMore) {
      const { data, error } = await adminClient.auth.admin.listUsers({
        page: page,
        perPage: perPage
      });
      
      if (error) {
        return {
          success: false,
          message: `Failed to retrieve users from Supabase Auth (page ${page})`,
          error: error.message
        };
      }
      
      // Transform user data
      const users: AuthenticatedUser[] = data.users.map(user => ({
        id: user.id,
        email: user.email || null,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at || null,
        role: user.role || null,
        email_confirmed_at: user.email_confirmed_at || null
      }));
      
      allUsers = [...allUsers, ...users];
      
      // Check if we have more users
      if (data.users.length < perPage) {
        hasMore = false;
      } else {
        page++;
      }
    }
    
    return {
      success: true,
      users: allUsers,
      message: `Successfully retrieved all ${allUsers.length} users`
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Unexpected error during user retrieval',
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Search for users by email
 */
export async function searchUsersByEmail(email: string): Promise<{
  success: boolean;
  users?: AuthenticatedUser[];
  message: string;
  error?: string;
}> {
  try {
    if (!email) {
      return {
        success: false,
        message: 'Email parameter is required',
        error: 'MISSING_EMAIL'
      };
    }
    
    const adminClient = getSupabaseAdmin();
    
    // Retrieve all users and filter by email (Supabase doesn't support email filtering in listUsers)
    const { data, error } = await adminClient.auth.admin.listUsers();
    
    if (error) {
      return {
        success: false,
        message: 'Failed to retrieve users from Supabase Auth',
        error: error.message
      };
    }
    
    // Filter users by email
    const filteredUsers = data.users.filter(user => 
      user.email && user.email.toLowerCase().includes(email.toLowerCase())
    );
    
    // Transform user data
    const users: AuthenticatedUser[] = filteredUsers.map(user => ({
      id: user.id,
      email: user.email || null,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at || null,
      role: user.role || null,
      email_confirmed_at: user.email_confirmed_at || null
    }));
    
    return {
      success: true,
      users,
      message: `Found ${users.length} users matching email: ${email}`
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Unexpected error during user search',
      error: error.message || 'Unknown error'
    };
  }
}