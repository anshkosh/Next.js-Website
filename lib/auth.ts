import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { admin } from "better-auth/plugins";
import { db } from "./db";

const statements = {
  startup: ["create", "read", "update", "delete", "moderate"],
  category: ["create", "read", "update", "delete"],
  settings: ["read", "update"],
  admin: ["create", "read", "delete"],
} as const;

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
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
    admin({
      adminRoles: ["admin", "reviewer"],
      statements,
      roles: {
        user: {
          startup: ["create", "read", "update"],
          category: ["read"],
        },
        reviewer: {
          startup: ["read", "moderate"],
          category: ["read", "create", "update"],
        },
        admin: {
          startup: ["create", "read", "update", "delete", "moderate"],
          category: ["create", "read", "update", "delete"],
          settings: ["read", "update"],
          admin: ["create", "read", "delete"],
        },
      } as any,
    }),
  ],
});
