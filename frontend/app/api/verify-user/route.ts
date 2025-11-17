import { verifyUserAuthentication } from '@/lib/services/authVerificationService';
import { NextRequest } from 'next/server';
import { z } from 'zod';

const BodySchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    // Log request for debugging
    console.log('[API verify-user] Received request');
    
    // Check if the request is from a trusted source
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    
    // Rate limiting could be implemented here
    
    const json = await request.json();
    console.log('[API verify-user] Request body:', json);
    
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      console.log('[API verify-user] Validation failed:', parsed.error);
      return new Response(
        JSON.stringify({ 
          isAuthenticated: false, 
          message: 'Please provide a valid email address.' 
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
    
    const { email } = parsed.data;
    console.log('[API verify-user] Parsed email:', email);
    
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