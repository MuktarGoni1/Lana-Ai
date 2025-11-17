import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Check if environment variables are set
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    // Also check for common variations
    const supabaseUrlAlt = process.env.NEXT_PUBLIC_SUPABASE_URL_ALT;
    const serviceRoleKeyAlt = process.env.SUPABASE_SERVICE_ROLE_KEY_ALT;
    
    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        environment: {
          NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? 'SET' : 'NOT SET',
          SUPABASE_SERVICE_ROLE_KEY: supabaseServiceKey ? 'SET' : 'NOT SET',
          NEXT_PUBLIC_SUPABASE_URL_ALT: supabaseUrlAlt ? 'SET' : 'NOT SET',
          SUPABASE_SERVICE_ROLE_KEY_ALT: serviceRoleKeyAlt ? 'SET' : 'NOT SET',
        },
        details: {
          supabaseUrlLength: supabaseUrl ? supabaseUrl.length : 0,
          supabaseServiceKeyLength: supabaseServiceKey ? supabaseServiceKey.length : 0,
          supabaseUrlAltLength: supabaseUrlAlt ? supabaseUrlAlt.length : 0,
          serviceRoleKeyAltLength: serviceRoleKeyAlt ? serviceRoleKeyAlt.length : 0,
        },
        // Don't expose actual values for security
        sample: {
          supabaseUrlStart: supabaseUrl ? supabaseUrl.substring(0, 20) + '...' : null,
          supabaseServiceKeyStart: supabaseServiceKey ? supabaseServiceKey.substring(0, 10) + '...' : null,
        }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error: any) {
    console.error('[API test-env] Error:', error);
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