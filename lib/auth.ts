import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { admin, twoFactor } from "better-auth/plugins";
import { db } from "./db";
import { getTrustedAuthOrigins } from "./auth-origins";
import { accountAdminOptions } from "./auth-roles";
import { accountProfileFields } from "./account-profile";
import { TWO_FACTOR_ISSUER } from "./staff-access";
import { authIpAddressOptions, authRequestHooks, staffDatabaseHooks, staffSessionOptions } from "./auth-staff-guard";
import { sendAccountVerificationEmail } from "./auth-verification-email";

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
  session: staffSessionOptions,
  databaseHooks: staffDatabaseHooks,
  hooks: authRequestHooks,
  advanced: { ipAddress: authIpAddressOptions },
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
    sendOnSignIn: true,
    sendVerificationEmail: sendAccountVerificationEmail,
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
