import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
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
      {
        protocol: "https",
        hostname: "www.tcu.edu.tw",
      },
      {
        protocol: "https",
        hostname: "www.tfrd.org.tw",
      },
      // Dev: admin-uploaded images served from Laravel storage
      ...(process.env.NODE_ENV === "development"
        ? [{ protocol: "http" as const, hostname: "localhost", port: "8001" }]
        : []),
    ],
  },
};

export default nextConfig;
