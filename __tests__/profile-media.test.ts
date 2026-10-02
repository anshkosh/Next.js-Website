import { describe, expect, it } from "vitest";
import { boundedPhotoSize, cropGeometry, initialAdjustment } from "../lib/image-editor";
import { mergeStartupMetadata } from "../lib/startup-metadata";
import { MAX_PITCH_DECK_BYTES, ownsPitchDeck, pitchDeckUrlSchema, validatePitchDeck } from "../lib/validators/pitch-deck.schema";

const owner = "cmu7wfiv7000bzglryqzerzjo";
const deck = `/api/uploads/serve/pitch-decks/${owner}/6b0ef103-2a8d-4232-8cff-68cf9a8a1ea9.pdf`;
describe("pitch decks", () => {
  it("accepts a bounded PDF with a PDF signature and EOF", () => {
    const bytes = new TextEncoder().encode("%PDF-1.7\nTest content\n%%EOF\n");
    expect(validatePitchDeck({ name: "Pitch.PDF", type: "application/pdf", size: bytes.length }, bytes)).toBeNull();
  });
  it.each([
    { name: "file.html", type: "text/html", size: 10 },
    { name: "file.pdf", type: "text/html", size: 10 },
    { name: "file.pdf", type: "application/pdf", size: 0 },
    { name: "file.pdf", type: "application/pdf", size: MAX_PITCH_DECK_BYTES + 1 },
  ])("rejects unsuitable upload %j", file => expect(validatePitchDeck(file)).not.toBeNull());
  it.each(["<html>Not a PDF</html>", "%PDF-1.7\nIncomplete", "junk%PDF-1.7\n%%EOF"])("rejects disguised or incomplete content", text => {
    expect(validatePitchDeck({ name: "file.pdf", type: "application/pdf", size: text.length }, new TextEncoder().encode(text))).not.toBeNull();
  });
  it("only accepts internal PDF upload URLs and enforces owner binding", () => {
    expect(pitchDeckUrlSchema.safeParse(deck).success).toBe(true);
    expect(ownsPitchDeck(deck, owner)).toBe(true);
    expect(ownsPitchDeck(deck, "another-user")).toBe(false);
    expect(pitchDeckUrlSchema.safeParse("https://evil.invalid/file.pdf").success).toBe(false);
    expect(pitchDeckUrlSchema.safeParse("javascript:alert(1)").success).toBe(false);
    expect(pitchDeckUrlSchema.safeParse("/api/uploads/serve/pitch-decks/../file.pdf").success).toBe(false);
    expect(pitchDeckUrlSchema.safeParse("").success).toBe(true);
  });
});
describe("profile metadata", () => {
  it("preserves migration markers, untouched fields and explicit removal", () => {
    expect(mergeStartupMetadata({ sourceProject: "source", sourceId: "uuid", city: "Hyderabad", pitchDeckUrl: deck }, { city: undefined, pitchDeckUrl: "", features: [] })).toEqual({ sourceProject: "source", sourceId: "uuid", city: "Hyderabad", pitchDeckUrl: "", features: [] });
  });
  it("handles profiles without metadata", () => expect(mergeStartupMetadata(null, { city: "Hyderabad" })).toEqual({ city: "Hyderabad" }));
});
describe("photo crop geometry", () => {
  it.each([1e-8, 1e8, 1, 16 / 9, 9 / 16])("bounds even unusually narrow and panoramic crops (%s)", ratio => {
    const size = boundedPhotoSize(ratio, 1280);
    expect(size.width).toBeGreaterThanOrEqual(1); expect(size.height).toBeGreaterThanOrEqual(1);
    expect(size.width).toBeLessThanOrEqual(1280); expect(size.height).toBeLessThanOrEqual(1280);
  });
  it.each([0, -1, NaN, Infinity])("rejects invalid photo ratios (%s)", ratio => expect(() => boundedPhotoSize(ratio, 1280)).toThrow());
  it("center-crops landscape photos to square", () => {
    expect(cropGeometry(1200, 800, 512, 512, initialAdjustment)).toMatchObject({ scale: 0.64, x: 0, y: 0, yLimit: 0 });
  });
  it.each([-45, -30, 0, 15, 45])("covers every crop corner after straightening %s degrees", rotation => {
    const g = cropGeometry(1200, 800, 600, 338, { zoom: 1.5, rotation, x: 1, y: -1 });
    const cos = Math.cos(g.angle), sin = Math.sin(g.angle);
    for (const x of [-300, 300]) for (const y of [-169, 169]) {
      const sourceX = ((x - g.x) * cos + (y - g.y) * sin) / g.scale;
      const sourceY = (-(x - g.x) * sin + (y - g.y) * cos) / g.scale;
      expect(Math.abs(sourceX)).toBeLessThanOrEqual(600.000001);
      expect(Math.abs(sourceY)).toBeLessThanOrEqual(400.000001);
    }
  });
  it("clamps excessive movement and zoom", () => {
    expect(cropGeometry(1200, 800, 512, 512, { zoom: 0, rotation: 0, x: 50, y: -50 })).toEqual(cropGeometry(1200, 800, 512, 512, { zoom: 1, rotation: 0, x: 1, y: -1 }));
  });
});
