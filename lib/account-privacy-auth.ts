import { createHash } from "node:crypto";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import { AccountPrivacyError } from "@/lib/account-privacy";

export async function privacyActor(requestHeaders: Headers) {
  const session = await auth.api.getSession({ headers: requestHeaders, query: { disableCookieCache: true } });
  if (!session?.user.emailVerified || session.user.banned) throw new AccountPrivacyError("Sign in with your verified account to continue.", 401);
  return { userId: session.user.id, sessionId: session.session.id };
}
export async function limitPrivacyAction(userId: string, purpose: string, limit: number) {
  const key = createHash("sha256").update(userId).digest("hex");
  if (!await checkRateLimit(`account-privacy:${purpose}:${key}`, limit, 3600)) throw new AccountPrivacyError("Too many attempts, or account protection is temporarily unavailable. Try again later.", 429);
}
