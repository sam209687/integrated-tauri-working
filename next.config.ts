/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove output: "export" - your app needs a server for API routes
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
  },
};

export default nextConfig;