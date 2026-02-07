import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "member.usher.org.tw",
      },
    ],
  },
};

export default nextConfig;
