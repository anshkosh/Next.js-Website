// @vitest-environment node
import { vi, beforeEach, expect, it } from "vitest";
import { NextRequest } from "next/server";
const mock = vi.hoisted(() => ({ session: vi.fn(), profiles: vi.fn(), send: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: mock.session } } }));
vi.mock("@/lib/db", () => ({ db: { startup: { findMany: mock.profiles } } }));
vi.mock("@/lib/storage/r2", () => ({ r2: { send: mock.send } }));
import { GET } from "../app/api/uploads/serve/[...path]/route";
import { publicPitchDeck } from "../lib/pitch-deck-access";
const owner = "cmu7wfiv7000bzglryqzerzjo";
const parts = ["pitch-decks", owner, "6b0ef103-2a8d-4232-8cff-68cf9a8a1ea9.pdf"];
const url = `/api/uploads/serve/${parts.join("/")}`;
const get = (path = parts) => GET(new NextRequest(`https://www.anshkosh.com${url}`), { params: Promise.resolve({ path }) });
beforeEach(() => {
  vi.clearAllMocks(); mock.profiles.mockResolvedValue([]); mock.session.mockResolvedValue(null);
  mock.send.mockResolvedValue({ Body: { transformToByteArray: async () => new Uint8Array([1]) }, ContentType: "application/pdf" });
});
it("denies direct unauthenticated access to unlinked or private decks", async () => {
  expect((await get()).status).toBe(404); expect(mock.send).not.toHaveBeenCalled();
  mock.profiles.mockResolvedValue([{ metadata: { pitchDeckUrl: url, pitchDeckVisibility: "private" } }]);
  expect((await get()).status).toBe(404);
});
it.each(["owner", "admin", "reviewer"])("allows a verified active %s to download private decks without caching", async role => {
  mock.session.mockResolvedValue({ user: { id: role === "owner" ? owner : "other", role, emailVerified: true, banned: false } });
  const response = await get(); expect(response.status).toBe(200); expect(response.headers.get("cache-control")).toBe("private, no-store");
});
it.each([{ id: "other", role: "user", emailVerified: true }, { id: owner, emailVerified: false }, { id: owner, emailVerified: true, banned: true }])("denies unauthorized users %j", async user => {
  mock.session.mockResolvedValue({ user }); expect((await get()).status).toBe(404); expect(mock.send).not.toHaveBeenCalled();
});
it("only exposes explicitly public/legacy decks from live profiles", async () => {
  mock.profiles.mockResolvedValue([{ metadata: { pitchDeckUrl: url, pitchDeckVisibility: "public" } }]);
  expect((await get()).status).toBe(200);
  expect(mock.profiles).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ status: "LIVE" }) }));
  expect(publicPitchDeck({ pitchDeckUrl: url })).toBe(url);
  expect(publicPitchDeck({ pitchDeckUrl: url, pitchDeckVisibility: "private" })).toBeNull();
});
it("never exposes the backup prefix, invalid paths or disguised deck keys", async () => {
  for (const path of [["private-backups", "db.dump.aes"], ["pitch-decks", "..", "x.pdf"], ["pitch-decks", owner, "x.txt"]]) expect((await get(path)).status).toBe(404);
  expect(mock.send).not.toHaveBeenCalled();
});
it("preserves access to existing founder update pictures", async () => {
  expect((await get(["update-images", "existing.webp"])).status).toBe(200);
});
