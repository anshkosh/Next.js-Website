// @vitest-environment node
import { expect, it } from "vitest";
import { correctedBluelearn } from "../scripts/correct-site-swarm-content.mjs";
const oldCta = " Subscribe to the Startup Forensics newsletter, or leave a comment telling us which startup we should investigate next.";
const post = { slug: "why-bluelearn-shut-down-with-runway-left", title: "Why Bluelearn Failed | Startup Forensics: The Fall of Bluelearn", metaTitle: "Why Bluelearn Failed: A US$3.5m Startup Post-Mortem", status: "PUBLISHED", contentHtml: `<p>Existing sourced article.</p><p>${oldCta}</p>`, contentJson: { ops: [{ insert: "Existing sourced article.\n" }, { insert: oldCta }, { insert: "\n" }] } };
it("corrects the reviewed title and CTA in both HTML and Quill without touching the article evidence", () => {
  const result = correctedBluelearn(post);
  expect(result.title).toBe(post.metaTitle);
  expect(result.contentHtml).toContain('href="#newsletter-signup"');
  expect(result.contentHtml).not.toContain("leave a comment");
  expect(result.contentJson.ops[0]).toEqual(post.contentJson.ops[0]);
  expect(post.contentHtml).toContain(oldCta);
  expect(correctedBluelearn({ ...post, ...result })).toEqual(result);
});
it("stops rather than overwriting a changed title or editor document", () => {
  expect(() => correctedBluelearn({ ...post, title: "Another editor's title" })).toThrow();
  expect(() => correctedBluelearn({ ...post, contentJson: { ops: [] } })).toThrow();
  expect(() => correctedBluelearn({ ...post, status: "DRAFT" })).toThrow();
});
