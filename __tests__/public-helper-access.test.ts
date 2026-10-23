// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ session: vi.fn(), founders: vi.fn(), updates: vi.fn(), comments: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: mock.session } } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { startupFounder: { findMany: mock.founders }, startupUpdate: { findMany: mock.updates }, comment: { findMany: mock.comments } } }));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));
vi.mock("@/lib/utils/rate-limit", () => ({ checkRateLimit: vi.fn() }));
import { getFounders } from "@/app/actions/founder.actions";
import { GET as teamRoute } from "@/app/api/startups/[id]/founders/route";
import { getUpdates } from "@/app/actions/update.actions";
import { fetchApprovedComments } from "@/app/actions/comment.actions";
beforeEach(() => { vi.clearAllMocks(); mock.session.mockResolvedValue(null); mock.comments.mockResolvedValue([]); });
it("keeps background team reads uncached and within the public visibility boundary", async () => {
  mock.founders.mockResolvedValue([]);
  const response = await teamRoute(new Request("http://localhost/api/startups/known-id/founders"), { params: Promise.resolve({ id: "known-id" }) });
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(await response.json()).toEqual({ data: [] });
  expect(mock.founders).toHaveBeenCalledWith(expect.objectContaining({ where: { startupId: "known-id", startup: { status: "LIVE", founder: { founderMode: true } } } }));
});
it.each(["DRAFT", "PENDING_REVIEW", "REJECTED", "SUSPENDED"])("does not expose %s helpers anonymously", async status => {
  // A minimal predicate-aware fixture, not a mock that returns private rows
  // regardless of the query's publication boundary.
  const find = async ({ where }: { where: { startup?: { status?: string } } }) => where.startup?.status === status ? [{ id: "private" }] : [];
  mock.founders.mockImplementation(find); mock.updates.mockImplementation(find);
  expect(await getFounders("known-id")).toEqual({ data: [] });
  expect(await getUpdates("known-id")).toEqual({ data: [] });
  await fetchApprovedComments("known-id");
  expect(mock.comments).toHaveBeenCalledWith(expect.objectContaining({ where: { startupId: "known-id", status: "APPROVED", startup: { status: "LIVE", founder: { founderMode: true } } } }));
});
it("keeps draft management available to its verified owner without broadening public access", async () => {
  mock.session.mockResolvedValue({ user: { id: "owner", emailVerified: true } });
  mock.founders.mockResolvedValue([]); mock.updates.mockResolvedValue([]);
  await getFounders("draft"); await getUpdates("draft");
  for (const find of [mock.founders, mock.updates]) expect(find).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ startupId: "draft", startup: { OR: [{ status: "LIVE", founder: { founderMode: true } }, { founderId: "owner" }] } }), select: expect.any(Object) }));
});
it("rejects serialized filter operators instead of accepting a string-shaped type assertion", async () => {
  const input = { not: "anything" } as unknown as string;
  expect(await getFounders(input)).toHaveProperty("error"); expect(await getUpdates(input)).toHaveProperty("error");
  expect(await fetchApprovedComments(input)).toEqual({ comments: [], nextCursor: null });
  expect(mock.founders).not.toHaveBeenCalled(); expect(mock.updates).not.toHaveBeenCalled(); expect(mock.comments).not.toHaveBeenCalled();
});
