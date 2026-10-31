import { expect, it } from "vitest";
import { isolatedE2E } from "../lib/isolated-e2e";

const fixture: NodeJS.ProcessEnv = {
  NODE_ENV: "production", E2E_TEST_MODE: "1", E2E_PRODUCTION: "1",
  DATABASE_URL: "postgresql://test:isolated-test-password@127.0.0.1:5432/anshkosh_e2e",
  BETTER_AUTH_URL: "http://127.0.0.1:3100", REDIS_HOST: "127.0.0.1",
  BREVO_API_KEY: "test-only-no-external-delivery",
  TURNSTILE_SECRET_KEY: "isolated-turnstile-test-secret",
  R2_ACCOUNT_ID: "testing", R2_ACCESS_KEY_ID: "testing", R2_SECRET_ACCESS_KEY: "testing",
};

it("enables local protocol fixtures for an explicitly isolated production build", () => {
  expect(isolatedE2E(fixture)).toBe(true);
  expect(isolatedE2E({ NODE_ENV: "production" })).toBe(false);
  expect(isolatedE2E({ ...fixture, E2E_PRODUCTION: undefined })).toBe(false);
});

it.each([
  { DATABASE_URL: "postgresql://user:secret@production.example/app" },
  { DATABASE_URL: "postgresql://user:secret@127.0.0.1/production" },
  { DATABASE_URL: "postgresql://test:isolated-test-password@127.0.0.1/anshkosh_e2e?host=remote.example" },
  { BETTER_AUTH_URL: "https://www.anshkosh.com" },
  { REDIS_HOST: "remote.example" },
  { BREVO_API_KEY: "real-provider-key" },
  { TURNSTILE_SECRET_KEY: "real-challenge-key" },
  { R2_SECRET_ACCESS_KEY: "real-storage-key" },
])("fails closed when a test flag is combined with real service configuration: %j", overrides => {
  expect(() => isolatedE2E({ ...fixture, ...overrides })).toThrow("disposable local");
});
