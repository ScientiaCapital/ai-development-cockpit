const withPWA = require('next-pwa')

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      // API routes for MCP integration
      {
        source: '/api/mcp/:path*',
        destination: '/api/mcp/:path*',
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ]
  },
}

module.exports = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})(nextConfig)