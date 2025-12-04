// next.config.mjs
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { withSentryConfig } from "@sentry/nextjs";

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  /* config options here */
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    // Enable Turbopack for faster builds in development
    turbo: {
      rules: {
        "*.svg": {
          loaders: ["@svgr/webpack"],
          as: "*.js",
        },
      },
    },
    // Enable experimental client trace metadata for better debugging
    clientTraceMetadata: [
      "next.config.mjs",
      "sentry.client.config.ts",
      "sentry.edge.config.ts",
      "sentry.server.config.ts",
    ],
  },
  // Configure image optimization
  images: {
    domains: ['ieqqsgpaivxmcgcflanu.supabase.co'], // Allow Supabase storage CDN
  },
  // Configure headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
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
    if (!apiBase) {
      console.warn('NEXT_PUBLIC_API_BASE not set, API proxying will not work');
      return [];
    }
    
    // Log the API base for debugging
    console.log('API Base URL:', apiBase);
    
    // Define frontend API routes that should NOT be proxied to backend
    const frontendRoutes = [
      'auth/verify-email',
      'check-user',
      'verify-user',
      'test-auth',
      'deployment-test',
      'supabase-test',
      'avatar/streams',
      'tts',
      'quiz',
      'subscription/status',
      'structured-lesson'
    ];
    
    // Log the exclusion pattern for debugging
    const exclusionPattern = `/api/:path((?!${frontendRoutes.join('|')}).*)`;
    console.log('API rewrite exclusion pattern:', exclusionPattern);
    
    return [
      // Exclude frontend API routes that should be handled locally
      { 
        source: exclusionPattern, 
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
export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);