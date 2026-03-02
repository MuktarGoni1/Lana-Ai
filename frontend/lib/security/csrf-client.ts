// lib/security/csrf-client.ts - Client-side CSRF functions only
const CSRF_COOKIE_NAME = 'csrf_token';

/**
 * Client-side helper to get CSRF token from cookie
 * Note: This requires the cookie to be accessible (not httpOnly)
 * For httpOnly cookies, use an API endpoint instead
 */
export function getCSRFTokenClient(): string | null {
  if (typeof document === 'undefined') {
    return null;
  }
  
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === CSRF_COOKIE_NAME) {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * Client-side helper to get CSRF token via API call
 * This works with httpOnly cookies
 */
export async function getCSRFToken(): Promise<string | null> {
  try {
    // First try to get from accessible cookie
    const clientToken = getCSRFTokenClient();
    if (clientToken) {
      return clientToken;
    }
    
    // If not available, fetch from API endpoint
    const response = await fetch('/api/csrf/token', {
      method: 'GET',
      credentials: 'include'
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.token || null;
  } catch (error) {
    console.error('[CSRF] Error getting token:', error);
    return null;
  }
}

export { CSRF_COOKIE_NAME };