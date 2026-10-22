import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  devIndicators: false,
  // Optional isolated build directory for testing without interrupting the normal preview.
  distDir: process.env.RUMERIANNE_BUILD_DIR || '.next',
};

export default nextConfig;
