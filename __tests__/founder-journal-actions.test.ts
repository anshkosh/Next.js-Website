// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ session: vi.fn(), find: vi.fn(), startup: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn(), revalidate: vi.fn(), media: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: m.session } } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/cache", () => ({ revalidatePath: m.revalidate }));
vi.mock("@/lib/db", () => {
  const tx = { founderJournalEntry: { findFirst: m.find, create: m.create, updateMany: m.update, deleteMany: m.remove }, startup: { findFirst: m.startup } };
  return { db: { ...tx, mediaUpload: { count: m.media }, $transaction: async (fn: (tx: object) => unknown) => fn(tx) } };
});
import { saveFounderEntry, deleteFounderEntry } from "../app/actions/founder-journal.actions";
const entry = { title: "A lesson", body: "Customers wanted fewer features.", visibility: "PRIVATE" };
beforeEach(() => {
  vi.clearAllMocks(); m.session.mockResolvedValue({ user: { id: "owner", emailVerified: true, banned: false } });
  m.find.mockResolvedValue({ id: "entry", publishedAt: new Date("2026-10-01"), startup: { slug: "old-startup" } });
  m.startup.mockResolvedValue({ id: "startup", slug: "new-startup", status: "LIVE" });
  m.update.mockResolvedValue({ count: 1 }); m.remove.mockResolvedValue({ count: 1 });
});
describe("founder journal authorization and visibility", () => {
  it.each([null, { user: { id: "owner", emailVerified: false } }, { user: { id: "owner", emailVerified: true, banned: true } }])("rejects unauthenticated, unverified and banned writes", async session => {
    m.session.mockResolvedValue(session);
    expect(await saveFounderEntry(null, entry)).toHaveProperty("error");
    expect(await deleteFounderEntry("entry")).toHaveProperty("error");
    expect(m.create).not.toHaveBeenCalled(); expect(m.remove).not.toHaveBeenCalled(); expect(m.find).not.toHaveBeenCalled();
  });
  it("defaults private with server-owned author identity and no publication date", async () => {
    expect(await saveFounderEntry(null, { title: "Notes", body: "Private thoughts", authorId: "attacker" })).toEqual({ success: true });
    expect(m.create).toHaveBeenCalledWith({ data: expect.objectContaining({ authorId: "owner", visibility: "PRIVATE", publishedAt: null, startupId: null }) });
  });
  it("does not read or alter another founder's entry", async () => {
    m.find.mockResolvedValue(null);
    expect(await saveFounderEntry("other-entry", entry)).toEqual({ error: "Entry not found." });
    expect(await deleteFounderEntry("other-entry")).toEqual({ error: "Entry not found." });
    expect(m.find).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "other-entry", authorId: "owner" } }));
    expect(m.update).not.toHaveBeenCalled(); expect(m.remove).not.toHaveBeenCalled();
  });
  it("rejects another founder's selected startup even for private entries", async () => {
    m.startup.mockResolvedValue(null);
    expect(await saveFounderEntry(null, { ...entry, startupId: "someone-elses-startup" })).toHaveProperty("error");
    expect(m.startup).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "someone-elses-startup", founderId: "owner" } }));
    expect(m.create).not.toHaveBeenCalled();
  });
  it.each(["DRAFT", "PENDING_REVIEW", "REJECTED", "SUSPENDED"])("cannot publish on a %s startup", async status => {
    m.startup.mockResolvedValue({ id: "startup", status });
    expect(await saveFounderEntry(null, { ...entry, visibility: "PUBLIC", startupId: "startup" })).toHaveProperty("error");
    expect(m.create).not.toHaveBeenCalled();
  });
  it("publishes only to the owned live startup and invalidates old and new public pages", async () => {
    expect(await saveFounderEntry("entry", { ...entry, visibility: "PUBLIC", startupId: "startup", milestone: "First customer", milestoneDone: true })).toEqual({ success: true });
    expect(m.update).toHaveBeenCalledWith({ where: { id: "entry", authorId: "owner" }, data: expect.objectContaining({ visibility: "PUBLIC", startupId: "startup", milestoneDone: true, publishedAt: new Date("2026-10-01") }) });
    expect(m.revalidate).toHaveBeenCalledWith("/startups/old-startup"); expect(m.revalidate).toHaveBeenCalledWith("/startups/new-startup");
  });
  it("withdraws a public entry, including from a suspended startup", async () => {
    m.startup.mockResolvedValue({ id: "startup", slug: "new-startup", status: "SUSPENDED" });
    expect(await saveFounderEntry("entry", { ...entry, startupId: "startup" })).toEqual({ success: true });
    expect(m.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ visibility: "PRIVATE", publishedAt: null }) }));
    expect(m.revalidate).toHaveBeenCalledWith("/startups/old-startup");
  });
  it("deletes with ownership in the write query and invalidates public output", async () => {
    expect(await deleteFounderEntry("entry")).toEqual({ success: true });
    expect(m.remove).toHaveBeenCalledWith({ where: { id: "entry", authorId: "owner" } });
    expect(m.revalidate).toHaveBeenCalledWith("/startups/old-startup");
  });
  it.each([{ title: "", body: "Text" }, { title: "Title", body: " " }, { ...entry, visibility: "PUBLIC" }, { ...entry, visibility: "everyone" }, { ...entry, body: "x".repeat(12001) }])("rejects invalid entry data before any write", async input => {
    expect(await saveFounderEntry(null, input)).toHaveProperty("error"); expect(m.create).not.toHaveBeenCalled();
  });
  it("returns no entry content or database details on failure", async () => {
    m.create.mockRejectedValueOnce(new Error("private journal body + database credentials"));
    const result = await saveFounderEntry(null, entry);
    expect(result).toHaveProperty("error"); expect(JSON.stringify(result)).not.toContain("credentials");
  });
  it("derives saved text from the validated Delta and ignores client HTML or forged summary text", async () => {
    const contentJson = { ops: [{ insert: "Rich text", attributes: { bold: true } }, { insert: "\n" }] };
    expect(await saveFounderEntry(null, { ...entry, body: "Forged summary", contentHtml: "<script>bad()</script>", contentJson })).toEqual({ success: true });
    const data = m.create.mock.calls[0][0].data;
    expect(data.body).toBe("Rich text"); expect(data.contentJson).toEqual(contentJson); expect(data).not.toHaveProperty("contentHtml");
  });
  it("rejects another founder's images, including images that were previously public", async () => {
    const contentJson = { ops: [{ insert: { image: "/api/uploads/serve/founder-journal/someone-else/12345678-1234-1234-1234-123456789abc.webp" } }] };
    expect(await saveFounderEntry(null, { ...entry, contentJson })).toHaveProperty("error"); expect(m.create).not.toHaveBeenCalled();
  });
  it("requires an owned upload record before attaching an image", async () => {
    const contentJson = { ops: [{ insert: { image: "/api/uploads/serve/founder-journal/owner/12345678-1234-1234-1234-123456789abc.webp" } }] };
    m.media.mockResolvedValueOnce(0);
    expect(await saveFounderEntry(null, { ...entry, contentJson })).toHaveProperty("error"); expect(m.create).not.toHaveBeenCalled();
    m.media.mockResolvedValueOnce(1);
    expect(await saveFounderEntry(null, { ...entry, contentJson })).toEqual({ success: true });
    expect(m.create.mock.calls[0][0].data.mediaKeys).toEqual(["founder-journal/owner/12345678-1234-1234-1234-123456789abc.webp"]);
  });
});
