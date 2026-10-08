import { describe, expect, it } from "vitest";
import { scannerRequired, resourceWarnings, sanitizeOnlyFromSource } from "../deploy/monitor-policy.mjs";
import { readFileSync } from "node:fs";
describe("scanner monitoring rollout policy", () => {
  it("requires scanning by default", () => expect(scannerRequired(undefined, false)).toBe(true));
  it("allows an explicit pre-rollout hold without claiming antivirus readiness", () => expect(scannerRequired("deferred", false)).toBe(false));
  it("never hides a scanner outage once a scanner-dependent release is live", () => expect(scannerRequired("deferred", true)).toBe(true));
  it("does not treat misspelled policy values as a bypass", () => expect(scannerRequired("deferrred", false)).toBe(true));
});

describe("scanner monitoring in sanitize-only upload mode", () => {
  it("does not demand ClamAV while the release deliberately runs without it", () => {
    expect(scannerRequired(undefined, true, true)).toBe(false);
    expect(scannerRequired("deferred", true, true)).toBe(false);
  });
  it("keeps the original rule when sanitize-only is not set", () => {
    expect(scannerRequired("deferred", true, false)).toBe(true);
    expect(scannerRequired(undefined, false, false)).toBe(true);
  });
  it("recognises only the exact mode line", () => {
    const line = (text: string) => `${text}${String.fromCharCode(10)}`;
    expect(sanitizeOnlyFromSource(line('export const UPLOAD_SCAN_MODE = "sanitize-only" as "clamav" | "sanitize-only";'))).toBe(true);
    expect(sanitizeOnlyFromSource(line('export const UPLOAD_SCAN_MODE = "clamav" as "clamav" | "sanitize-only";'))).toBe(false);
    expect(sanitizeOnlyFromSource(line('// export const UPLOAD_SCAN_MODE = "sanitize-only";'))).toBe(false);
    expect(sanitizeOnlyFromSource(line('export const UPLOAD_SCAN_MODE_X = "sanitize-only";'))).toBe(false);
    expect(sanitizeOnlyFromSource(undefined)).toBe(false);
  });
  it("matches the real mode file the routes use", () => {
    expect(sanitizeOnlyFromSource(readFileSync("lib/uploads/scan-mode.ts", "utf8"))).toBe(true);
  });
});

describe("resource pressure monitoring", () => {
  const healthy = { totalBytes: 4 * 1024 ** 3, availableBytes: 2 * 1024 ** 3, load15: 1, cpuCount: 2 };
  it("accepts healthy memory and sustained load", () => expect(resourceWarnings(healthy)).toEqual([]));
  it("detects low available memory on a large VPS", () => expect(resourceWarnings({ ...healthy, availableBytes: 300 * 1048576 })).toHaveLength(1));
  it("retains a minimum headroom floor for a small VPS", () => expect(resourceWarnings({ ...healthy, totalBytes: 1024 ** 3, availableBytes: 200 * 1048576 })).toHaveLength(1));
  it("detects sustained CPU or I/O pressure", () => expect(resourceWarnings({ ...healthy, load15: 4.1 })).toHaveLength(1));
  it("reports both simultaneous problems", () => expect(resourceWarnings({ ...healthy, availableBytes: 100 * 1048576, load15: 5 })).toHaveLength(2));
  it("rejects unavailable readings instead of silently claiming health", () => expect(() => resourceWarnings({ ...healthy, availableBytes: NaN })).toThrow());
});
