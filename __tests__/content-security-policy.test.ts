// @vitest-environment node
import { expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { contentSecurityPolicy } from "@/lib/content-security-policy";
import { proxy } from "../proxy";

it("uses fresh matching SSR/response nonces and ignores visitor-supplied policy headers", () => {
  vi.stubEnv("NODE_ENV", "production");
  try {
    const request = new NextRequest("https://www.anshkosh.com/settings", { headers: {
      "x-nonce": "attacker-value", "Content-Security-Policy": "script-src * 'unsafe-inline'",
    } });
    const first = proxy(request);
    const second = proxy(request);
    const policy = first.headers.get("Content-Security-Policy")!;
    const nonce = first.headers.get("x-middleware-request-x-nonce")!;
    expect(nonce).toMatch(/^[A-Za-z0-9+/]{22}==$/);
    expect(policy).toContain(`'nonce-${nonce}'`);
    expect(first.headers.get("x-middleware-request-content-security-policy")).toBe(policy);
    expect(second.headers.get("Content-Security-Policy")).not.toBe(policy);
    expect(policy).not.toContain("attacker-value");
    expect(first.headers.get("Cache-Control")).toBe("private, no-store");
    const scripts = policy.split(";").find(part => part.trim().startsWith("script-src"))!;
    expect(scripts).toContain("'strict-dynamic'");
    expect(scripts).not.toMatch(/unsafe-inline|unsafe-eval|\*/);
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("base-uri 'none'");
    expect(policy).toContain("form-action 'self'");
    expect(policy).toContain("frame-ancestors 'self'");
  } finally { vi.unstubAllEnvs(); }
});

it("allows CAPTCHA and approved video embeds, with development-only debugging allowances", () => {
  const production = contentSecurityPolicy("nonce");
  const frames = production.split(";").find(part => part.trim().startsWith("frame-src"))!;
  expect(frames).toContain("https://challenges.cloudflare.com");
  expect(frames).toContain("https://www.youtube.com");
  expect(frames).toContain("https://player.vimeo.com");
  expect(frames).not.toContain("*");
  expect(production).not.toContain("unsafe-eval");
  expect(production).not.toContain("ws://");
  const development = contentSecurityPolicy("nonce", true);
  expect(development).toContain("'unsafe-eval'");
  expect(development).toContain("ws://127.0.0.1:*");
  expect(development).not.toContain("upgrade-insecure-requests");
});
