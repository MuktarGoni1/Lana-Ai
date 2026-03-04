import { NextRequest, NextResponse } from 'next/server';
import { getCSRFTokenServer, setCSRFTokenCookie } from '@/lib/security/csrf-server';

export async function GET(request: NextRequest) {
  try {
    // Generate or get existing CSRF token
    const token = await getCSRFTokenServer();
    
    // Set the cookie (this makes it available to client-side code)
    await setCSRFTokenCookie(token);
    
    return NextResponse.json({ token });
  } catch (error) {
    console.error('[CSRF API] Error generating token:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}