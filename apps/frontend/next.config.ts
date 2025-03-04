import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizeCss: {
      tailwindcss: true
    }
  }
};

export default nextConfig;
