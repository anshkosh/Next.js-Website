import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export async function checkPublicHealth(fetchImpl = fetch) {
  let commit;
  for (const [path, kind] of [["/api/cron/health", "database"], ["/", "homepage"], ["/.well-known/release.json", "release identity"]]) {
    let response;
    try {
      response = await fetchImpl(`https://www.anshkosh.com${path}`, { signal: AbortSignal.timeout(15000), cache: "no-store" });
    } catch {
      throw new Error(`Anshkosh ${kind} check is unreachable.`);
    }
    if (!response.ok) throw new Error(`Anshkosh ${kind} check failed: HTTP ${response.status}`);
    if (kind === "homepage") continue;
    let data;
    try { data = await response.json(); } catch { throw new Error(`Anshkosh ${kind} response is not valid JSON.`); }
    if (kind === "database" && (data?.status !== "ok" || data?.db !== "connected")) throw new Error("Anshkosh database health check failed.");
    if (kind === "release identity") {
      if (!data || typeof data.commit !== "string" || !/^[a-f0-9]{40}$/i.test(data.commit) ||
          typeof data.builtAt !== "string" || !Number.isFinite(Date.parse(data.builtAt))) {
        throw new Error("Anshkosh public release identity is missing or invalid.");
      }
      commit = data.commit;
    }
  }
  return commit;
}

// Importing this module for offline regressions must not contact production.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const commit = await checkPublicHealth();
    console.log(`Anshkosh public/database/release checks passed; serving ${commit}.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
