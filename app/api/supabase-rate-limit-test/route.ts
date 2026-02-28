import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('[Supabase Rate Limit Test] Starting test');
    
    // Test 1: Environment variables
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!url || !key) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing environment variables',
          url: !!url,
          key: !!key
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
    
    // Test 2: Supabase client initialization
    try {
      console.log('[Supabase Rate Limit Test] Initializing Supabase client');
      const client = getSupabaseAdmin();
      console.log('[Supabase Rate Limit Test] Supabase client initialized');
      
      // Test 3: Simple non-auth operation to avoid rate limits
      console.log('[Supabase Rate Limit Test] Testing simple operation');
      const test = await client.from('guardian_settings').select('email').limit(1);
      console.log('[Supabase Rate Limit Test] Simple operation result:', {
        hasData: !!test.data,
        hasError: !!test.error,
        dataLength: test.data ? test.data.length : 0,
        error: test.error?.message
      });
      
      if (test.error) {
        console.error('[Supabase Rate Limit Test] Database error:', test.error);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Database operation failed',
            message: test.error.message,
            details: test.error
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
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'All tests passed',
          testResult: {
            dataLength: test.data ? test.data.length : 0,
            sampleData: test.data && test.data.length > 0 ? test.data[0] : null
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
    } catch (clientError: any) {
      console.error('[Supabase Rate Limit Test] Client error:', clientError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Client initialization or operation failed',
          message: clientError.message,
          stack: clientError.stack
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
    console.error('[Supabase Rate Limit Test] Unexpected error:', error);
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
