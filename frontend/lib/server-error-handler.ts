/**
 * Server-side error handling utility
 * Provides consistent error handling for API routes
 */

interface ErrorState {
  retryAttempts: number;
  lastError: string | null;
  timestamp: number;
}

const ERROR_STATE_KEY = 'lana_server_error_state';
const MAX_RETRY_ATTEMPTS = 3;

/**
 * Handle error with retry logic for server-side operations
 * @param error - The error that occurred
 * @param customMessage - Custom message to include in response
 * @param retryAttempt - Current retry attempt number
 */
export function handleServerError(error: unknown, customMessage?: string, retryAttempt: number = 0): { success: false; message: string; retry: boolean } {
  console.error('[ServerErrorHandler] Error occurred:', error);
  
  // Increment retry attempts
  const retryAttempts = retryAttempt + 1;
  
  // If we've exceeded max attempts, return final error
  if (retryAttempts >= MAX_RETRY_ATTEMPTS) {
    return {
      success: false,
      message: customMessage || 'Operation failed after multiple attempts. Please try again later.',
      retry: false
    };
  }
  
  // Return retry suggestion
  return {
    success: false,
    message: customMessage || 'Temporary error occurred. Retrying...',
    retry: true
  };
}

/**
 * Create a standardized error response
 * @param message - Error message
 * @param status - HTTP status code
 */
export function createErrorResponse(message: string, status: number = 500) {
  return new Response(
    JSON.stringify({ 
      success: false, 
      message 
    }), 
    { 
      status,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      } 
    }
  );
}