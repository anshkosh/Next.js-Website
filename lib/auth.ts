import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { admin } from "better-auth/plugins";
import { db } from "./db";
import { getTrustedAuthOrigins } from "./auth-origins";
import { escapeEmailHtml } from "./email/escape";
import { accountAdminOptions } from "./auth-roles";
import { accountProfileFields } from "./account-profile";

export const auth = betterAuth({
  trustedOrigins: getTrustedAuthOrigins,
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  user: {
    additionalFields: accountProfileFields,
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      const { sendEmail } = await import("./email/adapter");
      await sendEmail({
        to: user.email,
        subject: "Reset your Anshkosh password",
        html: `<p>Hi ${escapeEmailHtml(user.name || "there")},</p><p>Use the link below to choose a new Anshkosh password:</p><p><a href="${escapeEmailHtml(url)}">Reset your password</a></p><p>If you did not request this, you can ignore this email.</p>`,
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
  ],
});
