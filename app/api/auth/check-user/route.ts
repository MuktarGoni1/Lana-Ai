import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Email is required'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid email format'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    try {
      // Initialize Supabase admin client
      const adminClient = getSupabaseAdmin();

      // First try to get the user directly by email if the method exists
      // Otherwise, list users and filter (as in the verify-email endpoint)
      const { data, error } = await adminClient.auth.admin.listUsers({
        page: 1,
        perPage: 100
      });

      if (error) {
        console.error('[API Auth Check] Supabase Auth error:', error);
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Failed to check user authentication status'
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      }

      // Look for the user in the returned data
      const user = Array.isArray(data.users) 
        ? data.users.find(user => 
            user.email && user.email.toLowerCase() === email.toLowerCase()
          )
        : null;

      // Check if user exists and email is confirmed
      const userExists = !!user;
      const emailConfirmed = user?.email_confirmed_at ? true : false;

      // For guardian/child verification, we can check additional metadata
      // In a full implementation, you might check against specific guardian/child tables
      const isGuardianOrChild = userExists && (
        user.app_metadata?.role === 'guardian' || 
        user.app_metadata?.role === 'child'
      );

      return new Response(
        JSON.stringify({
          success: true,
          exists: userExists,
          confirmed: emailConfirmed,
          isAuthorized: userExists && emailConfirmed,
          isGuardianOrChild: isGuardianOrChild,
          message: userExists 
            ? emailConfirmed 
              ? 'User authenticated and email confirmed' 
              : 'User exists but email not confirmed'
            : 'User not found'
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error: any) {
      console.error('[API Auth Check] Unexpected error:', error);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Unexpected error during user check'
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
  } catch (error: any) {
    console.error('[API Auth Check] Request parsing error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Invalid request format'
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}