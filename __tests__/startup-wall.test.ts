// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ session: vi.fn(), lookup: vi.fn(), update: vi.fn(), revision: vi.fn(), revise: vi.fn(), lock: vi.fn(), revalidate: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: mocks.session } } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/lib/cache-after-save", () => ({ revalidateSavedPath: mocks.revalidate }));
vi.mock("@/lib/db", () => ({ db: { $transaction: async (fn: (tx: object) => unknown) => fn({
  $queryRaw: mocks.lock, startup: { findUniqueOrThrow: mocks.lookup, update: mocks.update },
  startupRevision: { findUnique: mocks.revision, update: mocks.revise },
}) } }));
import { withdrawFromWall } from "@/app/actions/startup-wall";
import { orderWallTiles, wallStartupWhere } from "@/lib/startup-wall";
import { savePublishedRevision } from "@/lib/startup-revisions";
import type { Prisma, Startup } from "@prisma/client";
const id = "6b0ef103-2a8d-4232-8cff-68cf9a8a1ea9";
beforeEach(() => {
  vi.clearAllMocks(); mocks.session.mockResolvedValue({ user: { id: "owner", emailVerified: true } });
  mocks.lookup.mockResolvedValue({ id, founderId: "owner" });
  mocks.revision.mockResolvedValue({ id: "pending", data: { wallOptIn: true, name: "Pending name" } });
});
it("withdraws immediately and removes consent from the pending review without dropping unrelated edits", async () => {
  expect(await withdrawFromWall(id)).toEqual({ success: true });
  expect(mocks.lock.mock.invocationCallOrder[0]).toBeLessThan(mocks.lookup.mock.invocationCallOrder[0]);
  expect(mocks.update).toHaveBeenCalledWith({ where: { id }, data: { wallOptIn: false } });
  expect(mocks.revise).toHaveBeenCalledWith({ where: { id: "pending" }, data: { data: { wallOptIn: false, name: "Pending name" } } });
  expect(mocks.revalidate).toHaveBeenCalledWith("/startup-wall");
});
it("refuses another founder's withdrawal before changing published or pending content", async () => {
  mocks.lookup.mockResolvedValue({ id, founderId: "other-owner" });
  expect((await withdrawFromWall(id)).error).toBeTruthy();
  expect(mocks.update).not.toHaveBeenCalled(); expect(mocks.revise).not.toHaveBeenCalled();
});
it.each([null, { user: { id: "owner", emailVerified: false } }, { user: { id: "owner", emailVerified: true, banned: true } }])("requires a verified, allowed owner: %j", async session => {
  mocks.session.mockResolvedValue(session); expect((await withdrawFromWall(id)).error).toBeTruthy(); expect(mocks.lock).not.toHaveBeenCalled();
});
it("only projects live opted-in startups whose founders have enabled public profiles", () => {
  expect(wallStartupWhere).toMatchObject({ status: "LIVE", wallOptIn: true, founder: { founderMode: true } });
});
it("promotes a current 24-hour spotlight then returns it to the ordinary Wall after expiry", () => {
  const now = new Date("2026-11-04T12:00:00Z");
  const rows = [
    { id: "ordinary", featuredEntry: null },
    { id: "manual", featuredEntry: { sortOrder: 0, featuredUntil: null } },
    { id: "day", featuredEntry: { sortOrder: 4, featuredUntil: new Date("2026-11-05T12:00:00Z") } },
  ];
  expect(orderWallTiles(rows, now).map(row => row.id)).toEqual(["day", "manual", "ordinary"]);
  expect(orderWallTiles(rows, new Date("2026-11-05T12:00:00Z")).map(row => row.id)).toEqual(["manual", "ordinary", "day"]);
});
it("keeps opt-ins and replacement creatives pending while publishing a withdrawal immediately", async () => {
  const current = { id, founderId: "owner", status: "LIVE", metadata: {}, wallOptIn: true } as Startup;
  const tx = { $queryRaw: vi.fn(), startup: { findUniqueOrThrow: vi.fn().mockResolvedValue(current), update: vi.fn() }, startupRevision: { findUnique: vi.fn().mockResolvedValue(null), upsert: vi.fn() } };
  await savePublishedRevision(tx as unknown as Prisma.TransactionClient, current, { wallOptIn: true, wallImageUrl: "/api/uploads/serve/gallery/test.webp" });
  expect(tx.startup.update).not.toHaveBeenCalled();
  expect(tx.startupRevision.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: expect.objectContaining({ data: expect.objectContaining({ wallOptIn: true, wallImageUrl: "/api/uploads/serve/gallery/test.webp" }) }) }));
  await savePublishedRevision(tx as unknown as Prisma.TransactionClient, current, { wallOptIn: false });
  expect(tx.startup.update).toHaveBeenCalledWith({ where: { id }, data: { wallOptIn: false } });
});
