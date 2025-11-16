import { testSupabaseConnection, testSupabaseAuth } from './connection-test';
import { getAuthenticatedUsers, getAllAuthenticatedUsers, searchUsersByEmail } from './user-retrieval';

/**
 * Run a comprehensive test suite for Supabase connection and user retrieval
 */
export async function runSupabaseTestSuite(): Promise<{
  success: boolean;
  report: string;
  connectionTest?: any;
  authTest?: any;
  userTest?: any;
  error?: string;
}> {
  try {
    let report = '=== Supabase Test Suite Report ===\n\n';
    
    // 1. Test connection
    report += '1. Testing Supabase Connection...\n';
    const connectionTest = await testSupabaseConnection();
    report += `   Status: ${connectionTest.success ? 'PASS' : 'FAIL'}\n`;
    report += `   Message: ${connectionTest.message}\n`;
    if (connectionTest.latency) {
      report += `   Latency: ${connectionTest.latency}ms\n`;
    }
    if (connectionTest.error) {
      report += `   Error: ${connectionTest.error}\n`;
    }
    report += '\n';
    
    // 2. Test Auth
    report += '2. Testing Supabase Auth...\n';
    const authTest = await testSupabaseAuth();
    report += `   Status: ${authTest.success ? 'PASS' : 'FAIL'}\n`;
    report += `   Message: ${authTest.message}\n`;
    if (authTest.userCount !== undefined) {
      report += `   User Count: ${authTest.userCount}\n`;
    }
    if (authTest.error) {
      report += `   Error: ${authTest.error}\n`;
    }
    report += '\n';
    
    // 3. Test user retrieval (first 10 users)
    report += '3. Testing User Retrieval...\n';
    const userTest = await getAuthenticatedUsers(1, 10);
    report += `   Status: ${userTest.success ? 'PASS' : 'FAIL'}\n`;
    report += `   Message: ${userTest.message}\n`;
    if (userTest.users) {
      report += `   Retrieved Users: ${userTest.users.length}\n`;
      if (userTest.users.length > 0) {
        report += '   Sample Users:\n';
        userTest.users.slice(0, 3).forEach((user, index) => {
          report += `     ${index + 1}. ${user.email || 'No email'} (ID: ${user.id})\n`;
        });
      }
    }
    if (userTest.error) {
      report += `   Error: ${userTest.error}\n`;
    }
    report += '\n';
    
    // 4. Summary
    const allTestsPassed = connectionTest.success && authTest.success && userTest.success;
    report += '=== Summary ===\n';
    report += `Overall Status: ${allTestsPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}\n`;
    
    return {
      success: allTestsPassed,
      report,
      connectionTest,
      authTest,
      userTest
    };
  } catch (error: any) {
    return {
      success: false,
      report: `Test suite failed with error: ${error.message || 'Unknown error'}`,
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Get a formatted list of all authenticated users
 */
export async function getFormattedUserList(): Promise<string> {
  try {
    const result = await getAllAuthenticatedUsers();
    
    if (!result.success) {
      return `Failed to retrieve users: ${result.error || result.message}`;
    }
    
    if (!result.users || result.users.length === 0) {
      return 'No authenticated users found.';
    }
    
    let output = `=== Authenticated Users List (${result.users.length} total) ===\n\n`;
    
    result.users.forEach((user, index) => {
      output += `${index + 1}. ${user.email || 'No email'}\n`;
      output += `   ID: ${user.id}\n`;
      output += `   Created: ${user.created_at}\n`;
      output += `   Last Sign In: ${user.last_sign_in_at || 'Never'}\n`;
      output += `   Email Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}\n`;
      output += `   Role: ${user.role || 'None'}\n`;
      output += '\n';
    });
    
    return output;
  } catch (error: any) {
    return `Error retrieving user list: ${error.message || 'Unknown error'}`;
  }
}

/**
 * Search for users by email and return formatted results
 */
export async function searchAndFormatUsersByEmail(email: string): Promise<string> {
  try {
    const result = await searchUsersByEmail(email);
    
    if (!result.success) {
      return `Failed to search users: ${result.error || result.message}`;
    }
    
    if (!result.users || result.users.length === 0) {
      return `No users found matching email: ${email}`;
    }
    
    let output = `=== Users Matching Email: ${email} (${result.users.length} found) ===\n\n`;
    
    result.users.forEach((user, index) => {
      output += `${index + 1}. ${user.email || 'No email'}\n`;
      output += `   ID: ${user.id}\n`;
      output += `   Created: ${user.created_at}\n`;
      output += `   Last Sign In: ${user.last_sign_in_at || 'Never'}\n`;
      output += `   Email Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}\n`;
      output += `   Role: ${user.role || 'None'}\n`;
      output += '\n';
    });
    
    return output;
  } catch (error: any) {
    return `Error searching users: ${error.message || 'Unknown error'}`;
  }
}