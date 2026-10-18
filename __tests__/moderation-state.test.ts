// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ session: vi.fn(), update: vi.fn(), queue: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: mock.session } } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { startup: { update: mock.update } } }));
vi.mock("@/lib/jobs/queues", () => ({ emailQueue: { add: mock.queue } }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));
import { approveStartup, rejectStartup } from "@/app/actions/admin.actions";
beforeEach(() => {
  vi.clearAllMocks(); mock.session.mockResolvedValue({ user: { id: "reviewer", role: "reviewer", emailVerified: true } });
  mock.queue.mockResolvedValue({});
});
it.each(["DRAFT", "REJECTED", "SUSPENDED", "LIVE"])("a reviewer cannot approve or reject %s through a direct action call", async state => {
  let status = state;
  mock.update.mockImplementation(async ({ where, data }) => {
    if (where.status !== status) throw new Error("State conflict");
    status = data.status; return { id: "startup", name: "Startup", slug: "startup", founder: { email: "fixture@example.test" } };
  });
  expect(await approveStartup("startup")).toHaveProperty("error");
  const form = new FormData(); form.set("id", "startup"); form.set("adminNotes", "Needs work");
  expect(await rejectStartup(form)).toHaveProperty("error");
  expect(status).toBe(state); expect(mock.queue).not.toHaveBeenCalled();
  for (const [arg] of mock.update.mock.calls) expect(arg.where).toEqual({ id: "startup", status: "PENDING_REVIEW" });
});
it("allows pending reviews and rejects repeat approvals at the database boundary", async () => {
  let status = "PENDING_REVIEW";
  mock.update.mockImplementation(async ({ where, data }) => {
    if (where.status !== status) throw new Error("State conflict"); status = data.status;
    return { id: "startup", name: "Startup", slug: "startup", founder: { email: "fixture@example.test" } };
  });
  expect(await approveStartup("startup")).toEqual({ success: true });
  expect(await approveStartup("startup")).toHaveProperty("error");
  expect(mock.queue).toHaveBeenCalledOnce();
});
