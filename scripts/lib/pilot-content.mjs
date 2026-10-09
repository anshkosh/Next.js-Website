import assert from "node:assert/strict";
import { convertJournalPost, editorialContent, editorialHash } from "./journal-content.mjs";

export function planPilotContent(source, manifest, articles, startup) {
  assert.equal(manifest.version, 1);
  assert.equal(Object.keys(manifest.journalBeforeHashes).length, 8);
  const journal = [];
  for (const [slug, beforeHash] of Object.entries(manifest.journalBeforeHashes)) {
    const original = source.posts.find(post => post.slug === slug);
    const row = articles.find(post => post.slug === slug);
    assert.ok(original && row && row.status === "PUBLISHED", `Missing published article: ${slug}`);
    const after = editorialContent(convertJournalPost(source, original));
    const afterHash = editorialHash(after);
    const currentHash = editorialHash(row);
    if (currentHash === afterHash) continue;
    assert.equal(currentHash, beforeHash, `Article changed since review: ${slug}`);
    journal.push({ before: row, after });
  }
  assert.ok(startup?.slug === "cane-theory" && startup.status === "LIVE", "Missing published Cane Theory profile");
  const correction = manifest.startup;
  assert.equal(correction.slug, "cane-theory");
  let startupChange = null;
  if (startup.prototypeStatus !== correction.after) {
    assert.equal(startup.prototypeStatus, correction.before, "Cane Theory stage changed since review");
    startupChange = { before: startup, after: { prototypeStatus: correction.after } };
  }
  return { journal, startup: startupChange };
}
