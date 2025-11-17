import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Check if environment variables are set
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    return new Response(
      JSON.stringify({
        success: true,
        supabaseUrl: supabaseUrl ? 'SET' : 'NOT SET',
        supabaseServiceKey: supabaseServiceKey ? 'SET' : 'NOT SET',
        supabaseServiceKeyLength: supabaseServiceKey ? supabaseServiceKey.length : 0,
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