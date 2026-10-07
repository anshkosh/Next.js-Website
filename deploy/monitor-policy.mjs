// A deliberate pre-rollout hold must not hide a scanner outage after publishing.
export function scannerRequired(mode, releaseUsesScanner) {
  return mode !== "deferred" || releaseUsesScanner;
}

// Available memory includes reclaimable cache, unlike Linux's misleading free figure.
export function resourceWarnings({ availableBytes, totalBytes, load15, cpuCount }) {
  if (![availableBytes, totalBytes, load15, cpuCount].every(Number.isFinite) ||
      availableBytes < 0 || totalBytes <= 0 || availableBytes > totalBytes || load15 < 0 || cpuCount < 1) {
    throw new Error("Resource readings are invalid.");
  }
  const warnings = [];
  if (availableBytes < Math.max(256 * 1048576, totalBytes * .1)) warnings.push("VPS available memory is below 10% or 256 MiB.");
  // Load is not CPU utilization: blocked I/O also raises it. Use the sustained 15-minute reading.
  if (load15 > cpuCount * 2) warnings.push("VPS 15-minute load exceeds twice its CPU count; investigate CPU or I/O pressure.");
  return warnings;
}
