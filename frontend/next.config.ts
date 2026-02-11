import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  // Absolute root for Turbopack (avoids "multiple lockfiles" warning on Vercel)
  turbopack: {
    root: path.resolve(process.cwd()),
  },
};

export default nextConfig;
