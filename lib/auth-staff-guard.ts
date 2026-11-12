import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import type { BetterAuthOptions } from "better-auth";
import { authEndpointBlock, isGuardedAuthPath, sessionTwoFactorVerified } from "./staff-access";

// Better Auth guards kept apart from lib/auth.ts (which needs the database)
// so tests can run the real hooks.

export const staffSessionOptions = {
  additionalFields: {
    // No Better Auth default: a rotated session keeps its predecessor's value,
    // a fresh one gets the database default (false). See sessionTwoFactorVerified.
    twoFactorVerified: { type: "boolean", required: false, input: false },
  },
} satisfies BetterAuthOptions["session"];

export const staffDatabaseHooks = {
  session: {
    create: {
      before: async (session, ctx) => ({
        data: { ...session, twoFactorVerified: sessionTwoFactorVerified(ctx?.path, session) },
      }),
    },
  },
} satisfies BetterAuthOptions["databaseHooks"];

export const authRequestHooks = {
  before: createAuthMiddleware(async (ctx) => {
    if (ctx.path === "/send-verification-email") {
      // Better Auth checks that a signed-in caller can only resend to their own address.
      if (!await getSessionFromCtx(ctx)) {
        throw new APIError("UNAUTHORIZED", { message: "Sign in to request a verification email." });
      }
      return;
    }
    // Better Auth's own endpoints check only the role. Apply the staff two-factor
    // rules to its admin API and to the endpoints that manage a second factor.
    if (!isGuardedAuthPath(ctx.path)) return;
    const reason = authEndpointBlock(ctx.path, await getSessionFromCtx(ctx));
    if (reason) throw new APIError("FORBIDDEN", { message: reason });
  }),
} satisfies BetterAuthOptions["hooks"];

export const authIpAddressOptions = {
  // nginx overwrites X-Real-IP with the connecting address and appends to
  // X-Forwarded-For. Better Auth discards a multi-value X-Forwarded-For, which
  // would put those visitors in one shared sign-in rate-limit bucket.
  ipAddressHeaders: ["x-real-ip"],
} satisfies NonNullable<BetterAuthOptions["advanced"]>["ipAddress"];
