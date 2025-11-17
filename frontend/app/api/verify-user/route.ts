import { verifyUserAuthentication } from '@/lib/services/authVerificationService';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Log request for debugging
    console.log('[API verify-user] Received request');
    
    // Check if the request is from a trusted source
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    
    // Rate limiting could be implemented here
    
    const body = await request.json();
    const { email } = body;
    
    if (!email) {
      return new Response(
        JSON.stringify({ 
          isAuthenticated: false, 
          message: 'Email is required' 
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
    
    // Validate email format before processing
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ 
          isAuthenticated: false, 
          message: 'Invalid email format' 
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
    
    console.log('[API verify-user] Verifying user:', email);
    const result = await verifyUserAuthentication(email);
    console.log('[API verify-user] Verification result:', result);
    
    return new Response(
      JSON.stringify(result), 
      { 
        status: result.isAuthenticated ? 200 : 401, 
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        } 
      }
    );
  } catch (error: any) {
    console.error('[API verify-user] Error:', error);
    return new Response(
      JSON.stringify({ 
        isAuthenticated: false, 
        message: `Error: ${error.message || 'Unknown error'}` 
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