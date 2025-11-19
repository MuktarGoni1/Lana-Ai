import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Check if environment variables are set
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing Supabase environment variables',
          supabaseUrl: supabaseUrl ? 'SET' : 'NOT SET',
          supabaseServiceKey: supabaseServiceKey ? 'SET' : 'NOT SET',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
          },
        }
      );
    }
    
    // Try to initialize the Supabase admin client
    try {
      const adminClient = getSupabaseAdmin();
      
      // Try to list users to test the connection
      const { data, error } = await adminClient.auth.admin.listUsers({
        page: 1,
        perPage: 1
      });
      
      if (error) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Failed to list users',
            supabaseError: error.message,
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store',
            },
          }
        );
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Supabase connection successful',
          userCount: data.users.length,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
          },
        }
      );
    } catch (adminError: any) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to initialize Supabase admin client',
          adminError: adminError.message,
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
          },
        }
      );
    }
  } catch (error: any) {
    console.error('[API test-supabase] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}