// lib/security/csrf.ts - Main export file that delegates to appropriate modules

// Re-export server-side functions (these should only be used in server components/API routes)
export { 
  generateCSRFToken, 
  validateCSRFToken, 
  getCSRFTokenServer, 
  setCSRFTokenCookie, 
  validateCSRFMiddleware,
  CSRF_COOKIE_NAME, 
  CSRF_HEADER_NAME 
} from './csrf-server';

// Re-export client-side functions (safe for client components)
export { 
  getCSRFTokenClient, 
  getCSRFToken,
  CSRF_COOKIE_NAME as CLIENT_CSRF_COOKIE_NAME
} from './csrf-client';
