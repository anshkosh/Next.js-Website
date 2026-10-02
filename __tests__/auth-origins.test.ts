// @vitest-environment node
import { betterAuth } from "better-auth";
import { describe, expect, it } from "vitest";
import { getTrustedAuthOrigins } from "../lib/auth-origins";

function makeAuth(baseURL = "https://www.anshkosh.com") {
  return betterAuth({
    baseURL,
    secret: "origin-regression-test-only-not-a-production-secret",
    trustedOrigins: getTrustedAuthOrigins,
    emailAndPassword: { enabled: true },
    // Tests must exercise production security, not Better Auth's test-mode bypass.
    advanced: { disableOriginCheck: false, disableCSRFCheck: false },
    rateLimit: { enabled: false },
    logger: { disabled: true },
  });
}

function probe(auth: ReturnType<typeof makeAuth>, origin: string, callbackURL?: string) {
  return auth.handler(new Request(`${auth.options.baseURL}/api/auth/sign-out`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin,
      // Not an auth session: exercises the origin check without creating a user.
      cookie: "origin_regression=1",
    },
    body: JSON.stringify(callbackURL ? { callbackURL } : {}),
  }));
}

describe("authentication origin security", () => {
  it.each(["https://www.anshkosh.com", "https://anshkosh.com"])(
    "accepts the official origin %s", async origin => {
      const response = await probe(makeAuth(), origin);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ success: true });
    },
  );

  it.each([
    "https://origin-check.invalid",
    "https://anshkosh.com.evil.invalid",
    "https://unapproved.anshkosh.com",
    "http://anshkosh.com",
    "http://66.116.248.164",
    "http://localhost:3011",
  ])("rejects unapproved production origin %s", async origin => {
    const response = await probe(makeAuth(), origin);
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ code: "INVALID_ORIGIN" });
  });

  it("retains the configured local development base URL", async () => {
    const response = await probe(makeAuth("http://localhost:3011"), "http://localhost:3011");
    expect(response.status).toBe(200);
  });

  it("still blocks external callback redirects from a trusted origin", async () => {
    const response = await probe(makeAuth(), "https://anshkosh.com", "https://origin-check.invalid");
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ code: "INVALID_CALLBACK_URL" });
  });

  it.each([
    ["https://www.anshkosh.com", 400, "PASSWORD_TOO_SHORT"],
    ["https://anshkosh.com", 400, "PASSWORD_TOO_SHORT"],
    ["https://origin-check.invalid", 403, "INVALID_ORIGIN"],
  ])("checks first-time signup from %s without creating an account", async (origin, status, code) => {
    const auth = makeAuth();
    const response = await auth.handler(new Request("https://www.anshkosh.com/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json", origin, "sec-fetch-site": "same-origin" },
      // Password length is checked before user creation; no account or email is produced.
      body: JSON.stringify({ name: "Origin diagnostic", email: "origin-check@example.invalid", password: "x" }),
    }));
    expect(response.status).toBe(status);
    expect(await response.json()).toMatchObject({ code });
  });
});
