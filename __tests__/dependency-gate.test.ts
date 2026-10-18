// @vitest-environment node
import { expect, it } from "vitest";
import { evaluateDependencyAudit } from "../scripts/check-dependency-advisories.mjs";
const now = new Date("2026-10-18T12:00:00Z");
const policy = { reviewedAt: "2026-10-18", exceptions: [{ package: "fixture", advisory: "GHSA-aaaa-bbbb-cccc", versions: ["1.0.0"], expires: "2026-11-18", reason: "Narrow reviewed rationale about a trusted tooling-only input surface." }] };
const lock = { packages: { "node_modules/fixture": { version: "1.0.0" } } };
const report = { vulnerabilities: { fixture: { severity: "high", nodes: ["node_modules/fixture"], via: [{ url: "https://github.com/advisories/GHSA-aaaa-bbbb-cccc", severity: "high" }] } } };
it("allows only the exact reviewed advisory and installed version, while reporting it unresolved", () => {
  expect(evaluateDependencyAudit(report, lock, policy, now)).toMatchObject({ errors: [], accepted: [expect.stringContaining("fixture")] });
});
it("fails on a new advisory even in a previously reviewed package", () => {
  const changed = structuredClone(report); changed.vulnerabilities.fixture.via[0].url = "https://github.com/advisories/GHSA-new1-new2-new3";
  expect(evaluateDependencyAudit(changed, lock, policy, now).errors.length).toBeGreaterThan(0);
});
it("never exempts a critical finding", () => {
  const changed = structuredClone(report); changed.vulnerabilities.fixture.severity = "critical";
  expect(evaluateDependencyAudit(changed, lock, policy, now).errors).toContain("Critical dependency finding: fixture");
});
it("fails expired and changed-version exceptions", () => {
  expect(evaluateDependencyAudit(report, lock, policy, new Date("2026-11-18T00:00:00Z")).errors.length).toBeGreaterThan(0);
  expect(evaluateDependencyAudit(report, { packages: { "node_modules/fixture": { version: "1.0.1" } } }, policy, now).errors.length).toBeGreaterThan(0);
});
it("fails on unavailable/incomplete audit data instead of reporting success", () => {
  expect(() => evaluateDependencyAudit({ error: "network" }, lock, policy, now)).toThrow();
});
