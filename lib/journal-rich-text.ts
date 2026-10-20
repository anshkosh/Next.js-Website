import { z } from "zod";

export function safeJournalLink(value: string) {
  try { return ["https:", "http:", "mailto:"].includes(new URL(value).protocol); } catch { return false; }
}
export function safeJournalVideo(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (
      (["www.youtube.com", "www.youtube-nocookie.com"].includes(url.hostname) && /^\/embed\/[\w-]+$/.test(url.pathname)) ||
      (url.hostname === "player.vimeo.com" && /^\/video\/\d+$/.test(url.pathname))
    );
  } catch { return false; }
}
export const journalImagePattern = /^\/api\/uploads\/serve\/founder-journal\/([a-zA-Z0-9_-]+)\/[0-9a-f-]{36}\.webp$/;
const attributes = z.object({
  bold: z.boolean().optional(), italic: z.boolean().optional(), underline: z.boolean().optional(), strike: z.boolean().optional(),
  // Quill paste can produce any standard heading, even those absent from the toolbar.
  header: z.number().int().min(1).max(6).optional(),
  blockquote: z.boolean().optional(), "code-block": z.union([z.boolean(), z.string().max(40)]).optional(),
  list: z.enum(["ordered", "bullet"]).optional(),
  link: z.string().max(2048).refine(safeJournalLink, "Use an http, https, or email link.").optional(),
});
export const journalDeltaSchema = z.object({ ops: z.array(z.object({
  insert: z.union([
    z.string().max(12001),
    z.object({ image: z.string().regex(journalImagePattern, "Upload images using the journal image button.") }),
    z.object({ video: z.string().max(2048).refine(safeJournalVideo, "Use a YouTube or Vimeo embed link.") }),
  ]), attributes: attributes.optional(),
})).max(2000) }).refine(delta => JSON.stringify(delta).length <= 100000, "This entry has too much formatting. Simplify it before saving.");
export type JournalDelta = z.infer<typeof journalDeltaSchema>;
export function journalPlainText(delta: JournalDelta) {
  return delta.ops.map(op => typeof op.insert === "string" ? op.insert : "image" in op.insert ? "[Image]" : "[Video]").join("").trim();
}
export function journalMediaKeys(delta: JournalDelta) {
  return [...new Set(delta.ops.flatMap(op => typeof op.insert !== "string" && "image" in op.insert ? [op.insert.image.replace("/api/uploads/serve/", "")] : []))];
}
export function plainTextDelta(body: string): JournalDelta {
  return { ops: [{ insert: `${body.replace(/\n$/, "")}\n` }] };
}
