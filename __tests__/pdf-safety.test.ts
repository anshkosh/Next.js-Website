// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import { PDFDocument, PDFName, PDFString } from "pdf-lib";
import { sanitizePdf, UnsafePdfError } from "../lib/uploads/pdf-safety";

async function makePdf(customise?: (doc: PDFDocument) => void | Promise<void>, useObjectStreams = true) {
  const doc = await PDFDocument.create();
  doc.addPage([200, 200]).drawText("Pitch deck", { x: 20, y: 100 });
  await customise?.(doc);
  return doc.save({ useObjectStreams });
}
const text = (bytes: Uint8Array) => Buffer.from(bytes).toString("latin1");

let plain: Uint8Array;
beforeAll(async () => { plain = await makePdf(); });

describe("sanitizePdf", () => {
  it("accepts a plain PDF and returns a readable PDF", async () => {
    const clean = await sanitizePdf(plain);
    expect((await PDFDocument.load(clean)).getPageCount()).toBe(1);
  });

  it("keeps ordinary navigation and web links", async () => {
    const pdf = await makePdf(doc => {
      const page = doc.getPage(0);
      doc.catalog.set(PDFName.of("OpenAction"), doc.context.obj([page.ref, PDFName.of("Fit")]));
      const link = doc.context.register(doc.context.obj({
        Type: "Annot", Subtype: "Link", Rect: [0, 0, 50, 50],
        A: { S: "URI", URI: PDFString.of("https://www.anshkosh.com") },
      }));
      page.node.set(PDFName.of("Annots"), doc.context.obj([link]));
    });
    await expect(sanitizePdf(pdf)).resolves.toBeInstanceOf(Uint8Array);
  });

  it.each([true, false])("rejects JavaScript actions (object streams: %s)", async useObjectStreams => {
    const pdf = await makePdf(doc => {
      doc.catalog.set(PDFName.of("OpenAction"), doc.context.obj({ S: "JavaScript", JS: PDFString.of("app.alert(1)") }));
    }, useObjectStreams);
    await expect(sanitizePdf(pdf)).rejects.toBeInstanceOf(UnsafePdfError);
  });

  it.each(["Launch", "SubmitForm", "GoToR"])("rejects %s actions on annotations", async action => {
    const pdf = await makePdf(doc => {
      const link = doc.context.register(doc.context.obj({ Type: "Annot", Subtype: "Link", Rect: [0, 0, 50, 50], A: { S: action, F: PDFString.of("x") } }));
      doc.getPage(0).node.set(PDFName.of("Annots"), doc.context.obj([link]));
    });
    await expect(sanitizePdf(pdf)).rejects.toBeInstanceOf(UnsafePdfError);
  });

  it("rejects embedded file attachments", async () => {
    const pdf = await makePdf(doc => doc.attach(Buffer.from("payload"), "payload.exe", { mimeType: "application/octet-stream" }));
    await expect(sanitizePdf(pdf)).rejects.toBeInstanceOf(UnsafePdfError);
  });

  it("drops data appended after the end of the PDF", async () => {
    const polyglot = Buffer.concat([Buffer.from(plain), Buffer.from("\n<script>alert(1)</script>HIDDEN-PAYLOAD")]);
    const clean = await sanitizePdf(polyglot);
    expect(text(clean)).not.toContain("HIDDEN-PAYLOAD");
  });

  it("rejects files it cannot parse", async () => {
    await expect(sanitizePdf(Buffer.from("%PDF-1.7\nnot really a pdf\n%%EOF"))).rejects.toBeInstanceOf(UnsafePdfError);
  });
});
