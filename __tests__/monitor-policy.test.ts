import { describe, expect, it } from "vitest";
import { scannerRequired, resourceWarnings } from "../deploy/monitor-policy.mjs";
describe("scanner monitoring rollout policy", () => {
  it("requires scanning by default", () => expect(scannerRequired(undefined, false)).toBe(true));
  it("allows an explicit pre-rollout hold without claiming antivirus readiness", () => expect(scannerRequired("deferred", false)).toBe(false));
  it("never hides a scanner outage once a scanner-dependent release is live", () => expect(scannerRequired("deferred", true)).toBe(true));
  it("does not treat misspelled policy values as a bypass", () => expect(scannerRequired("deferrred", false)).toBe(true));
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
