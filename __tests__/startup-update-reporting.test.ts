// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ session: vi.fn(), create: vi.fn(), remove: vi.fn(), cache: vi.fn(), edit: vi.fn(), find: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: mock.session } } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/cache", () => ({ revalidatePath: mock.cache }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn(), warn: vi.fn() } }));
vi.mock("@/lib/db", () => ({ db: { startupUpdate: { findUnique: mock.find, update: mock.edit } } }));
vi.mock("@/lib/startup-update-store", () => ({ createStartupUpdate: mock.create, editStartupUpdate: async () => ({ update: await mock.edit() }), removeStartupUpdate: mock.remove, StartupUpdateError: class extends Error {} }));
import { createUpdate, deleteUpdate, editUpdate } from "@/app/actions/update.actions";
beforeEach(() => {
  vi.resetAllMocks(); mock.session.mockResolvedValue({ user: { id: "owner", emailVerified: true } });
  mock.cache.mockImplementation(() => { throw new Error("cache unavailable after commit"); });
  mock.create.mockResolvedValue({ update: { id: "saved" }, slug: "startup" });
  mock.remove.mockResolvedValue({ slug: "startup" });
  mock.find.mockResolvedValue({ startup: { founderId: "owner", slug: "startup" } });
  mock.edit.mockResolvedValue({ id: "edited" });
});
const input = { startupId: "123e4567-e89b-42d3-a456-426614174000", title: "A progress update", body: "Persisted progress for this fixture." };
it("does not report committed create/delete/edit as failed when cache refresh throws", async () => {
  expect(await createUpdate(input)).toEqual({ data: { id: "saved" } });
  expect(await deleteUpdate("saved")).toEqual({ success: true });
  expect(await editUpdate("clx12345678901234567890123", { title: "Edited title" })).toEqual({ data: { id: "edited" } });
});
it("does report a rolled-back transaction as failed", async () => {
  mock.create.mockRejectedValue(new Error("counter failure; transaction rolled back"));
  expect(await createUpdate(input)).toHaveProperty("error");
  expect(mock.cache).not.toHaveBeenCalled();
});
it("rejects invalid create input without a write", async () => {
  expect(await createUpdate({ ...input, title: "x" })).toHaveProperty("error");
  expect(mock.create).not.toHaveBeenCalled();
});
