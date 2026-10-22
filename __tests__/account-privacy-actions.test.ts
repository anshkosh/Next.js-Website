// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ session: vi.fn(), limit: vi.fn(), issue: vi.fn(), discard: vi.fn(), erase: vi.fn(), email: vi.fn(), revalidate: vi.fn() }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: m.session } } }));
vi.mock("@/lib/utils/rate-limit", () => ({ checkRateLimit: m.limit }));
vi.mock("@/lib/account-privacy", async original => ({ ...await original<object>(), issuePrivacyCode: m.issue, discardUnsentPrivacyCode: m.discard, eraseAccount: m.erase }));
vi.mock("@/lib/email/adapter", () => ({ sendEmail: m.email }));
vi.mock("@/lib/cache-after-save", () => ({ revalidateSavedPath: m.revalidate }));
import { deleteMyAccount, requestAccountPrivacyCode } from "@/app/actions/account-privacy.actions";
const code = "b".repeat(32);
beforeEach(() => {
  vi.resetAllMocks(); m.session.mockResolvedValue({ user: { id: "owner", emailVerified: true, banned: false }, session: { id: "active" } });
  m.limit.mockResolvedValue(true); m.issue.mockResolvedValue({ code, email: "owner@example.test", proof: { id: "proof", value: "hash-only" } }); m.discard.mockResolvedValue({});
});
it("emails a purpose-specific code but never returns it to the browser", async () => {
  const result = await requestAccountPrivacyCode({ purpose: "delete" });
  expect(result).toEqual({ success: true }); expect(JSON.stringify(result)).not.toContain(code);
  expect(m.email).toHaveBeenCalledWith(expect.objectContaining({ to: "owner@example.test", subject: "Confirm your Anshkosh account deletion", text: expect.stringContaining(code), html: expect.stringContaining("15 minutes") }));
  expect(m.erase).not.toHaveBeenCalled();
});
it("invalidates an unsent code and does not falsely report email success", async () => {
  m.email.mockRejectedValue(new Error("provider unavailable"));
  expect(await requestAccountPrivacyCode({ purpose: "export" })).toHaveProperty("error");
  expect(m.discard).toHaveBeenCalledWith({ id: "proof", value: "hash-only" });
});
it("does not email when authentication or rate protection fails", async () => {
  m.session.mockResolvedValueOnce(null);
  expect(await requestAccountPrivacyCode({ purpose: "delete" })).toHaveProperty("error");
  m.limit.mockResolvedValue(false);
  expect(await requestAccountPrivacyCode({ purpose: "delete" })).toHaveProperty("error");
  expect(m.email).not.toHaveBeenCalled();
});
it("requires exact confirmation and disallows client-selected targets before erasure", async () => {
  expect(await deleteMyAccount({ code, confirmation: "delete" })).toHaveProperty("error");
  expect(await deleteMyAccount({ code, confirmation: "DELETE", userId: "victim" })).toHaveProperty("error");
  expect(m.erase).not.toHaveBeenCalled(); expect(m.session).not.toHaveBeenCalled();
});
it("passes only the signed-in identity and refreshes visibility after confirmed deletion", async () => {
  expect(await deleteMyAccount({ code, confirmation: "DELETE" })).toEqual({ success: true });
  expect(m.erase).toHaveBeenCalledWith({ userId: "owner", sessionId: "active" }, code);
  expect(m.revalidate).toHaveBeenCalledWith("/", "layout");
});
it("does not report deletion or refresh caches when the transaction fails", async () => {
  m.erase.mockRejectedValue(new Error("database failure"));
  expect(await deleteMyAccount({ code, confirmation: "DELETE" })).toHaveProperty("error");
  expect(m.revalidate).not.toHaveBeenCalled();
});
