// Production builds in CI use real application behavior with local protocol
// fixtures. These flags alone cannot redirect a deployed site's integrations.
export function isolatedE2E(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.E2E_TEST_MODE !== "1") return false;
  if (env.NODE_ENV === "production" && env.E2E_PRODUCTION !== "1") return false;
  try {
    const database = new URL(env.DATABASE_URL || "");
    const auth = new URL(env.BETTER_AUTH_URL || "");
    if (!["127.0.0.1", "localhost"].includes(database.hostname) || database.pathname !== "/anshkosh_e2e" || database.search ||
      database.username !== "test" || database.password !== "isolated-test-password" ||
      auth.href !== "http://127.0.0.1:3100/" ||
      !["127.0.0.1", "localhost"].includes(env.REDIS_HOST || "") ||
      env.BREVO_API_KEY !== "test-only-no-external-delivery" ||
      env.R2_ACCOUNT_ID !== "testing" || env.R2_ACCESS_KEY_ID !== "testing" || env.R2_SECRET_ACCESS_KEY !== "testing") throw new Error();
    return true;
  } catch {
    throw new Error("E2E integrations require the disposable local database, auth origin, Redis and synthetic provider credentials.");
  }
}
