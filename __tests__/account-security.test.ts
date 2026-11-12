// @vitest-environment node
import { expect, it, vi } from "vitest";
import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";
import { authRequestHooks } from "@/lib/auth-staff-guard";
import { sendAccountVerificationEmail } from "@/lib/auth-verification-email";

const { addEmailJob } = vi.hoisted(() => ({
  addEmailJob: vi.fn<(name: string, message: { to: string; data: { url: string } }, options?: unknown) => Promise<void>>(),
}));
vi.mock("@/lib/jobs/queues", () => ({ emailQueue: { add: addEmailJob } }));

it("requires a session for manual verification resends and keeps password-based recovery", async () => {
  const data: Record<string, Record<string, unknown>[]> = { user: [], session: [], account: [], verification: [] };
  addEmailJob.mockReset().mockResolvedValue();
  const origin = "https://verification.example.test";
  const email = "member@example.test";
  const password = "IsolatedPassword123!";
  const instance = betterAuth({
    baseURL: origin, secret: "isolated-verification-test-secret-not-production",
    database: memoryAdapter(data), hooks: authRequestHooks, logger: { disabled: true },
    advanced: { skipTrailingSlashes: true },
    emailAndPassword: { enabled: true, requireEmailVerification: true },
    emailVerification: {
      sendOnSignIn: true,
      sendVerificationEmail: sendAccountVerificationEmail,
    },
  });
  const request = (path: string, body: object, cookie = "") => instance.handler(new Request(origin + "/api/auth/" + path, {
    method: "POST", headers: { origin, cookie, "content-type": "application/json" }, body: JSON.stringify(body),
  }));

  expect((await request("sign-up/email", { name: "Member", email, password })).status).toBe(200);
  expect(addEmailJob).toHaveBeenCalledOnce();
  expect(addEmailJob.mock.calls[0][2]).toBeUndefined();
  expect((await request("send-verification-email", { email })).status).toBe(401);
  expect((await request("send-verification-email/", { email })).status).toBe(401);
  expect((await request("send-verification-email", { email: "unknown@example.test" })).status).toBe(401);
  const wrongPassword = await request("sign-in/email", { email, password: "WrongPassword123!" });
  const unknownEmail = await request("sign-in/email", { email: "unknown@example.test", password });
  expect(wrongPassword.status).toBe(401);
  expect(unknownEmail.status).toBe(401);
  expect(await wrongPassword.json()).toEqual(await unknownEmail.json());
  expect(addEmailJob).toHaveBeenCalledOnce();

  const unverified = await request("sign-in/email?next=%2Fstartup%2Fnew", { email, password });
  expect(unverified.status).toBe(403);
  expect(await unverified.json()).toMatchObject({ code: "EMAIL_NOT_VERIFIED" });
  expect(addEmailJob.mock.calls.map(([, message]) => message.to)).toEqual([email, email]);
  const [, resend, resendOptions] = addEmailJob.mock.calls[1];
  expect(resendOptions).toEqual({ deduplication: { id: `verification-resend-${data.user[0].id}`, ttl: 60_000 } });
  const verification = await instance.handler(new Request(resend.data.url));
  expect(verification.status).toBe(302);
  expect(verification.headers.get("location")).toBe("/login?next=%2Fstartup%2Fnew&verified=1");
  expect(verification.headers.getSetCookie()).toEqual([]);

  const signedIn = await request("sign-in/email", { email, password });
  expect(signedIn.status).toBe(200);
  const cookie = signedIn.headers.getSetCookie().map(value => value.split(";")[0]).join("; ");
  expect(cookie).not.toBe("");
  expect((await request("send-verification-email", { email }, cookie)).status).toBe(400);

  // Existing sessions can outlive a change to the account's verification status.
  data.user[0].emailVerified = false;
  expect((await request("send-verification-email", { email: "other@example.test" }, cookie)).status).toBe(400);
  expect(addEmailJob).toHaveBeenCalledTimes(2);
  expect((await request("send-verification-email", { email }, cookie)).status).toBe(200);
  expect(addEmailJob.mock.calls.map(([, message]) => message.to)).toEqual([email, email, email]);
  expect(addEmailJob.mock.calls[2][2]).toEqual(resendOptions);
});

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
