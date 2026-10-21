// @vitest-environment node
import { expect, it } from "vitest";
import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";

it("requires the old and new mailboxes before changing a verified account email", async () => {
  const data: Record<string, Record<string, unknown>[]> = { user: [], session: [], account: [], verification: [] };
  const messages: { to: string; url: string }[] = [];
  const origin = "https://security.example.test";
  const instance = betterAuth({ baseURL: origin, secret: "isolated-security-test-secret-not-production", database: memoryAdapter(data),
    emailAndPassword: { enabled: true }, rateLimit: { enabled: false }, logger: { disabled: true },
    user: { changeEmail: { enabled: true, sendChangeEmailConfirmation: async ({ user, url }) => { messages.push({ to: user.email, url }); } } },
    emailVerification: { sendVerificationEmail: async ({ user, url }) => { messages.push({ to: user.email, url }); } },
  });
  const signup = await instance.handler(new Request(origin + "/api/auth/sign-up/email", { method: "POST", headers: { origin, "content-type": "application/json" }, body: JSON.stringify({ name: "Member", email: "old@example.test", password: "OriginalPassword123!" }) }));
  expect(signup.status).toBe(200);
  data.user[0].emailVerified = true;
  const cookie = signup.headers.getSetCookie().map(value => value.split(";")[0]).join("; ");
  const request = (path: string, body: object) => instance.handler(new Request(origin + "/api/auth/" + path, { method: "POST", headers: { origin, cookie, "content-type": "application/json" }, body: JSON.stringify(body) }));
  expect((await request("change-email", { newEmail: "new@example.test", callbackURL: "/settings" })).status).toBe(200);
  expect(data.user[0].email).toBe("old@example.test");
  expect(messages.map(message => message.to)).toEqual(["old@example.test"]);
  expect((await instance.handler(new Request(messages[0].url, { headers: { cookie } }))).status).toBe(302);
  expect(data.user[0].email).toBe("old@example.test");
  expect(messages[1].to).toBe("new@example.test");
  expect((await instance.handler(new Request(messages[1].url, { headers: { cookie } }))).status).toBe(302);
  expect(data.user[0]).toMatchObject({ email: "new@example.test", emailVerified: true });
  expect((await request("change-password", { currentPassword: "wrong-password", newPassword: "Replacement123!" })).status).toBe(400);
  expect((await request("change-password", { currentPassword: "OriginalPassword123!", newPassword: "Replacement123!", revokeOtherSessions: true })).status).toBe(200);
});
