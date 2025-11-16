import { runSupabaseTestSuite, getFormattedUserList, searchAndFormatUsersByEmail } from '@/lib/supabase/testing/test-suite';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'test';
    const email = searchParams.get('email') || '';
    
    switch (action) {
      case 'users':
        // Get all users
        const userList = await getFormattedUserList();
        return new Response(userList, {
          headers: { 'Content-Type': 'text/plain' }
        });
        
      case 'search':
        // Search users by email
        if (!email) {
          return new Response('Email parameter is required for search action', { 
            status: 400,
            headers: { 'Content-Type': 'text/plain' }
          });
        }
        const searchResults = await searchAndFormatUsersByEmail(email);
        return new Response(searchResults, {
          headers: { 'Content-Type': 'text/plain' }
        });
        
      case 'test':
      default:
        // Run full test suite
        const testResult = await runSupabaseTestSuite();
        return new Response(testResult.report, {
          headers: { 'Content-Type': 'text/plain' }
        });
    }
  } catch (error: any) {
    return new Response(`Error: ${error.message || 'Unknown error'}`, { 
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}