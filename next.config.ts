import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "member.usher.org.tw",
      },
      {
        protocol: "https",
        hostname: "www.excelsiorgroup.com.tw",
      },
      {
        protocol: "https",
        hostname: "static.wixstatic.com",
      },
      // Dev: admin-uploaded images served from Laravel storage
      ...(process.env.NODE_ENV === "development"
        ? [{ protocol: "http" as const, hostname: "localhost", port: "8001" }]
        : []),
    ],
  },
};

export default nextConfig;
