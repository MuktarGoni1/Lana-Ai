import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { supabase } from '@/lib/db';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('[Safe Connection Test] Starting test');
    
    // Test 1: Environment variables
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('[Safe Connection Test] Environment variables present:', {
      url: !!url,
      anonKey: !!anonKey,
      serviceKey: !!serviceKey
    });
    
    if (!url || !anonKey || !serviceKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing environment variables',
          details: {
            url: !!url,
            anonKey: !!anonKey,
            serviceKey: !!serviceKey
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
    
    // Test 2: Regular client connection (non-auth operation)
    try {
      console.log('[Safe Connection Test] Testing regular client connection');
      const { data, error } = await supabase
        .from('guardians')
        .select('email')
        .limit(1);
      
      console.log('[Safe Connection Test] Regular client test result:', {
        hasData: !!data,
        hasError: !!error,
        dataLength: data ? data.length : 0,
        error: error?.message
      });
      
      if (error) {
        console.error('[Safe Connection Test] Regular client error:', error);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Regular client connection failed',
            message: error.message,
            details: error
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
    } catch (regularError: any) {
      console.error('[Safe Connection Test] Regular client exception:', regularError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Regular client exception',
          message: regularError.message,
          stack: regularError.stack
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
    
    // Test 3: Admin client connection (non-auth operation)
    try {
      console.log('[Safe Connection Test] Testing admin client connection');
      const adminClient = getSupabaseAdmin();
      
      // Use a simple non-auth operation to test connection
      const { data, error } = await adminClient
        .from('guardians')
        .select('email')
        .limit(1);
      
      console.log('[Safe Connection Test] Admin client test result:', {
        hasData: !!data,
        hasError: !!error,
        dataLength: data ? data.length : 0,
        error: error?.message
      });
      
      if (error) {
        console.error('[Safe Connection Test] Admin client error:', error);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Admin client connection failed',
            message: error.message,
            details: error
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
    } catch (adminError: any) {
      console.error('[Safe Connection Test] Admin client exception:', adminError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Admin client exception',
          message: adminError.message,
          stack: adminError.stack
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
        message: 'All connection tests passed',
        environment: {
          url: !!url,
          anonKey: !!anonKey,
          serviceKey: !!serviceKey
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
    console.error('[Safe Connection Test] Unexpected error:', error);
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