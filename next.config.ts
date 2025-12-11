import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // During this migration we may have lint rules that fail the production build.
  // Allow builds to proceed while we iteratively fix TypeScript/ESLint issues.
  eslint: {
    // Lint enforcement enabled - all issues have been fixed
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
