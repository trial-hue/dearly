import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';

// Content Security Policy. Next.js needs inline scripts for hydration and inline styles for
// its font and image components; dev mode additionally needs eval for fast refresh.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? '' : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "media-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=()' },
];

const nextConfig: NextConfig = {
  output: 'standalone',
  agentRules: false,
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ['pino', 'pino-pretty', '@prisma/client', 'embedded-postgres'],
  outputFileTracingIncludes: {
    '/**': ['./node_modules/.prisma/client/**', './prisma/schema.prisma'],
  },
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};

export default nextConfig;
