import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "launch.spec.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    actionTimeout: 30000,
    baseURL: "http://127.0.0.1:3100",
    trace: "on-first-retry",
  },
  webServer: [
    { command: "node e2e/fixtures/services.mjs", url: "http://127.0.0.1:3181/ready", reuseExistingServer: false, timeout: 30000 },
    { command: "npx tsx lib/jobs/workers/email.worker.ts", url: "http://127.0.0.1:3181/worker-ready", reuseExistingServer: false, timeout: 30000 },
    // Next's dev server restarts itself at 80% of the heap limit, which dropped in-flight requests and cost minutes of cold
    // compiling mid-test on the small CI runner. A 3 GB limit moves that point beyond a full run and still fits the runner.
    { command: "npx next dev --webpack --hostname 127.0.0.1 --port 3100", url: "http://127.0.0.1:3100/api/cron/health", reuseExistingServer: false, timeout: 120000, env: { NODE_OPTIONS: "--max-old-space-size=3072" } },
  ],
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], ...(process.env.E2E_BROWSER_CHANNEL ? { channel: process.env.E2E_BROWSER_CHANNEL } : {}) },
    },
  ],
});
