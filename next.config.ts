import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "member.usher.org.tw",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8001",
      },
    ],
  },
};

export default nextConfig;
