// Unified API configuration for the entire application
// This file ensures consistent API base configuration across all components

/**
 * Get the API base URL based on environment configuration
 * 
 * When NEXT_PUBLIC_USE_PROXY=true, calls use relative paths and are proxied by Next
 * When NEXT_PUBLIC_USE_PROXY=false or not set, calls use the direct API base URL
 * 
 * @returns API base URL string
 */
export function getApiBase(): string {
  // Check if we should use proxy mode
  const useProxy = process.env.NEXT_PUBLIC_USE_PROXY === 'true';
  
  if (useProxy) {
    // In proxy mode, use relative paths that will be handled by Next.js rewrites
    return '';
  } else {
    // In direct mode, use the configured API base or fallback to the live backend
    return process.env.NEXT_PUBLIC_API_BASE || "https://api.lanamind.com";
  }
}

// Export the API base as a constant for backward compatibility
export const API_BASE = getApiBase();