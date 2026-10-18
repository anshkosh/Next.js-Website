// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";
const mock = vi.hoisted(() => ({ session: vi.fn(), store: vi.fn(), eval: vi.fn(), qpdf: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: mock.session } } }));
vi.mock("@/lib/uploads/store", () => ({ storeUpload: mock.store }));
vi.mock("@/lib/uploads/qpdf", () => ({ qpdfNormalize: mock.qpdf }));
vi.mock("ioredis", () => ({ default: class { on() {} disconnect() {} eval(...args: unknown[]) { return mock.eval(...args); } } }));
import { POST as logo } from "@/app/api/uploads/logo/route";
import { POST as gallery } from "@/app/api/uploads/gallery/route";
import { POST as founder } from "@/app/api/uploads/founder-photo/route";
import { POST as update } from "@/app/api/uploads/update-image/route";
import { POST as journal } from "@/app/api/uploads/journal/route";
import { POST as founderJournal } from "@/app/api/uploads/founder-journal/route";
import { POST as deck } from "@/app/api/uploads/pitch-deck/route";
const images = [logo, gallery, founder, update, journal, founderJournal];
const all = [...images, deck];
function req(bytes: Buffer = Buffer.from("invalid"), type = "image/png", origin = "https://www.anshkosh.com") {
  const form = new FormData(); form.set("file", new File([new Uint8Array(bytes)], type === "application/pdf" ? "deck.pdf" : "file.png", { type }));
  return new NextRequest("https://www.anshkosh.com/api/uploads/test", { method: "POST", headers: { origin }, body: form });
}
beforeEach(() => {
  vi.clearAllMocks(); mock.eval.mockResolvedValue(1); mock.store.mockResolvedValue({});
  mock.session.mockResolvedValue({ user: { id: "owner", emailVerified: true, banned: false, role: "admin" } });
  mock.qpdf.mockImplementation(async bytes => bytes);
});
describe("every upload entry point", () => {
  it.each(all)("rejects foreign origins before storing", async post => {
    expect((await post(req(undefined, undefined, "https://attacker.test"))).status).toBe(403);
    expect(mock.store).not.toHaveBeenCalled();
  });
  it.each(all)("rejects anonymous, unverified and banned accounts", async post => {
    for (const user of [null, { id: "owner", emailVerified: false }, { id: "owner", emailVerified: true, banned: true }]) {
      mock.session.mockResolvedValue(user ? { user } : null);
      expect((await post(req())).status).toBe(401);
    }
    expect(mock.store).not.toHaveBeenCalled();
  });
  it.each(all)("enforces the shared attempt limit", async post => {
    mock.eval.mockResolvedValue(21);
    expect((await post(req())).status).toBe(429); expect(mock.store).not.toHaveBeenCalled();
  });
  it.each(images)("rejects garbage with a plausible image MIME type", async post => {
    expect((await post(req())).status).toBe(400); expect(mock.store).not.toHaveBeenCalled();
  });
  it.each(images)("re-encodes accepted images through quota-accounted storage", async post => {
    const input = await sharp({ create: { width: 10, height: 10, channels: 3, background: "orange" } }).png().toBuffer();
    expect((await post(req(input))).status).toBe(200);
    const [owner, key, stored, type] = mock.store.mock.calls[0];
    expect(owner).toBe("owner"); expect(key).toMatch(/\.webp$/); expect(type).toBe("image/webp");
    expect((await sharp(stored).metadata()).format).toBe("webp");
  });
  it("keeps journal uploads admin-only even for verified founders", async () => {
    mock.session.mockResolvedValue({ user: { id: "owner", emailVerified: true, role: "user" } });
    expect((await journal(req())).status).toBe(403); expect(mock.store).not.toHaveBeenCalled();
  });
  it("runs a valid PDF through sanitization, qpdf and shared quota storage", async () => {
    const pdf = await PDFDocument.create(); pdf.addPage();
    expect((await deck(req(Buffer.from(await pdf.save()), "application/pdf"))).status).toBe(200);
    expect(mock.qpdf).toHaveBeenCalledOnce(); expect(mock.store).toHaveBeenCalledOnce();
  });
});
