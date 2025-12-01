/** @type {import('next').NextConfig} */
// Add Sentry configuration
const { withSentryConfig } = require('@sentry/nextjs');

const nextConfig = {
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    // Use the supported option name in Next.js
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: false, // Enable image optimization
  },
  // Remove console logs in production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Disable production browser source maps for performance
  productionBrowserSourceMaps: false,
  allowedDevOrigins: ['192.168.0.187', 'localhost'],
  // Bundle optimization: disable optimizePackageImports for dev stability
  experimental: {
    // optimizePackageImports disabled due to HMR/runtime issues
  },
  // Disable React compiler to prevent conflicts
  reactCompiler: false,
  // Turbopack configuration to fix HMR issues
  turbopack: {
    resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'],
  },
  // Turbopack is stable; remove deprecated experimental.turbo config
  // If you need custom SVG handling, prefer using React components or next/image.
  
  // Performance optimizations
  poweredByHeader: false,
  compress: true,
  
  // Headers for better caching
  async headers() {
    const isProd = process.env.NODE_ENV === 'production'
    // Allow http connections in development for LAN/IP access; keep strict in prod
    const connectSrc = isProd
      ? "connect-src 'self' https: wss:"
      : "connect-src 'self' http: https: wss:"

    // Build CSP dynamically
    const csp = [
      "default-src 'self'",
      `script-src 'self' ${isProd ? '' : "'unsafe-eval'"} 'unsafe-inline'`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      connectSrc,
      // Allow audio blobs/data URLs for TTS playback
      "media-src 'self' blob: data:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      // Only upgrade insecure requests in production (https)
      ...(isProd ? ["upgrade-insecure-requests"] : []),
    ].join('; ')
    return [
      // Global security headers for app pages
      {
        source: '/((?!_next|api).*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=(), payment=(), usb=()' },
          // CSP: dev-friendly for LAN/IP, strict in production
          { key: 'Content-Security-Policy', value: csp },
          // HSTS only matters in production
          ...(isProd ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' }] : []),
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store',
          },
        ],
      },
    ]
  },
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE;
    if (!apiBase) return [];
    return [
      // Exclude frontend API routes that should be handled locally
      { 
        source: '/api/:path((?!auth/verify-email|check-user|verify-user|test-auth|deployment-test|supabase-test|avatar/streams|tts|quiz|subscription/status|structured-lesson).*)', 
        destination: `${apiBase}/api/:path*` 
      },
      // Ensure legacy calls to /history are correctly forwarded to /api/history
      { source: '/history', destination: `${apiBase}/api/history` },
      // If a reset route is added in backend, forward it to /api/reset; otherwise, this remains unused
      { source: '/reset', destination: `${apiBase}/api/reset` },
      { source: '/health', destination: `${apiBase}/health` },
    ];
  },
  // Disable custom outputFileTracingRoot in dev to avoid Turbopack path issues on Windows
  // outputFileTracingRoot: undefined,
};

// Sentry configuration
const sentryWebpackPluginOptions = {
  org: "lana-ai",
  project: "lana-frontend",
  silent: true,
};

// Export the wrapped config
module.exports = withSentryConfig(nextConfig, sentryWebpackPluginOptions);