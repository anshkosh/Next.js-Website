import { defineConfig, devices } from "@playwright/test";

const production = process.env.E2E_PRODUCTION === "1";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "launch.spec.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  expect: { timeout: process.env.CI ? 30000 : 5000 },
  reporter: process.env.CI ? [["line"], ["html", { open: "never" }], ["json", { outputFile: "test-results/browser-timings.json" }]] : "html",
  use: {
    actionTimeout: 30000,
    baseURL: "http://127.0.0.1:3100",
    // Model the trusted loopback proxy for API setup requests as well as pages.
    extraHTTPHeaders: { "x-real-ip": "198.18.0.1", "x-forwarded-for": "198.18.0.1" },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: [
    { command: "node e2e/fixtures/services.mjs", url: "http://127.0.0.1:3181/ready", reuseExistingServer: false, timeout: 30000 },
    { command: "npx tsx lib/jobs/workers/email.worker.ts", url: "http://127.0.0.1:3181/worker-ready", reuseExistingServer: false, timeout: 30000, env: production ? { NODE_ENV: "production" } : undefined },
    { command: `node node_modules/next/dist/bin/next ${production ? "start" : "dev --webpack --disable-source-maps"} --hostname 127.0.0.1 --port 3100`, url: "http://127.0.0.1:3100/api/cron/health", reuseExistingServer: false, timeout: 120000,
      stdout: "pipe",
      env: { NODE_OPTIONS: "--max-old-space-size=8192", ...(production ? { NODE_ENV: "production" } : {}) },
    },
  ],
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], ...(process.env.E2E_BROWSER_CHANNEL ? { channel: process.env.E2E_BROWSER_CHANNEL } : {}) },
    },
  ],
});
