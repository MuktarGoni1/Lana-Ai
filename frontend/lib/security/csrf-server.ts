// lib/security/csrf-server.ts - Server-side CSRF functions only
import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Generates a cryptographically secure CSRF token
 */
export function generateCSRFToken(): string {
  // Generate 32 random bytes and convert to base64url
  return randomBytes(32).toString('base64url');
}

/**
 * Validates a CSRF token against the stored token in cookies
 * Should be used server-side only
 */
export async function validateCSRFToken(token: string): Promise<boolean> {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  try {
    const cookieStore = await cookies();
    const storedToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;
    
    if (!storedToken) {
      return false;
    }
    
    // Use timing-safe comparison to prevent timing attacks
    return timingSafeEqual(token, storedToken);
  } catch (error) {
    console.error('[CSRF] Error validating token:', error);
    return false;
  }
}

/**
 * Constant-time comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Gets or creates CSRF token for the current request (server-side only)
 */
export async function getCSRFTokenServer(): Promise<string> {
  try {
    const cookieStore = await cookies();
    const existingToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;
    
    if (existingToken) {
      return existingToken;
    }
    
    // Generate new token if none exists
    const newToken = generateCSRFToken();
    
    // Note: In Next.js 15+, we can't set cookies from a server component
    // This function should only be called from API routes or middleware
    // The cookie will be set by the API route or middleware
    return newToken;
  } catch (error) {
    console.error('[CSRF] Error getting token:', error);
    throw new Error('Failed to get CSRF token');
  }
}

/**
 * Sets CSRF token cookie (to be used in API routes or middleware)
 */
export async function setCSRFTokenCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60, // 1 hour
    path: '/'
  });
}

/**
 * Middleware helper to validate CSRF token from request headers
 */
export async function validateCSRFMiddleware(req: Request): Promise<boolean> {
  const token = req.headers.get(CSRF_HEADER_NAME);
  
  if (!token) {
    return false;
  }
  
  return validateCSRFToken(token);
}

export { CSRF_COOKIE_NAME, CSRF_HEADER_NAME };