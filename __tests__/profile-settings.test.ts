// @vitest-environment node
import { describe, expect, it } from "vitest";
import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import { memoryAdapter } from "better-auth/adapters/memory";
import { accountAdminOptions } from "@/lib/auth-roles";
import { accountProfileFields } from "@/lib/account-profile";
import { profileSettingsSchema, founderModeSchema } from "@/lib/validators/profile.schema";

const origin = "https://profile.example.test";
describe("self-service profiles through real auth endpoints", () => {
  it("registers members, supports founder opt-in, and saves settings for every account role without escalation", async () => {
    const data: Record<string, Record<string, unknown>[]> = {
      user: [],
      session: [],
      account: [],
      verification: [],
    };
    const instance = betterAuth({
      baseURL: origin,
      secret: "isolated-profile-test-secret-not-production",
      database: memoryAdapter(data),
      emailAndPassword: { enabled: true },
      user: { additionalFields: accountProfileFields },
      plugins: [admin(accountAdminOptions)],
      rateLimit: { enabled: false },
      logger: { disabled: true },
    });
    for (const role of ["user", "reviewer", "admin"]) {
      const signup = await instance.handler(
        new Request(`${origin}/api/auth/sign-up/email`, {
          method: "POST",
          headers: { origin, "content-type": "application/json" },
          body: JSON.stringify({
            name: "Member",
            email: `${role}@example.test`,
            password: "isolated-password-123",
          }),
        }),
      );
      expect(signup.status).toBe(200);
      const user = data.user.find(
        (user) => user.email === `${role}@example.test`,
      )!;
      expect(user.role).toBe("user");
      expect(user.founderMode).toBe(false);
      user.role = role;
      const cookie = signup.headers
        .getSetCookie()
        .map((value) => value.split(";")[0])
        .join("; ");
      const escalation = await instance.handler(
        new Request(`${origin}/api/auth/update-user`, {
          method: "POST",
          headers: { origin, cookie, "content-type": "application/json" },
          body: JSON.stringify({ role: "admin", founderMode: true }),
        }),
      );
      expect(escalation.status).toBe(400);
      expect(data.user.find((row) => row.id === user.id)?.role).toBe(role);
      const saved = await instance.handler(
        new Request(`${origin}/api/auth/update-user`, {
          method: "POST",
          headers: { origin, cookie, "content-type": "application/json" },
          body: JSON.stringify({ name: "Updated member", founderMode: false, bio: "Building useful things", location: "Hyderabad", websiteUrl: "https://example.test", notifyStartupReviews: false, notifyVoteMilestones: false }),
        }),
      );
      expect(saved.status).toBe(200);
      expect(data.user.find((row) => row.id === user.id)).toMatchObject({
        name: "Updated member",
        founderMode: false,
        role,
      });
      const session = await instance.handler(
        new Request(`${origin}/api/auth/get-session`, {
          headers: { origin, cookie },
        }),
      );
      expect((await session.json()).user).toMatchObject({
        name: "Updated member",
        founderMode: false,
        bio: "Building useful things", location: "Hyderabad", websiteUrl: "https://example.test",
        notifyStartupReviews: false, notifyVoteMilestones: false,
        role,
      });
      const malformed = await instance.handler(
        new Request(`${origin}/api/auth/update-user`, {
          method: "POST",
          headers: { origin, cookie, "content-type": "application/json" },
          body: JSON.stringify({ founderMode: "false" }),
        }),
      );
      expect(malformed.status).toBe(400);
      expect(data.user.find((row) => row.id === user.id)?.founderMode).toBe(
        false,
      );
    }
    const anonymous = await instance.handler(
      new Request(`${origin}/api/auth/update-user`, {
        method: "POST",
        headers: { origin, "content-type": "application/json" },
        body: JSON.stringify({ name: "Anonymous", founderMode: true }),
      }),
    );
    expect(anonymous.status).toBe(401);
  }, 30000);
  it("rejects account ids, privileges, unexpected fields and non-boolean mode input", () => {
    const valid = { name: "Member", image: "", bio: "", location: "", websiteUrl: "", notifyStartupReviews: true, notifyVoteMilestones: false };
    expect(profileSettingsSchema.safeParse(valid).success).toBe(true);
    expect(founderModeSchema.safeParse({ founderMode: false }).success).toBe(true);
    expect(founderModeSchema.safeParse({ founderMode: false, id: "another-account" }).success).toBe(false);
    expect(founderModeSchema.safeParse({ founderMode: "false" }).success).toBe(false);
    for (const patch of [
      { role: "admin" },
      { id: "someone-else" },
      { banned: false },
      { emailVerified: true },
      { founderMode: "false" },
      { name: " " },
      { websiteUrl: "javascript:alert(1)" },
      { bio: "x".repeat(501) },
      { notifyStartupReviews: "false" },
    ]) {
      expect(
        profileSettingsSchema.safeParse({
          ...valid,
          ...patch,
        }).success,
      ).toBe(false);
    }
  });
});
