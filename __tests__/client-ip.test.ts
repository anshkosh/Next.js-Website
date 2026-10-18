// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import { clientIp } from "@/lib/utils/client-ip";
afterEach(() => vi.unstubAllEnvs());
it("ignores client-prepended forwarded addresses", () => {
  vi.stubEnv("NODE_ENV", "production");
  expect(clientIp(new Headers({ "x-real-ip": "192.0.2.5", "x-forwarded-for": "attacker, 198.51.100.7" }))).toBe("192.0.2.5");
});
it.each([{}, { "x-real-ip": "nonsense" }, { "x-forwarded-for": "192.0.2.5" }])("fails closed without the trusted production proxy header", values => {
  vi.stubEnv("NODE_ENV", "production");
  expect(() => clientIp(new Headers(values as Record<string, string>))).toThrow("Trusted client address");
});
