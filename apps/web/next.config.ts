import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    domains: ['localhost', 'minio', 's3.amazonaws.com'],
  },
  experimental: {
    serverComponentsExternalPackages: [],
  },
};

export default nextConfig;
