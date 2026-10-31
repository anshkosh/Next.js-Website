import { isolatedE2E } from "../isolated-e2e";

/**
 * Verifies a Cloudflare Turnstile token server-side.
 * @see https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */
export async function verifyTurnstileToken(token: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    // In development without keys configured, skip verification
    if (process.env.NODE_ENV === "development") {
      console.warn("[Turnstile] TURNSTILE_SECRET_KEY not set — skipping verification in development.");
      return true;
    }
    console.error("[Turnstile] TURNSTILE_SECRET_KEY is not configured.");
    return false;
  }

  try {
    const res = await fetch(
      isolatedE2E() ? "http://127.0.0.1:3181/turnstile" : "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ secret: secretKey, response: token }),
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!res.ok) return false;

    const data = (await res.json()) as { success: boolean };
    return data.success === true;
  } catch (err) {
    console.error("[Turnstile] Verification request failed:", err);
    return false;
  }
}
