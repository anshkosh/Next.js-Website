import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { admin, twoFactor } from "better-auth/plugins";
import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { db } from "./db";
import { getTrustedAuthOrigins } from "./auth-origins";
import { accountAdminOptions } from "./auth-roles";
import { accountProfileFields } from "./account-profile";
import { blocksTwoFactorDisable, hasStaffAccess, isBuiltInAdminEndpoint, sessionTwoFactorVerified, TWO_FACTOR_ISSUER } from "./staff-access";

export const auth = betterAuth({
  appName: TWO_FACTOR_ISSUER,
  trustedOrigins: getTrustedAuthOrigins,
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  user: {
    additionalFields: accountProfileFields,
    changeEmail: {
      enabled: true,
      sendChangeEmailConfirmation: async ({ user, newEmail, url }) => {
        const { sendEmail } = await import("./email/adapter");
        const { renderEmailTemplate } = await import("./email/templates");
        await sendEmail({
          to: user.email,
          subject: "Confirm your Anshkosh email change",
          html: await renderEmailTemplate("email_change", { userName: user.name, newEmail, url }),
          text: `You asked to change your Anshkosh email to ${newEmail}. Confirm the request: ${url}\nWe will then send a verification link to the new address. If you did not request this, ignore this email.`,
        });
      },
    },
  },
  session: {
    additionalFields: {
      // No Better Auth default: a rotated session keeps its predecessor's value,
      // a fresh one gets the database default (false). See sessionTwoFactorVerified.
      twoFactorVerified: { type: "boolean", required: false, input: false },
    },
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session, ctx) => ({
          data: { ...session, twoFactorVerified: sessionTwoFactorVerified(ctx?.path, session) },
        }),
      },
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      // The admin plugin's own endpoints know nothing about twoFactorVerified: hold them to the same rule as /admin.
      // (Blocks /admin/stop-impersonating too, which is fine: nobody can start impersonating without passing it.)
      if (isBuiltInAdminEndpoint(ctx.path)) {
        if (!hasStaffAccess(await getSessionFromCtx(ctx), { adminOnly: true })) {
          throw new APIError("FORBIDDEN", { message: "A two-factor verified admin session is required." });
        }
        return;
      }
      // 2FA is mandatory for admins: they can be reset by another admin, never switch it off themselves.
      if (ctx.path !== "/two-factor/disable") return;
      const current = await getSessionFromCtx(ctx);
      if (blocksTwoFactorDisable(ctx.path, current?.user.role)) {
        throw new APIError("FORBIDDEN", { message: "Two-factor authentication is required for admin accounts." });
      }
    }),
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      const { sendEmail } = await import("./email/adapter");
      const { renderEmailTemplate } = await import("./email/templates");
      await sendEmail({
        to: user.email,
        subject: "Reset your Anshkosh password",
        html: await renderEmailTemplate("password_reset", { userName: user.name || "there", url }),
        text: `Hi ${user.name || "there"},\nReset your Anshkosh password: ${url}\nIf you did not request this, ignore this email.`,
      });
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      // Need to import emailQueue
      const { emailQueue } = await import("@/lib/jobs/queues");
      await emailQueue.add("email-verification", {
        template: "welcome",
        to: user.email,
        data: {
          founderName: user.name,
          url,
        }
      });
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [
    admin(accountAdminOptions),
    twoFactor({
      issuer: TWO_FACTOR_ISSUER,
      skipVerificationOnEnable: false,
      backupCodeOptions: { amount: 10 },
    }),
  ],
});
