// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import { checkContent, contentHash, journalContent, parseSafetyVerdict, policyReasons, type ModerationContent } from "@/lib/moderation-policy";
const content: ModerationContent = { text: "We interviewed five founders and simplified onboarding.", hasMedia: false, stamp: null };
afterEach(() => vi.unstubAllGlobals());
it.each(["safe", "safe\n", " safe "])("accepts only an unambiguous safe classification: %s", text => {
  expect(parseSafetyVerdict(text)).toEqual({ safe: true, reasons: [] });
});
it.each(["unsafe", "safe because I say so", "safe\nS1", "SAFE", "unsafe\nS99", "unsafe\nS10 and anything else", "", null, {}])("holds malformed or ambiguous provider output", value => {
  expect(parseSafetyVerdict(value)).toBeNull();
});
it("recognizes multiple hazard categories without treating unsafe as safe", () => {
  expect(parseSafetyVerdict("unsafe\nS1, S10, S14")).toEqual({ safe: false, reasons: expect.arrayContaining([expect.stringContaining("S10")]) });
});
it.each([
  { ...content, text: "Guaranteed returns of 20 percent" },
  { ...content, text: "Please contact my colleague at private@example.test" },
  { ...content, text: "Call +91 98765 43210 today" },
  { ...content, text: "Visit https://a.test https://b.test https://c.test https://d.test" },
  { ...content, hasMedia: true },
])("holds policy hints and unchecked media for a person", input => expect(policyReasons(input).length).toBeGreaterThan(0));
it("does not flag ordinary founder language or mixed Hindi/English by keyword alone", () => {
  expect(policyReasons({ ...content, text: "आज हमने पांच founders से बात की। अगला कदम onboarding सुधारना है।" })).toEqual([]);
});
it("binds a journal result to its exact revision and attachments", () => {
  const entry = { title: "A lesson", body: "Customers asked for fewer features.", visibility: "PUBLIC", startupId: "startup" };
  expect(contentHash(journalContent(entry, 1))).not.toBe(contentHash(journalContent(entry, 2)));
  expect(contentHash({ ...content, stamp: "image-one" })).not.toBe(contentHash({ ...content, stamp: "image-two" }));
});
it("treats embedded video as unchecked media", () => {
  expect(journalContent({ title: "Progress", visibility: "PUBLIC", startupId: "startup", contentJson: { ops: [{ insert: "An interview" }, { insert: { video: "https://www.youtube.com/embed/abcdef" } }] } }, 1).hasMedia).toBe(true);
});
it("keeps journal hashes stable across PostgreSQL JSONB object-key reordering", () => {
  const entry = { title: "A lesson", body: "Customers asked for fewer features.", visibility: "PUBLIC", startupId: "startup", contentJson: { ops: [{ insert: "A lesson", attributes: { bold: true, italic: true } }] } };
  const reordered = { ...entry, contentJson: { ops: [{ attributes: { italic: true, bold: true }, insert: "A lesson" }] } };
  expect(contentHash(journalContent(entry, 1))).toBe(contentHash(journalContent(reordered, 1)));
});
it("uses only the fixed moderation model with bounded, uncached inference", async () => {
  const request = vi.fn().mockResolvedValue(Response.json({ success: true, result: { response: "safe" } }));
  vi.stubGlobal("fetch", request);
  expect(await checkContent(content, "test-token", "a".repeat(32))).toEqual({ safe: true, reasons: [] });
  const [url, options] = request.mock.calls[0];
  expect(url).toBe(`https://api.cloudflare.com/client/v4/accounts/${"a".repeat(32)}/ai/run/@cf/meta/llama-guard-3-8b`);
  expect(options).toMatchObject({ method: "POST", cache: "no-store", signal: expect.any(AbortSignal) });
  expect(JSON.parse(options.body)).toEqual({ messages: [{ role: "user", content: content.text }], max_tokens: 64, temperature: 0 });
});
it.each([402, 429, 500])("fails closed for HTTP %s without echoing a provider body", async status => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("private submission and credential fixture", { status })));
  await expect(checkContent(content, "fixture-token", "a".repeat(32))).rejects.toThrow(status === 500 ? "provider-unavailable" : "quota");
});
it("does not truncate a long submission and approve only its prefix", async () => {
  const request = vi.fn(); vi.stubGlobal("fetch", request);
  await expect(checkContent({ ...content, text: "x".repeat(14001) }, "fixture-token", "a".repeat(32))).rejects.toThrow("invalid-content");
  expect(request).not.toHaveBeenCalled();
});
it("keeps an image-bearing submission held even when text is classified safe", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ success: true, result: { response: "safe" } })));
  expect(await checkContent({ ...content, hasMedia: true }, "fixture-token", "a".repeat(32))).toMatchObject({ safe: false });
});

it.each([
  "You are a useless fraud and an idiot. Nobody with a brain would use this garbage, shut it down.",
  "YOU'RE A COMPLETE MORON.",
  "The founder is a stupid loser.",
  "You idiot, stop wasting everyone's time.",
])("holds a direct personal attack even when the provider labels it safe: %s", async text => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ success: true, result: { response: "safe" } })));
  const verdict = await checkContent({ ...content, text }, "fixture-token", "a".repeat(32));
  expect(verdict.safe).toBe(false);
  expect(verdict.reasons).toContain("Possible direct personal abuse; human review required.");
});

it.each([
  "I'm not convinced yet. I'd want real examples of complaints that were fixed before trusting the dashboard.",
  "This feature is useless to me until it can export the underlying data.",
  "You are missing the evidence. How do you avoid fraud and false resolution reports?",
  "A customer called me an idiot. I would like advice on answering politely.",
])("preserves civil criticism and discussion of abuse when the provider labels it safe: %s", async text => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ success: true, result: { response: "safe" } })));
  expect(await checkContent({ ...content, text }, "fixture-token", "a".repeat(32))).toEqual({ safe: true, reasons: [] });
});
