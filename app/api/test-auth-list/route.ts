import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('[Test Auth List] Starting test');
    
    // Initialize Supabase admin client
    const adminClient = getSupabaseAdmin();
    console.log('[Test Auth List] Supabase admin client initialized');
    
    // List users using the same method as the frontend
    console.log('[Test Auth List] Calling listUsers');
    const { data, error } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 100
    });
    
    if (error) {
      console.error('[Test Auth List] Supabase error:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error.message 
        }), 
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    console.log(`[Test Auth List] Found ${data.users.length} users`);
    
    // Test specific emails
    const testEmails = [
      'climaxvitalityclinic@gmail.com',
      'muktargoni1@gmail.com',
      'bukarabubakar@gmail.com'
    ];
    
    const emailResults: Record<string, any> = {};
    testEmails.forEach(email => {
      const user = data.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      emailResults[email] = user ? {
        found: true,
        confirmed: !!user.email_confirmed_at,
        userId: user.id,
        createdAt: user.created_at
      } : {
        found: false
      };
    });
    
    // Return results
    return new Response(
      JSON.stringify({
        success: true,
        userCount: data.users.length,
        firstUsers: data.users.slice(0, 5).map(user => ({
          email: user.email,
          confirmed: !!user.email_confirmed_at,
          createdAt: user.created_at
        })),
        emailTests: emailResults
      }, null, 2), 
      { 
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error: any) {
    console.error('[Test Auth List] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error'
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}