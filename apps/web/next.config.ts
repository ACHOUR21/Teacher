import type { NextConfig } from 'next';

// Allow the Railway/custom API host in CSP at build time
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:4000';
const apiOrigin = apiUrl.replace(/\/api\/v1\/?$/, '');
const wsOrigin = wsUrl.replace(/^http/, 'ws');

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://www.paypal.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https: http://localhost:*",
      `connect-src 'self' https://api.stripe.com https://www.paypal.com ${apiOrigin} ${wsOrigin} wss://*.eduai.app http://localhost:* ws://localhost:*`,
      "frame-src https://js.stripe.com https://www.paypal.com",
      "worker-src 'self' blob:",
      "media-src 'self' blob: https:",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: 'minio' },
      { protocol: 'https', hostname: 's3.amazonaws.com' },
      { protocol: 'https', hostname: '**.amazonaws.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
