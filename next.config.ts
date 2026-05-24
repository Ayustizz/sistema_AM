import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "bcryptjs", "@prisma/adapter-pg", "pg"],
  allowedDevOrigins: ["*.agent.cvm.dev", "*.cvm.dev"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
