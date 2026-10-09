import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { convertJournalPost, editorialContent, editorialHash } from "../scripts/lib/journal-content.mjs";
import { planPilotContent } from "../scripts/lib/pilot-content.mjs";

const source = JSON.parse(readFileSync("scripts/data/legacy-journal.json", "utf8"));
const manifest = JSON.parse(readFileSync("scripts/data/pilot-content-correction.json", "utf8"));
const corrected = Object.keys(manifest.journalBeforeHashes).map((slug, index) => ({
  ...convertJournalPost(source, source.posts.find((post: { slug: string }) => post.slug === slug)),
  id: `article-${index}`, updatedAt: new Date("2026-10-09T00:00:00Z"), coverImageUrl: "retained-image",
}));
const startup = { id: "cane-id", slug: "cane-theory", status: "LIVE", prototypeStatus: manifest.startup.after, updatedAt: new Date("2026-10-09T00:00:00Z") };

describe("targeted pilot content correction", () => {
  it("is idempotent when the correction is already applied", () => {
    expect(planPilotContent(source, manifest, corrected, startup)).toEqual({ journal: [], startup: null });
  });

  it("stops rather than replacing a newer editorial change or an unpublished article", () => {
    const changed = corrected.map((post, index) => index ? post : { ...post, contentHtml: "A newer editorial draft" });
    expect(() => planPilotContent(source, manifest, changed, startup)).toThrow(/changed since review/);
    expect(() => planPilotContent(source, manifest, corrected.slice(1), startup)).toThrow(/Missing published article/);
    expect(() => planPilotContent(source, manifest, corrected.map(post => ({ ...post, status: "DRAFT" })), startup)).toThrow(/Missing published article/);
  });

  it("changes only editorial fields for a matching baseline and preserves the publication identity", () => {
    const before = { ...corrected[0], title: "Earlier reviewed wording" };
    const matchingManifest = { ...manifest, journalBeforeHashes: { ...manifest.journalBeforeHashes, [before.slug]: editorialHash(before) } };
    const plan = planPilotContent(source, matchingManifest, [before, ...corrected.slice(1)], startup);
    expect(plan.journal).toHaveLength(1);
    expect(plan.journal[0].after).toEqual(editorialContent(corrected[0]));
    expect(plan.journal[0].after).not.toHaveProperty("slug");
    expect(plan.journal[0].after).not.toHaveProperty("publishedAt");
    expect(plan.journal[0].after).not.toHaveProperty("coverImageUrl");
  });

  it("corrects only the reviewed Cane Theory stage and refuses a newer stage", () => {
    const plan = planPilotContent(source, manifest, corrected, { ...startup, prototypeStatus: manifest.startup.before });
    expect(plan.startup?.after).toEqual({ prototypeStatus: "Preparing a pilot" });
    expect(() => planPilotContent(source, manifest, corrected, { ...startup, prototypeStatus: "Pilot running" })).toThrow(/stage changed since review/);
    expect(() => planPilotContent(source, manifest, corrected, { ...startup, slug: "other-startup" })).toThrow(/Missing published Cane Theory/);
  });

  it("recognizes equivalent JSON editor content with reordered database keys", () => {
    expect(editorialHash({ ...corrected[0], contentJson: { ops: [{ insert: "Source", attributes: { link: "https://example.com" } }] } }))
      .toBe(editorialHash({ ...corrected[0], contentJson: { ops: [{ attributes: { link: "https://example.com" }, insert: "Source" }] } }));
  });

  it("keeps editor and public HTML wording in sync and preserves the existing article URLs", () => {
    for (const post of corrected) {
      expect(post.contentHtml).toContain("Payments and preorders are not open during the pilot.");
      expect(post.contentHtml).not.toMatch(/\brewards?\b/i);
      expect(JSON.stringify(post.contentJson)).not.toMatch(/\brewards?\b/i);
    }
    expect(corrected.some(post => post.slug === "angel-investing-and-reward-crowdfunding" && post.title === "Angel investing and preorders are not the same thing")).toBe(true);
  });
});
