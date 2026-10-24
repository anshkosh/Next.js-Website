// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
const m = vi.hoisted(() => {
  const many = () => ({ findMany: vi.fn(), deleteMany: vi.fn(), updateMany: vi.fn() });
  return {
    tx: { $queryRaw: vi.fn(), user: { findUnique: vi.fn(), delete: vi.fn() }, session: { findFirst: vi.fn() }, verification: { findFirst: vi.fn(), create: vi.fn(), deleteMany: vi.fn(), delete: vi.fn() }, account: many(), startup: many(), startupUpdate: many(), comment: many(), commenterBlock: many(), moderationAccountBan: many(), founderJournalEntry: many(), founderJournalRevision: many(), startupRevision: many(), journalPost: many(), mediaUpload: many(), notificationOutbox: many() },
    transaction: vi.fn(),
  };
});
vi.mock("@/lib/db", () => ({ db: { $transaction: m.transaction } }));
vi.mock("server-only", () => ({}));
import { deleteAccountSchema, eraseAccount, exportAccountData, issuePrivacyCode } from "@/lib/account-privacy";

const actor = { userId: "member", sessionId: "session" };
const code = "a".repeat(32);
const member = { id: "member", email: "owner@example.test", emailVerified: true, banned: false, role: "user", name: "Member", password: "FORBIDDEN_HASH", bio: "About me", dateOfBirth: "1996-02-29" };
function proof(purpose: "export" | "delete") {
  return { id: "proof", identifier: `account-privacy:member:${purpose}`, value: JSON.stringify({ email: member.email, hash: createHash("sha256").update(code).digest("hex") }), expiresAt: new Date(Date.now() + 60000) };
}
beforeEach(() => {
  vi.resetAllMocks();
  m.transaction.mockImplementation((fn: (tx: typeof m.tx) => unknown) => fn(m.tx));
  m.tx.user.findUnique.mockResolvedValue(member);
  m.tx.session.findFirst.mockResolvedValue({ id: "session" });
  m.tx.$queryRaw.mockResolvedValue([{ bytes: BigInt(0) }]);
  for (const table of [m.tx.account, m.tx.startup, m.tx.startupUpdate, m.tx.comment, m.tx.founderJournalEntry, m.tx.journalPost, m.tx.mediaUpload]) table.findMany.mockResolvedValue([]);
  m.tx.verification.create.mockImplementation(async ({ data }: { data: { value: string } }) => ({ id: "issued", value: data.value }));
});
it("stores only a code hash, binds the current email and replaces earlier purpose-specific codes", async () => {
  m.tx.verification.findFirst.mockResolvedValue(null);
  const issued = await issuePrivacyCode(actor, "delete");
  expect(issued.code).toMatch(/^[a-f0-9]{32}$/);
  expect(issued.proof.value).not.toContain(issued.code);
  expect(JSON.parse(issued.proof.value)).toEqual({ email: member.email, hash: createHash("sha256").update(issued.code).digest("hex") });
  expect(m.tx.verification.deleteMany).toHaveBeenCalledWith({ where: { identifier: "account-privacy:member:delete" } });
  const expiry = m.tx.verification.create.mock.calls[0][0].data.expiresAt as Date;
  expect(expiry.getTime() - Date.now()).toBeGreaterThan(14 * 60000);
  expect(expiry.getTime() - Date.now()).toBeLessThanOrEqual(15 * 60000);
});
it("enforces the resend cooldown without generating another proof", async () => {
  m.tx.verification.findFirst.mockResolvedValue({ createdAt: new Date() });
  await expect(issuePrivacyCode(actor, "export")).rejects.toMatchObject({ status: 429 });
  expect(m.tx.verification.create).not.toHaveBeenCalled();
});
it.each([null, { ...member, banned: true }, { ...member, emailVerified: false }])("denies invalid current members before reading private content", async user => {
  m.tx.user.findUnique.mockResolvedValue(user);
  await expect(exportAccountData(actor, code)).rejects.toMatchObject({ status: 401 });
  expect(m.tx.startup.findMany).not.toHaveBeenCalled();
});
it("rejects revoked sessions even if the caller supplies an old user id", async () => {
  m.tx.session.findFirst.mockResolvedValue(null);
  await expect(eraseAccount(actor, code)).rejects.toMatchObject({ status: 401 });
  expect(m.tx.user.delete).not.toHaveBeenCalled();
});
it.each(["admin", "reviewer", "user,admin", "unknown"])("protects %s accounts from self-service deletion", async role => {
  m.tx.user.findUnique.mockResolvedValue({ ...member, role });
  await expect(issuePrivacyCode(actor, "delete")).rejects.toMatchObject({ status: 403 });
  await expect(eraseAccount(actor, code)).rejects.toMatchObject({ status: 403 });
  expect(m.tx.user.delete).not.toHaveBeenCalled();
});
it.each([null, { ...proof("delete"), value: "not-json" }, { ...proof("delete"), value: JSON.stringify({ email: "former@example.test", hash: createHash("sha256").update(code).digest("hex") }) }])("rejects expired, malformed and email-change-invalidated proofs before erasure", async value => {
  m.tx.verification.findFirst.mockResolvedValue(value);
  await expect(eraseAccount(actor, code)).rejects.toThrow(/invalid or expired/);
  expect(m.tx.user.delete).not.toHaveBeenCalled();
  expect(m.tx.mediaUpload.updateMany).not.toHaveBeenCalled();
});
it("cannot use an export code or another account's code for deletion", async () => {
  m.tx.verification.findFirst.mockImplementation(async ({ where }: { where: { identifier: string } }) => where.identifier === "account-privacy:member:export" ? proof("export") : null);
  await expect(eraseAccount(actor, code)).rejects.toThrow(/invalid or expired/);
  m.tx.user.findUnique.mockResolvedValue({ ...member, id: "other", email: "other@example.test" });
  await expect(exportAccountData({ userId: "other", sessionId: "session" }, code)).rejects.toThrow(/invalid or expired/);
  expect(m.tx.user.delete).not.toHaveBeenCalled();
});
it("consumes one-use proofs and exports explicit owner-only projections without auth secrets", async () => {
  m.tx.verification.findFirst.mockResolvedValueOnce(proof("export")).mockResolvedValueOnce(null);
  m.tx.account.findMany.mockResolvedValue([{ providerId: "google", createdAt: new Date("2026-01-01") }]);
  m.tx.startup.findMany.mockResolvedValue([{ id: "owned", name: "Own startup" }]);
  const json = await exportAccountData(actor, code);
  expect(JSON.parse(json)).toMatchObject({ formatVersion: 1, account: { id: "member", dateOfBirth: "1996-02-29" }, startups: [{ id: "owned" }] });
  expect(json).not.toContain("FORBIDDEN_HASH");
  expect(m.tx.account.findMany).toHaveBeenCalledWith({ where: { userId: "member" }, select: { providerId: true, createdAt: true } });
  expect(m.tx.startup.findMany.mock.calls[0][0].where).toEqual({ founderId: "member" });
  expect(m.tx.comment.findMany.mock.calls[0][0].select).not.toHaveProperty("authorEmail");
  expect(m.tx.startup.findMany.mock.calls[0][0].select.betaTesterProgram.select).not.toHaveProperty("requests");
  expect(m.tx.verification.delete).toHaveBeenCalledWith({ where: { id: "proof" } });
  await expect(exportAccountData(actor, code)).rejects.toThrow(/invalid or expired/);
});
it("bounds exports without silently dropping records", async () => {
  m.tx.verification.findFirst.mockResolvedValue(proof("export"));
  m.tx.mediaUpload.findMany.mockResolvedValue(Array.from({ length: 10001 }, () => ({ key: "gallery/test.webp" })));
  await expect(exportAccountData(actor, code)).rejects.toMatchObject({ status: 413 });
});
it("rejects oversized content before materializing owned rows in the web process", async () => {
  m.tx.verification.findFirst.mockResolvedValue(proof("export"));
  m.tx.$queryRaw.mockResolvedValue([{ bytes: BigInt(21 * 1024 * 1024) }]);
  await expect(exportAccountData(actor, code)).rejects.toMatchObject({ status: 413 });
  expect(m.tx.startup.findMany).not.toHaveBeenCalled();
});
it("erases only the current member and handles dependent content before the user inside one transaction", async () => {
  m.tx.verification.findFirst.mockResolvedValue(proof("delete"));
  expect(await eraseAccount(actor, code)).toEqual({ success: true });
  expect(m.tx.user.delete).toHaveBeenCalledWith({ where: { id: "member" } });
  expect(m.tx.startup.deleteMany).toHaveBeenCalledWith({ where: { founderId: "member" } });
  expect(m.tx.founderJournalRevision.deleteMany).toHaveBeenCalledWith({ where: { entry: { authorId: "member" } } });
  expect(m.tx.mediaUpload.updateMany).toHaveBeenCalledWith({ where: { userId: "member" }, data: { erasureRequestedAt: expect.any(Date) } });
  expect(m.tx.mediaUpload.deleteMany).not.toHaveBeenCalled();
  expect(m.tx.startup.deleteMany.mock.invocationCallOrder[0]).toBeLessThan(m.tx.user.delete.mock.invocationCallOrder[0]);
  expect(m.transaction).toHaveBeenCalledOnce();
});
it("propagates database failures so the transaction can roll back", async () => {
  m.tx.verification.findFirst.mockResolvedValue(proof("delete"));
  m.tx.startup.deleteMany.mockRejectedValue(new Error("database failure"));
  await expect(eraseAccount(actor, code)).rejects.toThrow("database failure");
  expect(m.tx.user.delete).not.toHaveBeenCalled();
});
it("rejects client-chosen account ids and requires the literal final confirmation", () => {
  expect(deleteAccountSchema.safeParse({ code, confirmation: "DELETE" }).success).toBe(true);
  expect(deleteAccountSchema.safeParse({ code, confirmation: "delete" }).success).toBe(false);
  expect(deleteAccountSchema.safeParse({ code, confirmation: "DELETE", userId: "other" }).success).toBe(false);
});
