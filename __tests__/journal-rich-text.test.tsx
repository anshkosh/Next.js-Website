import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { founderEntrySchema } from "../lib/founder-journal";
import { journalDeltaSchema, journalMediaKeys, journalPlainText, plainTextDelta } from "../lib/journal-rich-text";
import JournalRichContent from "../components/journal/JournalRichContent";

const image = "/api/uploads/serve/founder-journal/owner/12345678-1234-1234-1234-123456789abc.webp";
describe("founder rich text boundaries", () => {
  it.each([1, 2, 3, 4, 5, 6])("accepts pasted Quill heading level %s without adding another page title", header => {
    const content = { ops: [{ insert: "Pasted heading" }, { insert: "\n", attributes: { header } }] };
    expect(founderEntrySchema.safeParse({ title: "A lesson", prompt: "LESSON", visibility: "PUBLIC", startupId: "owned", contentJson: content }).success).toBe(true);
    const html = renderToStaticMarkup(<JournalRichContent content={content} fallback="" />);
    expect(html).toContain(`<h${Math.max(2, header)}`);
    expect(html).not.toContain("<h1");
  });
  it("preserves supported formatting, list structure, headings and links without supplied HTML", () => {
    const delta = { ops: [
      { insert: "A heading" }, { insert: "\n", attributes: { header: 2 } },
      { insert: "Bold", attributes: { bold: true } }, { insert: " and italic", attributes: { italic: true } }, { insert: "\n" },
      { insert: "First" }, { insert: "\n", attributes: { list: "ordered" } }, { insert: "Second" }, { insert: "\n", attributes: { list: "ordered" } },
      { insert: "Evidence", attributes: { link: "https://example.com" } }, { insert: "\n" },
    ] };
    const html = renderToStaticMarkup(<JournalRichContent content={delta} fallback="" />);
    expect(html).toContain("<h2"); expect(html).toContain("<strong>Bold</strong>"); expect(html).toContain("<em> and italic</em>");
    expect(html.match(/<ol /g)).toHaveLength(1); expect(html.match(/<li>/g)).toHaveLength(2); expect(html).toContain('href="https://example.com"');
    expect(journalPlainText(journalDeltaSchema.parse(delta))).toContain("A heading\nBold and italic");
  });
  it.each(["javascript:alert(1)", "data:text/html,bad", "vbscript:bad", "/relative"])('rejects unsafe link %s', link => {
    expect(journalDeltaSchema.safeParse({ ops: [{ insert: "Click", attributes: { link } }] }).success).toBe(false);
  });
  it("escapes text and discards unsupported attributes instead of accepting HTML or event handlers", () => {
    const content = { ops: [{ insert: "<script>attack()</script>", attributes: { bold: true, onerror: "bad", style: "position:fixed" } }] };
    const html = renderToStaticMarkup(<JournalRichContent content={content} fallback="" />);
    expect(html).not.toContain("<script>"); expect(html).not.toContain("onerror"); expect(html).toContain("&lt;script&gt;");
    expect(journalDeltaSchema.parse(content).ops[0].attributes).toEqual({ bold: true });
  });
  it("uses protected image paths and rejects remote or public admin image references", () => {
    const content = journalDeltaSchema.parse({ ops: [{ insert: { image } }, { insert: "\n" }] });
    expect(journalMediaKeys(content)).toEqual([image.replace("/api/uploads/serve/", "")]);
    expect(journalPlainText(content)).toBe("[Image]");
    for (const src of ["https://tracker.example/image.png", "/api/uploads/serve/journal/public.png", "data:image/png;base64,aaa"]) {
      expect(journalDeltaSchema.safeParse({ ops: [{ insert: { image: src } }] }).success).toBe(false);
    }
  });
  it("accepts only known video embed origins and renders YouTube with its privacy-enhanced host", () => {
    const html = renderToStaticMarkup(<JournalRichContent content={{ ops: [{ insert: { video: "https://www.youtube.com/embed/abc123" } }] }} fallback="" />);
    expect(html).toContain('src="https://www.youtube-nocookie.com/embed/abc123"'); expect(html).toContain('referrerPolicy="no-referrer"');
    for (const video of ["https://evil.example/embed/abc", "javascript:bad", "https://www.youtube.com.evil.example/embed/abc"]) expect(journalDeltaSchema.safeParse({ ops: [{ insert: { video } }] }).success).toBe(false);
  });
  it("keeps legacy plain-text entries readable and rejects blank or oversized rich entries", () => {
    const plain = plainTextDelta("An old entry\nWith a second line");
    expect(journalPlainText(plain)).toBe("An old entry\nWith a second line");
    expect(founderEntrySchema.safeParse({ title: "Empty", body: "forged text", contentJson: { ops: [{ insert: "\n" }] } }).success).toBe(false);
    expect(founderEntrySchema.safeParse({ title: "Too long", contentJson: { ops: [{ insert: "x".repeat(12001) }] } }).success).toBe(false);
  });
});
