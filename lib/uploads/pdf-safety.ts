import { PDFArray, PDFDict, PDFDocument, PDFName, PDFRawStream, type PDFObject } from "pdf-lib";

// Keys whose presence means the PDF carries scripts, attachments or interactive forms.
const ACTIVE_KEYS = new Set(["JS", "JavaScript", "EmbeddedFiles", "EF", "XFA", "RichMedia"]);
// Action types (/S) that run code, open other files or send data elsewhere. GoTo and URI links stay allowed.
const ACTIVE_ACTIONS = new Set(["JavaScript", "Launch", "SubmitForm", "ImportData", "GoToE", "GoToR", "RichMediaExecute", "Rendition"]);

export class UnsafePdfError extends Error {}

const UNREADABLE = "This PDF could not be read. Export it again without a password and try once more.";
const ACTIVE = "This PDF contains scripts, attachments or interactive forms. Export a plain PDF and try again.";

function findActiveContent(value: PDFObject | undefined, seen: Set<PDFObject>): string | null {
  if (!value || seen.has(value)) return null;
  seen.add(value);
  if (value instanceof PDFRawStream) return findActiveContent(value.dict, seen);
  if (value instanceof PDFArray) {
    for (let i = 0; i < value.size(); i++) {
      const found = findActiveContent(value.get(i), seen);
      if (found) return found;
    }
    return null;
  }
  if (!(value instanceof PDFDict)) return null;
  for (const [key, entry] of value.entries()) {
    const name = key.decodeText();
    if (ACTIVE_KEYS.has(name)) return name;
    if (name === "S" && entry instanceof PDFName && ACTIVE_ACTIONS.has(entry.decodeText())) return entry.decodeText();
    if (name === "Type" && entry instanceof PDFName && entry.decodeText() === "EmbeddedFile") return "EmbeddedFile";
    const found = findActiveContent(entry, seen);
    if (found) return found;
  }
  return null;
}

/**
 * Rejects PDFs with scripts, launch/submit actions, attachments or XFA forms, then rewrites
 * the accepted file from its parsed objects so data hidden after the last %%EOF or in
 * superseded revisions is not stored.
 */
export async function sanitizePdf(bytes: Uint8Array): Promise<Uint8Array> {
  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(bytes, { updateMetadata: false });
    if (doc.getPageCount() < 1) throw new Error("No pages");
  } catch {
    // Includes encrypted PDFs, which cannot be inspected.
    throw new UnsafePdfError(UNREADABLE);
  }
  const seen = new Set<PDFObject>();
  for (const [, object] of doc.context.enumerateIndirectObjects()) {
    if (findActiveContent(object, seen)) throw new UnsafePdfError(ACTIVE);
  }
  if (findActiveContent(doc.context.trailerInfo.Root, seen)) throw new UnsafePdfError(ACTIVE);
  try {
    return await doc.save({ updateFieldAppearances: false });
  } catch {
    throw new UnsafePdfError(UNREADABLE);
  }
}
