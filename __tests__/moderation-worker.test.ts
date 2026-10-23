// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { contentHash } from "@/lib/moderation-policy";
const m = vi.hoisted(() => ({ first: vi.fn(), update: vi.fn(), final: vi.fn(), query: vi.fn(), source: vi.fn(), apply: vi.fn(), check: vi.fn() }));
vi.mock("@/lib/db", () => {
  const tx = { contentModeration: { findFirst: m.first, updateMany: m.update, update: m.final }, $queryRaw: m.query };
  return { db: { ...tx, $transaction: async (fn: (tx: object) => unknown) => fn(tx) } };
});
vi.mock("@/lib/moderation-source", () => ({ moderationSource: m.source, applyModeration: m.apply }));
vi.mock("@/lib/moderation-policy", async original => ({ ...await original<object>(), checkContent: m.check }));
import { processModeration } from "@/lib/moderation-worker";
const content = { text: "We simplified onboarding after five interviews.", hasMedia: false, stamp: null };
let record: Record<string, unknown>;
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("AI_MODERATION_ENABLED", "true"); vi.stubEnv("MODERATION_CF_ACCOUNT_ID", "a".repeat(32)); vi.stubEnv("MODERATION_CF_API_TOKEN", "unit-test-only");
  record = { id: "job", kind: "COMMENT", targetId: "comment", contentHash: contentHash(content), status: "PENDING", attempts: 0, leaseToken: null, nextAttemptAt: new Date(0) };
  m.first.mockResolvedValueOnce({ ...record }).mockResolvedValue(null);
  m.source.mockResolvedValue({ content, slug: "fixture", startupId: "startup" });
  m.apply.mockResolvedValue({ slug: "fixture" }); m.query.mockResolvedValue([{ requests: 1 }]);
  m.check.mockResolvedValue({ safe: true, reasons: [] });
  m.update.mockImplementation(async ({ where, data }) => {
    if (Object.entries(where).some(([key, value]) => record[key] !== value)) return { count: 0 };
    for (const [key, value] of Object.entries(data)) {
      record[key] = value && typeof value === "object" && "increment" in value ? Number(record[key]) + Number(value.increment)
        : value && typeof value === "object" && "decrement" in value ? Number(record[key]) - Number(value.decrement) : value;
    }
    return { count: 1 };
  });
  m.final.mockImplementation(async ({ data }) => { Object.assign(record, data); return record; });
});
afterEach(() => vi.unstubAllEnvs());
it("keeps all work pending when the server credentials or enable switch are missing", async () => {
  vi.stubEnv("MODERATION_CF_API_TOKEN", "");
  expect(await processModeration()).toEqual({ checked: 0, configured: false });
  expect(m.first).not.toHaveBeenCalled(); expect(m.check).not.toHaveBeenCalled();
});
it("publishes only a safe, current, claimed submission", async () => {
  expect(await processModeration()).toMatchObject({ checked: 1 });
  expect(record.status).toBe("SAFE"); expect(m.apply).toHaveBeenCalledOnce();
});
it("holds unsafe content without changing its public state", async () => {
  m.check.mockResolvedValue({ safe: false, reasons: ["Safety category S10; human review required."] });
  await processModeration(); expect(record.status).toBe("FLAGGED"); expect(m.apply).not.toHaveBeenCalled();
});
it("does not send private, withdrawn or already-reviewed source content", async () => {
  m.source.mockResolvedValue(null);
  await processModeration(); expect(record.status).toBe("STALE"); expect(m.check).not.toHaveBeenCalled();
});
it("discards a result when the current source changed during inference", async () => {
  m.source.mockResolvedValueOnce({ content, slug: "fixture", startupId: "startup" }).mockResolvedValue({ content: { ...content, text: "A different submission" }, slug: "fixture", startupId: "startup" });
  await processModeration(); expect(record.status).toBe("STALE"); expect(m.apply).not.toHaveBeenCalled();
});
it("cannot overwrite a human decision made during inference", async () => {
  m.check.mockImplementation(async () => { record.status = "REJECTED"; record.leaseToken = null; return { safe: true, reasons: [] }; });
  await processModeration(); expect(record.status).toBe("REJECTED"); expect(m.apply).not.toHaveBeenCalled();
});
it("cannot apply the old result after a submission was requeued", async () => {
  m.check.mockImplementation(async () => { record.contentHash = "b".repeat(64); record.status = "PENDING"; record.leaseToken = null; return { safe: true, reasons: [] }; });
  await processModeration(); expect(record.status).toBe("PENDING"); expect(m.apply).not.toHaveBeenCalled();
});
it("does not call Cloudflare after the shared daily budget is exhausted", async () => {
  m.query.mockResolvedValue([]);
  await processModeration(); expect(record.status).toBe("UNAVAILABLE"); expect(record.attempts).toBe(0); expect(m.check).not.toHaveBeenCalled();
  expect(record.nextAttemptAt).toEqual(expect.any(Date));
});
it("leaves content pending and retries later after provider failure", async () => {
  m.check.mockRejectedValue(new Error("provider-unavailable"));
  await processModeration(); expect(record.status).toBe("UNAVAILABLE"); expect(m.apply).not.toHaveBeenCalled();
  expect(JSON.stringify(record.reasons)).not.toContain("unit-test-only");
});
it("does not publish after losing a lease to another worker", async () => {
  m.update.mockResolvedValue({ count: 0 });
  await processModeration(); expect(m.check).not.toHaveBeenCalled(); expect(m.apply).not.toHaveBeenCalled();
});
