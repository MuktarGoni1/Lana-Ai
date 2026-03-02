import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('[Simple Test] Starting test');
    
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
      console.log('[Simple Test] Initializing Supabase client');
      const client = getSupabaseAdmin();
      console.log('[Simple Test] Supabase client initialized');
      
      // Test 3: Simple operation
      console.log('[Simple Test] Testing simple operation');
      const test = await client.from('guardian_settings').select('email').limit(1);
      console.log('[Simple Test] Simple operation result:', test);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'All tests passed',
          testResult: test
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
      console.error('[Simple Test] Client error:', clientError);
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
    console.error('[Simple Test] Unexpected error:', error);
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
