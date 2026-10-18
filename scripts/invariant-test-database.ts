// Keep this guard side-effect-free so rejection is tested without a DB connection.
export function invariantTestDatabaseUrl(value?: string) {
  const url = new URL(value || "http://invalid");
  // Prisma accepts query-string host overrides, including Unix socket paths.
  // These disposable fixtures need no connection parameters or fragments.
  if (!["postgres:", "postgresql:"].includes(url.protocol)
    || !["localhost", "127.0.0.1"].includes(url.hostname)
    || url.pathname !== "/anshkosh_e2e" || url.search || url.hash) {
    throw new Error("Disposable local anshkosh_e2e database without URL overrides required");
  }
  return url.toString();
}
