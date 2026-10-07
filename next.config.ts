import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.E2E_TEST_MODE === "1" ? (process.env.NODE_ENV === "production" ? ".next-e2e-build" : ".next-e2e") : ".next",
  reactCompiler: true,
  serverExternalPackages: ["bullmq"],
  compress: true,
  poweredByHeader: false,
  images: {
    formats: ["image/webp"],
    qualities: [75, 85],
  },
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
      ],
    }];
  },
};

export default nextConfig;
