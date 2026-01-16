import type { NextConfig } from 'next';

/**
 * Next.js Configuration with SaaS-Level Security Headers
 *
 * Security measures implemented:
 * - Content Security Policy (CSP)
 * - XSS Protection
 * - Frame Options (Clickjacking protection)
 * - Content Type Options (MIME sniffing protection)
 * - Referrer Policy
 * - Permissions Policy
 * - HSTS (HTTP Strict Transport Security)
 *
 * CVE Protection:
 * - React 19.2.3+ (fixes CVE-2025-55182 RCE vulnerability)
 * - No Server Components rendering of untrusted data
 */

const securityHeaders = [
  {
    // Content Security Policy - Prevents XSS and data injection attacks
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "media-src 'self' data: blob:",
      "connect-src 'self' http://localhost:8000 https://api.coperniq.io https://api.anthropic.com https://api.cartesia.ai https://api.deepgram.com wss: ws:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(self), payment=(), usb=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'off',
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // Security headers for all routes
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/api/:path*',
        headers: [
          ...securityHeaders,
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-CSRF-Token' },
          { key: 'Access-Control-Max-Age', value: '86400' },
        ],
      },
    ];
  },

  // API routes are now handled by Next.js Route Handlers in src/app/api/
  // No rewrites needed for Vercel deployment

  // Image optimization with security (using remotePatterns instead of deprecated domains)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.coperniq.io',
        pathname: '/**',
      },
    ],
    dangerouslyAllowSVG: false,
  },

  // Server Actions security
  experimental: {
    serverActions: {
      bodySizeLimit: '1mb',
    },
  },
};

export default nextConfig;
