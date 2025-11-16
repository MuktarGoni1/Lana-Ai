import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    // Test Supabase Admin Connection
    const adminClient = getSupabaseAdmin();
    
    // Test a simple query to verify connection
    const { data, error } = await adminClient
      .from('guardians')
      .select('id')
      .limit(1);
    
    if (error) {
      return new Response(
        JSON.stringify({ 
          status: 'error',
          message: 'Supabase connection failed',
          error: error.message
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
    
    // Test environment variables
    const envCheck = {
      SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      API_BASE: !!process.env.NEXT_PUBLIC_API_BASE
    };
    
    // Check for missing critical environment variables
    const missingEnvVars = [];
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missingEnvVars.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missingEnvVars.push('SUPABASE_SERVICE_ROLE_KEY');
    
    if (missingEnvVars.length > 0) {
      return new Response(
        JSON.stringify({ 
          status: 'error',
          message: 'Missing critical environment variables',
          missing: missingEnvVars
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
        status: 'ok',
        message: 'All systems operational',
        supabaseConnection: 'successful',
        environmentVariables: envCheck,
        timestamp: new Date().toISOString()
      }), 
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      }
    );
  } catch (error: any) {
    console.error('[Deployment Test] Error:', error);
    return new Response(
      JSON.stringify({ 
        status: 'error',
        message: 'Deployment test failed',
        error: error.message || 'Unknown error'
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