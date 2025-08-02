import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 15 has server actions enabled by default, so we don't need experimental flag
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
