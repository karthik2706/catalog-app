import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  // Move serverComponentsExternalPackages to serverExternalPackages
  serverExternalPackages: ['@aws-sdk/client-s3'],
  // Increase body size limit for file uploads
  experimental: {
    serverComponentsExternalPackages: ['@aws-sdk/client-s3'],
  },
  // Configure API routes for larger payloads
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export default nextConfig;
