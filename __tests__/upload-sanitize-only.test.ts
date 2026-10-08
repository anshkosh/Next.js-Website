// @vitest-environment node
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { PDFDocument } from "pdf-lib";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ session: vi.fn(), send: vi.fn(), scan: vi.fn(), qpdf: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: mocks.session } } }));
vi.mock("@/lib/uploads/store", () => ({ storeUpload: mocks.send }));
vi.mock("ioredis", () => ({ default: class { on() {} disconnect() {} async eval() { return 1; } } }));
vi.mock("@/lib/uploads/safety", async importOriginal => ({ ...await importOriginal<object>(), scanUpload: mocks.scan }));
vi.mock("@/lib/uploads/qpdf", () => ({ qpdfNormalize: mocks.qpdf }));
import { UploadError } from "../lib/uploads/safety";
import { UPLOAD_SCAN_MODE } from "../lib/uploads/scan-mode";
import { scanIfEnabled } from "../lib/uploads/scan";
import { POST } from "../app/api/uploads/pitch-deck/route";

const owner = "cmu7wfiv7000bzglryqzerzjo";
let valid: Uint8Array;
beforeAll(async () => { const doc = await PDFDocument.create(); doc.addPage(); valid = await doc.save(); });
function request() {
  const form = new FormData(); form.append("file", new File([Buffer.from(valid)], "deck.pdf", { type: "application/pdf" }));
  return new NextRequest("http://localhost:3000/api/uploads/pitch-deck", { method: "POST", headers: { origin: "https://www.anshkosh.com" }, body: form });
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.session.mockResolvedValue({ user: { id: owner, emailVerified: true, banned: false } });
  mocks.send.mockResolvedValue({});
  mocks.qpdf.mockImplementation(async (bytes: Buffer) => Buffer.concat([bytes, Buffer.from("\n%qpdf")]));
});

describe("interim sanitize-only upload mode (ClamAV not installed)", () => {
  it("ships in sanitize-only mode until ClamAV is verified on the VPS", () => {
    expect(UPLOAD_SCAN_MODE).toBe("sanitize-only");
  });
  it("does not call ClamAV, so a missing scanner can no longer block uploads", async () => {
    await scanIfEnabled(Buffer.from("anything"));
    expect(mocks.scan).not.toHaveBeenCalled();
  });
  it("accepts a valid PDF: sanitised by pdf-lib, normalised by qpdf, stored, never scanned", async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(mocks.qpdf).toHaveBeenCalledOnce();
    expect(mocks.scan).not.toHaveBeenCalled();
    expect(mocks.send).toHaveBeenCalledOnce();
    const stored = mocks.send.mock.calls[0][2] as Buffer;
    expect(stored.toString("latin1")).toContain("%qpdf"); // the stored bytes are qpdf's output, not the raw upload
  });
  it("stores nothing when qpdf rejects the PDF", async () => {
    mocks.qpdf.mockRejectedValueOnce(new UploadError("This PDF could not be read. Export it again and try once more.", 400));
    const response = await POST(request());
    expect(response.status).toBe(400);
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it("stores nothing and answers a retryable 503 when qpdf is unavailable", async () => {
    mocks.qpdf.mockRejectedValueOnce(new UploadError("PDF checking is temporarily unavailable. Please try again shortly."));
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(mocks.send).not.toHaveBeenCalled();
  });
});
