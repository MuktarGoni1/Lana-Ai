import { verifyUserAuthentication } from '@/lib/services/authVerificationService';
import { NextRequest } from 'next/server';

export async function GET() {
  try {
    // Test authenticated user
    const result1 = await verifyUserAuthentication('muktargoni1@gmail.com');
    
    // Test unauthenticated user
    const result2 = await verifyUserAuthentication('bukarabubakar@gmail.com');
    
    return new Response(
      JSON.stringify({
        authenticatedUser: result1,
        unauthenticatedUser: result2
      }, null, 2), 
      { 
        headers: { 'Content-Type': 'application/json' 
      } 
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error' 
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' 
      } 
    });
  }
}