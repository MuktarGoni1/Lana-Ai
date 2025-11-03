/** @type {import('next').NextConfig} */
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
  // Enable SWC minification to prevent conflicts with next/font
  swcMinify: true,
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
            value: 'public, max-age=300, s-maxage=300',
          },
        ],
      },
    ]
  },
  outputFileTracingRoot: 'c:\\Users\\Muktar Goni Usman\\.qoder\\lana-frontend\\lana-ai',
};

export default nextConfig;