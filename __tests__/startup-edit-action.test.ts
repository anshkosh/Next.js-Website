// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ session: vi.fn(), find: vi.fn(), update: vi.fn(), queue: vi.fn(), revalidate: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: mock.session } } }));
vi.mock("@/lib/db", () => ({ db: { startup: { findUnique: mock.find, update: mock.update } } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/cache", () => ({ revalidatePath: mock.revalidate }));
vi.mock("@/lib/jobs/queues", () => ({ notificationQueue: { add: mock.queue } }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));
vi.mock("@/app/actions/settings.actions", () => ({ getSettingValue: vi.fn() }));
import { updateStartup } from "../app/actions/startup.actions";

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
  mock.session.mockResolvedValue({ user: { id: owner, name: "Owner" } });
  mock.find.mockResolvedValue({ id, founderId: owner, status: "LIVE", metadata: { sourceProject: "source", sourceId: id, city: "Hyderabad", pitchDeckUrl: deck } });
  mock.update.mockResolvedValue({ id, name: "Cane Theory", founder: { name: "Owner" }, category: { name: "FoodTech" } });
});
describe("UUID edit action", () => {
  it("saves the original UUID, preserves migration metadata, clears all gallery images and sends for review", async () => {
    const result = await updateStartup(form({ name: "Cane Theory", pitchDeckUrl: "", galleryImages: "" }));
    expect(result.error).toBeUndefined();
    expect(mock.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id }, data: expect.objectContaining({ status: "PENDING_REVIEW", galleryImages: [], metadata: { sourceProject: "source", sourceId: id, city: "Hyderabad", pitchDeckUrl: "" } }) }));
    expect(mock.queue).toHaveBeenCalledOnce();
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
