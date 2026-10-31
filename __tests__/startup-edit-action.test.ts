// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ session: vi.fn(), find: vi.fn(), update: vi.fn(), queue: vi.fn(), revalidate: vi.fn(), revision: vi.fn(), query: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: mock.session } } }));
vi.mock("@/lib/db", () => { const tx = { startup: { findUnique: mock.find, findUniqueOrThrow: mock.find, update: mock.update }, startupRevision: { findUnique: async () => null, upsert: mock.revision }, $queryRaw: mock.query }; return { db: { ...tx, $transaction: async (fn: (tx: object) => unknown) => fn(tx) } }; });
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/cache", () => ({ revalidatePath: mock.revalidate }));
vi.mock("@/lib/jobs/queues", () => ({ notificationQueue: { add: mock.queue } }));
vi.mock("@/lib/notification-outbox", () => ({ storeNotification: async () => ({ id: "event" }), deliverNotification: async () => { try { await mock.queue(); return true; } catch { return false; } } }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));
vi.mock("@/app/actions/settings.actions", () => ({ getSettingValue: vi.fn() }));
import { createStartup, updateStartup } from "../app/actions/startup.actions";

const id = "6b0ef103-2a8d-4232-8cff-68cf9a8a1ea9";
const owner = "cmu7wfiv7000bzglryqzerzjo";
const deck = `/api/uploads/serve/pitch-decks/${owner}/${id}.pdf`;
function form(fields: Record<string, string> = {}) {
  const data = new FormData(); data.set("id", id);
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}
beforeEach(() => {
  vi.clearAllMocks();
  mock.queue.mockResolvedValue({});
  mock.session.mockResolvedValue({ user: { id: owner, name: "Owner" } });
  mock.find.mockResolvedValue({ id, founderId: owner, status: "LIVE", metadata: { sourceProject: "source", sourceId: id, city: "Hyderabad", pitchDeckUrl: deck } });
  mock.update.mockResolvedValue({ id, name: "Cane Theory", founder: { name: "Owner" }, category: { name: "FoodTech" } });
});
describe("UUID edit action", () => {
  it("rejects the reported labelled website before looking up or changing a startup", async () => {
    const result = await updateStartup(form({ websiteUrl: "Website: https://www.clarrx.com" }));
    expect(result.details?.websiteUrl).toContain("Enter a complete http or https website address.");
    expect(mock.find).not.toHaveBeenCalled();
    expect(mock.update).not.toHaveBeenCalled();
    expect(mock.revision).not.toHaveBeenCalled();
  });
  it("rejects the reported labelled website when creating a startup", async () => {
    mock.session.mockResolvedValue({ user: { id: owner, name: "Owner", emailVerified: true } });
    const result = await createStartup(form({
      name: "Example startup", tagline: "A useful startup for a focused audience",
      categoryId: owner, websiteUrl: "Website: https://www.clarrx.com",
    }));
    expect(result.details?.websiteUrl).toContain("Enter a complete http or https website address.");
    expect(mock.find).not.toHaveBeenCalled();
    expect(mock.update).not.toHaveBeenCalled();
    expect(mock.revision).not.toHaveBeenCalled();
  });
  it("stages a trimmed web address without changing the live profile", async () => {
    const result = await updateStartup(form({ websiteUrl: "  https://example.com/path  " }));
    expect(result.pendingRevision).toBe(true);
    expect(mock.revision).toHaveBeenCalledWith(expect.objectContaining({ create: expect.objectContaining({ data: expect.objectContaining({ websiteUrl: "https://example.com/path" }) }) }));
    expect(mock.update).not.toHaveBeenCalled();
  });
  it("keeps the UUID profile live and stages edits separately; deck removal immediately revokes public access", async () => {
    const result = await updateStartup(form({ name: "Cane Theory", pitchDeckUrl: "", galleryImages: "" }));
    expect(result.error).toBeUndefined();
    expect(mock.revision).toHaveBeenCalledWith(expect.objectContaining({ create: { startupId: id, data: expect.objectContaining({ galleryImages: [], metadata: { sourceProject: "source", sourceId: id, city: "Hyderabad", pitchDeckUrl: "" } }) } }));
    expect(mock.update).toHaveBeenCalledWith({ where: { id }, data: { metadata: expect.objectContaining({ pitchDeckVisibility: "private" }) } });
    expect(mock.update.mock.calls.every(([arg]) => arg.data.status === undefined)).toBe(true);
    expect(mock.queue).toHaveBeenCalledOnce();
  });
  it("does not report failure after saving when notification delivery fails", async () => {
    mock.queue.mockRejectedValueOnce(new Error("redis temporarily down"));
    expect((await updateStartup(form({ name: "Cane Theory" }))).pendingRevision).toBe(true);
  });
  it("continues saving unpublished drafts directly", async () => {
    mock.find.mockResolvedValue({ id, founderId: owner, status: "DRAFT", metadata: { sourceId: id } });
    const result = await updateStartup(form({ name: "Cane Theory" }));
    expect(result.error).toBeUndefined(); expect(mock.revision).not.toHaveBeenCalled();
    expect(mock.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "DRAFT", name: "Cane Theory" }) }));
  });
  it("still rejects another user's startup", async () => {
    mock.session.mockResolvedValue({ user: { id: "someone-else" } });
    expect(await updateStartup(form())).toEqual({ error: "Unauthorized" });
    expect(mock.update).not.toHaveBeenCalled();
  });
  it("rejects anonymous edits", async () => {
    mock.session.mockResolvedValue(null);
    expect(await updateStartup(form())).toEqual({ error: "Unauthorized" });
    expect(mock.find).not.toHaveBeenCalled();
  });
  it("rejects attaching another user's uploaded deck", async () => {
    expect(await updateStartup(form({ pitchDeckUrl: deck.replace(owner, "other-user") }))).toEqual({ error: "Please upload your own PDF pitch deck." });
    expect(mock.update).not.toHaveBeenCalled();
  });
  it("keeps moderation state restrictions", async () => {
    mock.find.mockResolvedValue({ id, founderId: owner, status: "PENDING_REVIEW" });
    expect(await updateStartup(form())).toEqual({ error: "Cannot edit startup in its current state" });
    expect(mock.update).not.toHaveBeenCalled();
  });
  it("rejects malformed IDs before looking up records", async () => {
    expect((await updateStartup(form({ id: "not-a-valid-id" }))).error).toBeTruthy();
    expect(mock.find).not.toHaveBeenCalled();
  });
});
