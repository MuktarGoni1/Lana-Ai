import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { supabase } from '@/lib/db';
import { env } from '@/lib/env';

/**
 * Test the Supabase client initialization and connection
 */
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  latency?: number;
  error?: string;
}> {
  try {
    // Test environment variables
    if (!env.SUPABASE_URL) {
      return {
        success: false,
        message: 'Missing NEXT_PUBLIC_SUPABASE_URL environment variable',
        error: 'MISSING_ENV_VAR'
      };
    }

    if (!env.SUPABASE_ANON_KEY) {
      return {
        success: false,
        message: 'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable',
        error: 'MISSING_ENV_VAR'
      };
    }

    // Test client initialization
    const startTime = Date.now();
    
    // Test regular client connection
    const { data: healthData, error: healthError } = await supabase
      .from('guardian_settings')
      .select('count')
      .limit(1);
    
    const regularLatency = Date.now() - startTime;
    
    if (healthError) {
      return {
        success: false,
        message: 'Failed to connect to Supabase with regular client',
        error: healthError.message,
        latency: regularLatency
      };
    }

    // Test admin client connection
    const adminStartTime = Date.now();
    const adminClient = getSupabaseAdmin();
    
    const { data: adminData, error: adminError } = await adminClient
      .from('guardian_settings')
      .select('count')
      .limit(1);
    
    const adminLatency = Date.now() - adminStartTime;
    
    if (adminError) {
      return {
        success: false,
        message: 'Failed to connect to Supabase with admin client',
        error: adminError.message,
        latency: adminLatency
      };
    }

    return {
      success: true,
      message: 'Successfully connected to Supabase',
      latency: regularLatency + adminLatency
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Unexpected error during connection test',
      error: error.message || 'Unknown error'
    };
  }
}

/**
 * Test Supabase Auth connection and retrieve user count
 */
export async function testSupabaseAuth(): Promise<{
  success: boolean;
  message: string;
  userCount?: number;
  error?: string;
}> {
  try {
    const adminClient = getSupabaseAdmin();
    
    // Test Auth connection by listing users (limited for testing)
    const { data, error } = await adminClient.auth.admin.listUsers({
      perPage: 1
    });
    
    if (error) {
      return {
        success: false,
        message: 'Failed to connect to Supabase Auth',
        error: error.message
      };
    }
    
    // Get actual user count
    const { data: fullData, error: fullError } = await adminClient.auth.admin.listUsers();
    
    if (fullError) {
      return {
        success: false,
        message: 'Failed to retrieve user count from Supabase Auth',
        error: fullError.message
      };
    }
    
    return {
      success: true,
      message: 'Successfully connected to Supabase Auth',
      userCount: fullData?.users?.length || 0
    };
  } catch (error: any) {
    return {
      success: false,
      message: 'Unexpected error during Auth test',
      error: error.message || 'Unknown error'
    };
  }
}
