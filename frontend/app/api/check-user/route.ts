import { checkIfUserIsAuthenticated } from '@/lib/supabase/testing/check-user';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return new Response('Email parameter is required', { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const result = await checkIfUserIsAuthenticated(email);
    
    return new Response(JSON.stringify(result, null, 2), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({
      isAuthenticated: false,
      message: `Error: ${error.message || 'Unknown error'}`
    }, null, 2), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}