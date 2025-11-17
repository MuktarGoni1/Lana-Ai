import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { NextRequest } from 'next/server';
import { z } from 'zod';

const BodySchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    console.log('[Bypass Rate Limit Test] Starting test');
    
    // Parse request body
    const json = await request.json();
    console.log('[Bypass Rate Limit Test] Request body:', json);
    
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      console.log('[Bypass Rate Limit Test] Validation failed:', parsed.error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'invalid_email',
          message: 'Please provide a valid email address.',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
          }
        }
      );
    }
    
    const email = parsed.data.email.toLowerCase().trim();
    console.log('[Bypass Rate Limit Test] Parsed email:', email);
    
    // Initialize Supabase client
    console.log('[Bypass Rate Limit Test] Initializing Supabase client');
    const admin = getSupabaseAdmin();
    console.log('[Bypass Rate Limit Test] Supabase client initialized');
    
    // List users
    console.log('[Bypass Rate Limit Test] Calling listUsers');
    const { data, error } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 100
    });
    console.log('[Bypass Rate Limit Test] listUsers completed');
    
    if (error) {
      console.error('[Bypass Rate Limit Test] Supabase error:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'auth_admin_error',
          message: 'Unable to verify email at this time.',
          supabaseError: error.message,
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
    
    console.log('[Bypass Rate Limit Test] Data structure:', {
      dataKeys: Object.keys(data),
      usersType: typeof data.users,
      usersIsArray: Array.isArray(data.users),
      usersLength: Array.isArray(data.users) ? data.users.length : 'not array'
    });
    
    // Find user
    const user = Array.isArray(data.users) ? data.users.find(u => u.email?.toLowerCase() === email.toLowerCase()) : null;
    console.log('[Bypass Rate Limit Test] Found user:', user);
    
    const exists = Boolean(user);
    const confirmed = Boolean(user?.email_confirmed_at);
    
    return new Response(
      JSON.stringify({
        success: true,
        email,
        exists,
        confirmed,
        userId: user?.id ?? null,
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
    console.error('[Bypass Rate Limit Test] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'network_or_server_error',
        message: error.message || 'Unknown error',
        errorName: error.name,
        errorStack: error.stack,
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