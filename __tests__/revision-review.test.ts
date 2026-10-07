// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ session: vi.fn(), revision: vi.fn(), startup: vi.fn(), update: vi.fn(), remove: vi.fn(), reject: vi.fn(), query: vi.fn(), queue: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: mock.session } } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));
vi.mock("@/lib/jobs/queues", () => ({ emailQueue: { add: mock.queue } }));
vi.mock("@/lib/db", () => ({ db: { $transaction: async (fn: (tx: object) => unknown) => fn({ $queryRaw: mock.query, startup: { findUniqueOrThrow: mock.startup, update: mock.update }, startupRevision: { findUniqueOrThrow: mock.revision, delete: mock.remove, update: mock.reject } }) } }));
import { reviewRevision } from "../app/actions/revision.actions";
const id = "6b0ef103-2a8d-4232-8cff-68cf9a8a1ea9", version = "2026-10-02T01:00:00.000Z";
beforeEach(() => {
  vi.clearAllMocks(); mock.queue.mockResolvedValue({});
  mock.session.mockResolvedValue({ user: { id: "reviewer", role: "reviewer", emailVerified: true, banned: false } });
  mock.revision.mockResolvedValue({ id: "revision", startupId: id, data: { name: "New name", metadata: { city: "Hyderabad" } }, status: "PENDING_REVIEW", updatedAt: new Date(version) });
  mock.startup.mockResolvedValue({ id, name: "Published name", status: "LIVE", slug: "cane-theory", founder: { email: "owner@example.test" }, metadata: { sourceProject: "source", sourceId: id } });
});
it("approves the reviewed version atomically without losing migration metadata", async () => {
  expect(await reviewRevision("revision", version, "approve")).toEqual({ success: true });
  expect(mock.update).toHaveBeenCalledWith({ where: { id }, data: expect.objectContaining({ name: "New name", metadata: { sourceProject: "source", sourceId: id, city: "Hyderabad" } }) });
  expect(mock.remove).toHaveBeenCalledOnce();
});
it("rejects changes without modifying or unpublishing the live profile", async () => {
  expect(await reviewRevision("revision", version, "reject", "Please clarify the evidence")).toEqual({ success: true });
  expect(mock.update).not.toHaveBeenCalled(); expect(mock.reject).toHaveBeenCalledWith(expect.objectContaining({ data: { status: "REJECTED", notes: "Please clarify the evidence" } }));
});
it("refuses stale review pages", async () => {
  expect((await reviewRevision("revision", "2026-10-01T01:00:00.000Z", "approve")).error).toBeTruthy();
  expect(mock.update).not.toHaveBeenCalled(); expect(mock.remove).not.toHaveBeenCalled();
});
it("does not resurrect suspended profiles", async () => {
  mock.startup.mockResolvedValue({ id, status: "SUSPENDED" });
  expect((await reviewRevision("revision", version, "approve")).error).toBeTruthy(); expect(mock.update).not.toHaveBeenCalled();
});
it.each([null, { user: { role: "user", emailVerified: true } }, { user: { role: "admin", emailVerified: true, banned: true } }, { user: { role: "admin", emailVerified: false } }])("enforces reviewer authorization %j", async session => {
  mock.session.mockResolvedValue(session); expect(await reviewRevision("revision", version, "approve")).toEqual({ error: "Unauthorized" }); expect(mock.query).not.toHaveBeenCalled();
});
