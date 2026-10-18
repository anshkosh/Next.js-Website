// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import sharp from "sharp";
const mock = vi.hoisted(() => ({ send: vi.fn(), find: vi.fn(), image: vi.fn() }));
vi.mock("@/lib/storage/r2", () => ({ r2: { send: mock.send } }));
vi.mock("@/lib/db", () => ({ db: { startup: { findUnique: mock.find } } }));
vi.mock("next/og", () => ({ ImageResponse: class extends Response { constructor(tree: unknown) { super("image"); mock.image(tree); } } }));
import { ogLogo } from "@/lib/og-logo";
import { GET } from "@/app/api/og/[slug]/route";
import { NextRequest } from "next/server";
beforeEach(() => { vi.clearAllMocks(); });
describe("OG destination boundary", () => {
  it.each([
    "http://127.0.0.1:3000/admin", "http://169.254.169.254/latest/meta-data/", "http://[::1]/", "http://2130706433/", "http://localhost/",
    "https://attacker.test/redirect-to-internal", "//127.0.0.1/", "data:image/svg+xml,<svg/>",
    "/api/uploads/serve/logos/../../secrets", "/api/uploads/serve/pitch-decks/private.pdf", "/api/uploads/serve/logos/%2e%2e/private.png",
  ])("never fetches an untrusted destination %s", async url => {
    expect(await ogLogo(url)).toBeUndefined(); expect(mock.send).not.toHaveBeenCalled();
  });
  it("reads a relative owned logo as bounded bytes and renders a PNG data URI", async () => {
    const input = await sharp({ create: { width: 10, height: 10, channels: 3, background: "orange" } }).webp().toBuffer();
    mock.send.mockResolvedValue({ ContentLength: input.length, Body: (async function* () { yield input; })() });
    expect(await ogLogo("/api/uploads/serve/logos/test.webp")).toMatch(/^data:image\/png;base64,/);
    expect(mock.send.mock.calls[0][0].input.Key).toBe("logos/test.webp");
  });
  it("falls back on corrupt, oversized and unavailable storage objects", async () => {
    mock.send.mockResolvedValueOnce({ ContentLength: 3_000_000, Body: {} });
    expect(await ogLogo("/api/uploads/serve/logos/test.webp")).toBeUndefined();
    mock.send.mockRejectedValueOnce(new Error("unavailable"));
    expect(await ogLogo("/api/uploads/serve/logos/test.webp")).toBeUndefined();
  });
  it("requires a LIVE parent and returns 404 without rendering a private startup", async () => {
    mock.find.mockResolvedValue(null);
    expect((await GET(new NextRequest("https://www.anshkosh.com/api/og/draft"), { params: Promise.resolve({ slug: "draft" }) })).status).toBe(404);
    expect(mock.find).toHaveBeenCalledWith(expect.objectContaining({ where: { slug: "draft", status: "LIVE" } }));
    expect(mock.image).not.toHaveBeenCalled(); expect(mock.send).not.toHaveBeenCalled();
  });
});
