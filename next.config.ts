import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.E2E_TEST_MODE === "1" ? (process.env.NODE_ENV === "production" ? ".next-e2e-build" : ".next-e2e") : ".next",
  reactCompiler: true,
  serverExternalPackages: ["bullmq"],
  compress: true,
  poweredByHeader: false,
  ...(process.env.E2E_TEST_MODE === "1" && process.env.NODE_ENV !== "production" ? {
    // The serial browser journey revisits routes over several minutes. Keep
    // their compiled entries instead of repeatedly rebuilding evicted pages.
    onDemandEntries: { maxInactiveAge: 20 * 60 * 1000, pagesBufferLength: 100 },
    experimental: {
      // Keep the isolated browser session alive through on-demand compilation.
      // V8's heap limit still fails the job on a real out-of-memory condition.
      devMemoryThresholdRestart: false,
      webpackMemoryOptimizations: true,
    },
  } : {}),
  images: {
    formats: ["image/webp"],
    qualities: [75, 85],
  },
  async redirects() {
    return [
      { source: "/favicon.ico", destination: "/icon.svg", permanent: true },
      // Only map legacy campaigns with a verified current equivalent.
      { source: "/campaigns/cane-theory", destination: "/startups/cane-theory", permanent: true },
    ];
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
