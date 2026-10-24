import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  devIndicators: false,
  turbopack: { root: process.cwd() },
  // Optional isolated build directory for testing without interrupting the normal preview.
  distDir: process.env.RUMERIANNE_BUILD_DIR || '.next',
};

export default nextConfig;
