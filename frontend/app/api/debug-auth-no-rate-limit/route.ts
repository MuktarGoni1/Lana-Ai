import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('[Debug Auth No Rate Limit] Starting debug test');
    
    // Step 1: Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('[Debug Auth No Rate Limit] Environment check:', {
      supabaseUrl: !!supabaseUrl,
      supabaseServiceKey: !!supabaseServiceKey
    });
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables');
    }
    
    // Step 2: Initialize Supabase client
    console.log('[Debug Auth No Rate Limit] Initializing Supabase client');
    const adminClient = getSupabaseAdmin();
    console.log('[Debug Auth No Rate Limit] Supabase client initialized');
    
    // Step 3: Test listUsers with minimal parameters
    console.log('[Debug Auth No Rate Limit] Calling listUsers');
    const result = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 1
    });
    
    console.log('[Debug Auth No Rate Limit] listUsers result type:', typeof result);
    console.log('[Debug Auth No Rate Limit] listUsers result keys:', result ? Object.keys(result) : null);
    
    // Check if result has data and error properties
    console.log('[Debug Auth No Rate Limit] result.data type:', typeof result.data);
    console.log('[Debug Auth No Rate Limit] result.error type:', typeof result.error);
    
    if (result.error) {
      console.log('[Debug Auth No Rate Limit] Supabase error details:', {
        message: result.error.message,
        name: result.error.name,
        stack: result.error.stack
      });
      throw new Error(`Supabase error: ${result.error.message}`);
    }
    
    // Step 4: Check data structure
    if (!result.data) {
      throw new Error('No data returned from listUsers');
    }
    
    console.log('[Debug Auth No Rate Limit] Data structure:', {
      dataKeys: Object.keys(result.data),
      usersType: typeof result.data.users,
      usersIsArray: Array.isArray(result.data.users),
      usersLength: Array.isArray(result.data.users) ? result.data.users.length : 'not array'
    });
    
    // If we have users, log the first one structure
    if (Array.isArray(result.data.users) && result.data.users.length > 0) {
      console.log('[Debug Auth No Rate Limit] First user structure:', {
        userKeys: Object.keys(result.data.users[0]),
        userEmail: result.data.users[0].email,
        userEmailConfirmed: result.data.users[0].email_confirmed_at
      });
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Debug test completed successfully',
        data: {
          usersCount: Array.isArray(result.data.users) ? result.data.users.length : 0,
          hasUsersArray: Array.isArray(result.data.users),
          firstUser: Array.isArray(result.data.users) && result.data.users.length > 0 ? {
            email: result.data.users[0].email,
            confirmed: !!result.data.users[0].email_confirmed_at
          } : null
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
  } catch (error: any) {
    console.error('[Debug Auth No Rate Limit] Error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error',
        errorName: error.name,
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