// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const m = vi.hoisted(() => ({ session: vi.fn(), shared: vi.fn(), storage: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: m.session } } }));
vi.mock("@/lib/db", () => ({ db: { founderJournalEntry: { findFirst: m.shared } } }));
vi.mock("@/lib/storage/r2", () => ({ r2: { send: m.storage } }));
import { GET } from "../app/api/uploads/serve/[...path]/route";
const path = ["founder-journal", "owner", "12345678-1234-1234-1234-123456789abc.webp"];
async function get(parts = path) { return GET(new NextRequest(`http://localhost/api/uploads/serve/${parts.join("/")}`), { params: Promise.resolve({ path: parts }) }); }
beforeEach(() => { vi.clearAllMocks(); m.session.mockResolvedValue(null); m.shared.mockResolvedValue(null); m.storage.mockResolvedValue({ Body: { transformToByteArray: async () => new Uint8Array([1, 2, 3]) }, ContentType: "image/webp" }); });
describe("journal image visibility", () => {
  it("lets the owner preview an unshared upload without making it cacheable", async () => {
    m.session.mockResolvedValue({ user: { id: "owner" } });
    const response = await get(); expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store"); expect(response.headers.get("vary")).toBe("Cookie");
    expect(m.shared).not.toHaveBeenCalled();
  });
  it.each([null, { user: { id: "another-founder" } }, { user: { id: "admin", role: "admin" } }])("does not disclose private image bytes to other viewers", async session => {
    m.session.mockResolvedValue(session);
    const response = await get(); expect(response.status).toBe(404); expect(response.headers.get("cache-control")).toBe("private, no-store"); expect(m.storage).not.toHaveBeenCalled();
  });
  it("allows anonymous access only through a public entry on the matching live startup", async () => {
    m.shared.mockResolvedValue({ id: "public-entry" });
    const response = await get(); expect(response.status).toBe(200);
    expect(m.shared).toHaveBeenCalledWith({ where: { authorId: "owner", visibility: "PUBLIC", mediaKeys: { has: path.join("/") }, startup: { status: "LIVE", founderId: "owner" } }, select: { id: true } });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
  it("rechecks access on every request so returning an entry to private revokes the image URL", async () => {
    m.shared.mockResolvedValueOnce({ id: "public-entry" }); expect((await get()).status).toBe(200);
    expect((await get()).status).toBe(404); expect(m.storage).toHaveBeenCalledTimes(1);
  });
  it("rejects malformed media paths before looking in storage", async () => {
    expect((await get(["founder-journal", "owner", "..", "secret.webp"])).status).toBe(404); expect(m.storage).not.toHaveBeenCalled();
  });
});
