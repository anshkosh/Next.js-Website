import path from "path";

if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(path.resolve(process.cwd(), ".env"));
  } catch (e) {
    // Ignore if file doesn't exist
  }
}

import "../lib/jobs/workers/sync.worker";
console.log("Sync worker started.");
