import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // During this migration we may have lint rules that fail the production build.
  // Allow builds to proceed while we iteratively fix TypeScript/ESLint issues.
  eslint: {
    // Re-enable lint enforcement during builds now that lint issues were fixed.
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
