// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import sharp from "sharp";
const m = vi.hoisted(() => ({ authorize: vi.fn(), scan: vi.fn(), store: vi.fn() }));
vi.mock("@/lib/uploads/safety", async importOriginal => ({ ...await importOriginal<typeof import("../lib/uploads/safety")>(), authorizeUpload: m.authorize }));
vi.mock("@/lib/uploads/scan", () => ({ scanIfEnabled: m.scan }));
vi.mock("@/lib/uploads/store", () => ({ storeUpload: m.store }));
import { POST } from "../app/api/uploads/founder-journal/route";
beforeEach(() => { vi.clearAllMocks(); m.authorize.mockResolvedValue({ id: "owner" }); });
function request(file: File) { const body = new FormData(); body.set("file", file); return new NextRequest("http://localhost/api/uploads/founder-journal", { method: "POST", body }); }
it("rewrites uploaded images into owned private media and uses upload protections", async () => {
  const bytes = await sharp({ create: { width: 2000, height: 1000, channels: 3, background: "#ff8844" } }).png().toBuffer();
  const response = await POST(request(new File([bytes], "test.png", { type: "image/png" })));
  expect(response.status).toBe(200); expect(m.authorize).toHaveBeenCalled(); expect(m.scan).toHaveBeenCalled();
  const [owner, key, stored, type] = m.store.mock.calls[0];
  expect(owner).toBe("owner"); expect(key).toMatch(/^founder-journal\/owner\/[0-9a-f-]+\.webp$/); expect(type).toBe("image/webp");
  const metadata = await sharp(stored).metadata(); expect(metadata.format).toBe("webp"); expect(metadata.width).toBe(1600);
  expect(await response.json()).toEqual({ url: `/api/uploads/serve/${key}` });
});
it("rejects disguised or unreadable image bytes without storing them", async () => {
  expect((await POST(request(new File(["not an image"], "fake.png", { type: "image/png" })))).status).toBe(400);
  expect(m.store).not.toHaveBeenCalled();
});
it("does not accept SVG or HTML uploads", async () => {
  expect((await POST(request(new File(["<svg></svg>"], "active.svg", { type: "image/svg+xml" })))).status).toBe(400);
  expect(m.store).not.toHaveBeenCalled();
});
