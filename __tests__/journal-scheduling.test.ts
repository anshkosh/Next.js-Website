// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { istDateTimeInput, parseJournalSchedule } from "../lib/journal-scheduling";
const m = vi.hoisted(() => ({ list: vi.fn(), revision: vi.fn(), query: vi.fn(), entry: vi.fn(), startup: vi.fn(), update: vi.fn(), reviewUpdate: vi.fn(), admins: vi.fn(), session: vi.fn(), post: vi.fn(), postUpdate: vi.fn() }));
vi.mock("@/lib/db", () => {
  const tx = { $queryRaw: m.query, founderJournalRevision: { findMany: m.list, findUnique: m.revision, update: m.reviewUpdate }, founderJournalEntry: { findUnique: m.entry, update: m.update }, startup: { findFirst: m.startup } };
  return { db: { ...tx, $transaction: async (fn: (value: object) => unknown) => fn(tx), journalPost: { updateMany: m.admins, findUnique: m.post, update: m.postUpdate } } };
});
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: m.session } } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));
import { publishScheduledJournals } from "../lib/journal-publication";
import { scheduleJournalPost, unpublishJournalPost } from "../app/actions/journal.actions";
const now = new Date("2026-10-17T06:00:00Z");
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(now);
  vi.clearAllMocks(); m.list.mockResolvedValue([]); m.admins.mockResolvedValue({ count: 1 });
  m.session.mockResolvedValue({ user: { id: "admin", role: "admin", emailVerified: true } }); m.post.mockResolvedValue({ slug: "story", status: "DRAFT" });
  m.postUpdate.mockResolvedValue({ slug: "story" });
});
afterEach(() => vi.useRealTimers());
describe("IST schedule validation", () => {
  it("converts IST explicitly, independently of the host/browser timezone", () => {
    expect(parseJournalSchedule("2026-10-17T12:00", now).toISOString()).toBe("2026-10-17T06:30:00.000Z");
    expect(istDateTimeInput(new Date("2026-10-17T06:30:00Z"))).toBe("2026-10-17T12:00");
  });
  it.each(["", "2026-02-30T12:00", "2026-10-17T11:00", "2026-10-17T12:00Z", "2030-01-01T12:00"])("rejects invalid/past/out-of-range time %s", value => {
    expect(() => parseJournalSchedule(value, now)).toThrow();
  });
});
describe("scheduled publisher", () => {
  it("limits publishing to approved due revisions and scheduled due admin posts", async () => {
    await publishScheduledJournals(now);
    expect(m.list).toHaveBeenCalledWith(expect.objectContaining({ where: { status: "SCHEDULED", scheduledAt: { lte: now } } }));
    expect(m.admins).toHaveBeenCalledWith({ where: { status: "DRAFT", scheduledAt: { lte: now } }, data: { status: "PUBLISHED", publishedAt: now, scheduledAt: null } });
  });
  it.each([null, { status: "PENDING_REVIEW", scheduledAt: now }, { status: "SCHEDULED", scheduledAt: new Date("2027-01-01") }])("rechecks revision state under a lock before publishing", async revision => {
    m.list.mockResolvedValue([{ id: "revision", entryId: "entry" }]); m.revision.mockResolvedValue(revision);
    expect((await publishScheduledJournals(now)).founders).toBe(0); expect(m.query).toHaveBeenCalled(); expect(m.entry).not.toHaveBeenCalled();
  });
  it("never resurrects a private entry even when a due job was already queued", async () => {
    m.list.mockResolvedValue([{ id: "revision", entryId: "entry" }]); m.revision.mockResolvedValue({ id: "revision", entryId: "entry", status: "SCHEDULED", scheduledAt: now });
    m.entry.mockResolvedValue({ visibility: "PRIVATE" });
    expect((await publishScheduledJournals(now)).founders).toBe(0); expect(m.update).not.toHaveBeenCalled();
  });
});
describe("admin scheduling", () => {
  it("cancels a schedule by clearing its date and reverting to draft", async () => {
    expect(await unpublishJournalPost("post")).toEqual({ success: true });
    expect(m.postUpdate).toHaveBeenCalledWith({ where: { id: "post" }, data: { status: "DRAFT", publishedAt: null, scheduledAt: null } });
  });
  it("requires admin access", async () => {
    m.session.mockResolvedValue({ user: { role: "user" } });
    expect(await scheduleJournalPost("post", "2027-01-01T12:00")).toEqual({ error: "Unauthorized" }); expect(m.admins).not.toHaveBeenCalled();
  });
  it("schedules drafts without marking them published and refuses live posts", async () => {
    expect(await scheduleJournalPost("post", "2027-01-01T12:00")).toEqual({ success: true });
    expect(m.admins).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "post", status: "DRAFT" }, data: { scheduledAt: new Date("2027-01-01T06:30:00Z"), publishedAt: null } }));
    m.post.mockResolvedValue({ slug: "live", status: "PUBLISHED" });
    expect(await scheduleJournalPost("post", "2027-01-01T12:00")).toHaveProperty("error");
  });
});
