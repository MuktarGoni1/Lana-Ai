import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('[Auth Test] Starting authentication test');
    
    // Test 1: Check if environment variables are properly loaded
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('[Auth Test] Environment variables status:', {
      supabaseUrl: supabaseUrl ? 'SET' : 'NOT SET',
      supabaseServiceKey: supabaseServiceKey ? 'SET' : 'NOT SET',
      supabaseServiceKeyLength: supabaseServiceKey ? supabaseServiceKey.length : 0
    });
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing Supabase environment variables',
          details: {
            supabaseUrl: supabaseUrl ? 'SET' : 'NOT SET',
            supabaseServiceKey: supabaseServiceKey ? 'SET' : 'NOT SET'
          }
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
          }
        }
      );
    }
    
    // Test 2: Initialize Supabase admin client
    try {
      console.log('[Auth Test] Initializing Supabase admin client');
      const adminClient = getSupabaseAdmin();
      console.log('[Auth Test] Supabase admin client initialized successfully');
      
      // Test 3: Try to list users
      console.log('[Auth Test] Attempting to list users');
      const { data, error } = await adminClient.auth.admin.listUsers({
        page: 1,
        perPage: 5
      });
      
      console.log('[Auth Test] listUsers response:', {
        hasData: !!data,
        hasError: !!error,
        dataKeys: data ? Object.keys(data) : null,
        error: error?.message
      });
      
      if (error) {
        console.error('[Auth Test] Supabase error:', error);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Supabase API error',
            message: error.message,
            details: {
              supabaseUrl: supabaseUrl ? 'SET' : 'NOT SET'
            }
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store'
            }
          }
        );
      }
      
      // Test 4: Check data structure
      console.log('[Auth Test] Data structure check:', {
        usersType: typeof data.users,
        usersLength: Array.isArray(data.users) ? data.users.length : 'not an array',
        firstUser: Array.isArray(data.users) && data.users.length > 0 ? data.users[0] : null
      });
      
      // Return success response with sample data
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Authentication test completed successfully',
          environment: {
            supabaseUrl: supabaseUrl ? 'SET' : 'NOT SET'
          },
          users: {
            count: Array.isArray(data.users) ? data.users.length : 0,
            sample: Array.isArray(data.users) && data.users.length > 0 ? data.users[0] : null
          }
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
          }
        }
      );
    } catch (adminError: any) {
      console.error('[Auth Test] Supabase admin client error:', adminError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Supabase admin client initialization failed',
          message: adminError.message,
          stack: adminError.stack,
          details: {
            supabaseUrl: supabaseUrl ? 'SET' : 'NOT SET'
          }
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
          }
        }
      );
    }
  } catch (error: any) {
    console.error('[Auth Test] Unexpected error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Unexpected error',
        message: error.message,
        stack: error.stack
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      }
    );
  }
}