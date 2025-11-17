import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { NextRequest } from 'next/server';

// Test users list
const TEST_USERS = [
  'muktargoni1@gmail.com',
  'bukarabubakar@gmail.com',
  'test@example.com'
];

export async function GET(request: NextRequest) {
  try {
    console.log('[Test Specific Users] Starting test with specific users');
    
    // Initialize Supabase admin client
    const adminClient = getSupabaseAdmin();
    
    // Test each user
    const results = [];
    
    for (const email of TEST_USERS) {
      try {
        console.log(`[Test Specific Users] Testing user: ${email}`);
        
        // List users with pagination
        const { data, error } = await adminClient.auth.admin.listUsers({
          page: 1,
          perPage: 100
        });
        
        if (error) {
          results.push({
            email,
            status: 'error',
            error: error.message
          });
          continue;
        }
        
        // Find the specific user
        const user = Array.isArray(data.users) 
          ? data.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
          : null;
        
        if (user) {
          results.push({
            email,
            status: 'found',
            confirmed: !!user.email_confirmed_at,
            userId: user.id,
            createdAt: user.created_at
          });
        } else {
          results.push({
            email,
            status: 'not_found'
          });
        }
      } catch (userError: any) {
        console.error(`[Test Specific Users] Error testing user ${email}:`, userError);
        results.push({
          email,
          status: 'error',
          error: userError.message
        });
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        testUsers: TEST_USERS,
        results
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
    console.error('[Test Specific Users] Unexpected error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error',
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;
    
    if (!email) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Email is required'
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
    
    // Initialize Supabase admin client
    const adminClient = getSupabaseAdmin();
    
    // List users with pagination
    const { data, error } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 100
    });
    
    if (error) {
      return new Response(
        JSON.stringify({
          success: false,
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
    
    // Find the specific user
    const user = Array.isArray(data.users) 
      ? data.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
      : null;
    
    if (user) {
      return new Response(
        JSON.stringify({
          success: true,
          user: {
            email: user.email,
            confirmed: !!user.email_confirmed_at,
            userId: user.id,
            createdAt: user.created_at
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
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          message: `User ${email} not found`
        }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store'
          }
        }
      );
    }
  } catch (error: any) {
    console.error('[Test Specific Users POST] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
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