import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "launch.spec.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  // CI's on-demand server may still be completing a save after an input action.
  expect: { timeout: process.env.CI ? 30000 : 5000 },
  reporter: process.env.CI ? [["line"], ["html", { open: "never" }]] : "html",
  use: {
    actionTimeout: 30000,
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: [
    { command: "node e2e/fixtures/services.mjs", url: "http://127.0.0.1:3181/ready", reuseExistingServer: false, timeout: 30000 },
    { command: "npx tsx lib/jobs/workers/email.worker.ts", url: "http://127.0.0.1:3181/worker-ready", reuseExistingServer: false, timeout: 30000 },
    { command: "node node_modules/next/dist/bin/next dev --webpack --disable-source-maps --hostname 127.0.0.1 --port 3100", url: "http://127.0.0.1:3100/api/cron/health", reuseExistingServer: false, timeout: 120000,
      // Keep cold compilation/startup evidence when the database readiness probe fails.
      stdout: "pipe",
      env: { NODE_OPTIONS: "--max-old-space-size=5120" },
    },
  ],
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], ...(process.env.E2E_BROWSER_CHANNEL ? { channel: process.env.E2E_BROWSER_CHANNEL } : {}) },
    },
  ],
});
