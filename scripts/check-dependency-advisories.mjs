import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function evaluateDependencyAudit(report, lock, policy, now = new Date()) {
  if (!report || report.error || typeof report.vulnerabilities !== "object" || !lock?.packages || !Array.isArray(policy?.exceptions)) throw new Error("Missing or invalid dependency audit data");
  const errors = [];
  const accepted = new Set();
  const seen = new Set();
  function inspect(name) {
    if (seen.has(name)) return;
    seen.add(name);
    const entry = report.vulnerabilities[name];
    if (!entry || !Array.isArray(entry.via) || !entry.via.length) { errors.push(`Unresolved advisory metadata: ${name}`); return; }
    if (entry.severity === "critical") errors.push(`Critical dependency finding: ${name}`);
    for (const via of entry.via) {
      if (typeof via === "string") { inspect(via); continue; }
      const advisory = typeof via.url === "string" ? via.url.match(/\/(GHSA-[a-z0-9-]+)$/i)?.[1] : undefined;
      const exception = policy.exceptions.find(item => item.package === name && item.advisory === advisory);
      if (!exception || via.severity === "critical") { errors.push(`Unreviewed advisory: ${name} ${advisory || "unknown"}`); continue; }
      const expires = new Date(`${exception.expires}T00:00:00Z`);
      const reviewed = new Date(`${policy.reviewedAt}T00:00:00Z`);
      if (!Number.isFinite(expires.getTime()) || !Number.isFinite(reviewed.getTime()) || now >= expires || expires.getTime() - reviewed.getTime() > 31 * 86400000) {
        errors.push(`Expired/invalid dependency exception: ${name} ${advisory}`); continue;
      }
      if (!Array.isArray(entry.nodes) || !entry.nodes.length || entry.nodes.some(path => !exception.versions?.includes(lock.packages[path]?.version))) {
        errors.push(`Dependency exception version changed: ${name} ${advisory}`); continue;
      }
      if (typeof exception.reason !== "string" || exception.reason.length < 40) { errors.push(`Missing exception rationale: ${name}`); continue; }
      accepted.add(`${name} ${advisory} (review expires ${exception.expires})`);
    }
  }
  for (const name of Object.keys(report.vulnerabilities)) inspect(name);
  return { errors: [...new Set(errors)], accepted: [...accepted] };
}

function main() {
  // Fixed command/arguments only; Windows needs the npm command shim.
  const result = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["audit", "--json"], {
    encoding: "utf8", timeout: 120000, maxBuffer: 8 * 1024 * 1024, shell: process.platform === "win32",
  });
  if (result.error || ![0, 1].includes(result.status)) throw new Error("Dependency audit service/command unavailable; failing closed");
  const report = JSON.parse(result.stdout);
  const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
  const policy = JSON.parse(readFileSync("security/dependency-exceptions.json", "utf8"));
  const outcome = evaluateDependencyAudit(report, lock, policy);
  for (const item of outcome.accepted) console.warn(`KNOWN UNRESOLVED: ${item}`);
  for (const error of outcome.errors) console.error(error);
  console.log(`Dependency gate: ${report.metadata?.vulnerabilities?.total ?? "unknown"} affected package entries; ${outcome.accepted.length} narrowly reviewed advisories remain unresolved; ${outcome.errors.length} policy failures.`);
  if (outcome.errors.length) process.exitCode = 1;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch { console.error("Dependency gate could not complete; no clean audit is asserted."); process.exitCode = 1; }
}
