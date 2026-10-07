for (const url of ["https://www.anshkosh.com/api/cron/health", "https://www.anshkosh.com/"]) {
  const response = await fetch(url, { signal: AbortSignal.timeout(15000), cache: "no-store" });
  if (!response.ok) throw new Error(`Anshkosh public check failed: HTTP ${response.status}`);
  if (url.endsWith("/health") && (await response.json()).db !== "connected") throw new Error("Anshkosh database health check failed");
}
console.log("Anshkosh is reachable from outside the VPS; database health passed.");
