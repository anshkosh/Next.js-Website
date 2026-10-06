// @vitest-environment node
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { PDFDocument } from "pdf-lib";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ session: vi.fn(), send: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: mocks.session } } }));
vi.mock("@/lib/storage/r2", () => ({ r2: { send: mocks.send } }));
import { POST } from "../app/api/uploads/pitch-deck/route";
const owner = "cmu7wfiv7000bzglryqzerzjo";
let valid: Uint8Array;
beforeAll(async () => { const doc = await PDFDocument.create(); doc.addPage(); valid = await doc.save(); });
function request({ origin = "https://www.anshkosh.com", content, name = "deck.pdf", sizeHeader }: { origin?: string; content?: string; name?: string; sizeHeader?: string } = {}) {
  const form = new FormData(); form.append("file", new File([content ?? Buffer.from(valid)], name, { type: "application/pdf" }));
  return new NextRequest("http://localhost:3000/api/uploads/pitch-deck", { method: "POST", headers: { origin, ...(sizeHeader ? { "content-length": sizeHeader } : {}) }, body: form });
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.session.mockResolvedValue({ user: { id: owner, emailVerified: true, banned: false } });
  mocks.send.mockResolvedValue({});
});
describe("pitch deck upload security", () => {
  it.each(["https://www.anshkosh.com", "https://anshkosh.com"])("accepts official origin %s behind the HTTP reverse proxy", async origin => {
    const response = await POST(request({ origin }));
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.url).toMatch(new RegExp(`^/api/uploads/serve/pitch-decks/${owner}/[a-f0-9-]+\\.pdf$`));
    expect(mocks.send.mock.calls[0][0].input).toMatchObject({ ContentType: "application/pdf", ContentDisposition: 'attachment; filename="pitch-deck.pdf"' });
  });
  it("rejects hostile origins without accessing auth or storage", async () => {
    expect((await POST(request({ origin: "https://evil.invalid" }))).status).toBe(403);
    expect(mocks.session).not.toHaveBeenCalled(); expect(mocks.send).not.toHaveBeenCalled();
  });
  it.each([null, { user: { id: owner, emailVerified: false } }, { user: { id: owner, emailVerified: true, banned: true } }])("requires a verified active session", async session => {
    mocks.session.mockResolvedValue(session);
    expect((await POST(request())).status).toBe(401);
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it.each([{ content: "<html>not PDF</html>" }, { name: "deck.exe" }, { content: "%PDF-1.7\ntruncated" }])("rejects unsuitable content %j", async options => {
    expect((await POST(request(options))).status).toBe(400);
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it("rejects oversized requests before buffering multipart data", async () => {
    expect((await POST(request({ sizeHeader: String(6 * 1024 * 1024) }))).status).toBe(413);
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it("returns a retryable error when storage is unavailable", async () => {
    mocks.send.mockRejectedValue(new Error("Secret storage detail"));
    const response = await POST(request());
    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain("Secret");
  });
});
describe("pitch deck content safety", () => {
  it("rejects a PDF with a JavaScript action without storing it", async () => {
    const { PDFName, PDFString } = await import("pdf-lib");
    const doc = await PDFDocument.create(); doc.addPage();
    doc.catalog.set(PDFName.of("OpenAction"), doc.context.obj({ S: "JavaScript", JS: PDFString.of("app.alert(1)") }));
    const form = new FormData(); form.append("file", new File([Buffer.from(await doc.save())], "deck.pdf", { type: "application/pdf" }));
    const response = await POST(new NextRequest("http://localhost:3000/api/uploads/pitch-deck", { method: "POST", headers: { origin: "https://www.anshkosh.com" }, body: form }));
    expect(response.status).toBe(400);
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it("stores the rewritten PDF rather than the uploaded bytes", async () => {
    const form = new FormData(); form.append("file", new File([Buffer.concat([Buffer.from(valid), Buffer.from("\nHIDDEN-PAYLOAD")])], "deck.pdf", { type: "application/pdf" }));
    const response = await POST(new NextRequest("http://localhost:3000/api/uploads/pitch-deck", { method: "POST", headers: { origin: "https://www.anshkosh.com" }, body: form }));
    expect(response.status).toBe(200);
    expect(Buffer.from(mocks.send.mock.calls[0][0].input.Body).toString("latin1")).not.toContain("HIDDEN-PAYLOAD");
  });
});
