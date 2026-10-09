// Run from a configured application release. Defaults to a read-only preview.
// --validate-only needs no database. --apply requires a fresh verified backup.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { convertJournalPost } from "./lib/journal-content.mjs";

const source = JSON.parse(fs.readFileSync(new URL("./data/legacy-journal.json", import.meta.url), "utf8"));
const args = process.argv.slice(2);
const option = name => args[args.indexOf(name) + 1];
const categorySlug = name => name.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-");

assert.equal(source.posts.length, 12, "Expected all 12 recovered posts");
assert.equal(new Set(source.posts.map(p => p.slug)).size, 12, "Duplicate source slugs");
const posts = source.posts.map(post => convertJournalPost(source, post));
assert.ok(posts.every(p => Number.isInteger(p.readingTimeMinutes) && p.readingTimeMinutes > 0));
if (args.includes("--validate-only")) {
  console.log(JSON.stringify({ validated: posts.length, sourceCommit: source.sourceCommit }));
} else {
  const require = createRequire(path.join(process.cwd(), "package.json"));
  const { PrismaClient } = require("@prisma/client");
  const db = new PrismaClient({ log: [] });
  const names = [...new Set(source.posts.map(p => p.category))];
  const slugs = posts.map(p => p.slug);
  async function inspect(client) {
    const existing = await client.journalPost.findMany({ where: { OR: [{ slug: { in: slugs } }, { title: { in: posts.map(p => p.title) } }] } });
    for (const row of existing) {
      const wanted = posts.find(p => p.slug === row.slug);
      assert.ok(wanted && row.title === wanted.title && row.contentHtml === wanted.contentHtml && row.status === "PUBLISHED", `Existing post conflicts with recovered article: ${row.slug}`);
    }
    const categories = await client.journalCategory.findMany({ where: { OR: [{ name: { in: names } }, { slug: { in: names.map(categorySlug) } }] } });
    for (const row of categories) assert.ok(names.includes(row.name) && row.slug === categorySlug(row.name), `Category conflict: ${row.slug}`);
    return { existing, categories };
  }
  try {
    const preview = await inspect(db);
    console.log(JSON.stringify({ mode: args.includes("--apply") ? "apply" : "preview", articlesToCreate: 12 - preview.existing.length, alreadyPublished: preview.existing.length, categoriesToCreate: names.filter(name => !preview.categories.some(c => c.name === name)), articles: posts.map(p => ({ slug: p.slug, title: p.title, publishedAt: p.publishedAt })) }));
    if (args.includes("--apply")) {
      assert.ok(args.includes("--backup-state") && args.includes("--audit-dir"), "Apply requires --backup-state and --audit-dir");
      const backup = JSON.parse(fs.readFileSync(option("--backup-state"), "utf8"));
      assert.ok(backup.at <= Date.now() && Date.now() - backup.at < 15 * 60_000 && /^[a-f0-9]{64}$/.test(backup.sha256) && fs.statSync(backup.filename).size > 0, "A fresh verified database backup is required");
      const auditDir = path.resolve(option("--audit-dir"));
      fs.mkdirSync(auditDir, { recursive: true, mode: 0o700 });
      const auditPath = path.join(auditDir, `journal-import-${Date.now()}.json`);
      // Retain the pre-import records, backup reference and newly created IDs.
      const audit = { sourceCommit: source.sourceCommit, startedAt: new Date().toISOString(), backupFilename: backup.filename, before: preview, createdPosts: [], createdCategories: [] };
      fs.writeFileSync(auditPath, JSON.stringify(audit, null, 2), { mode: 0o600, flag: "wx" });
      const result = await db.$transaction(async tx => {
        const current = await inspect(tx);
        const categories = new Map(current.categories.map(c => [c.name, c.id]));
        const createdCategories = [];
        for (const name of names) {
          if (categories.has(name)) continue;
          const category = await tx.journalCategory.create({ data: { name, slug: categorySlug(name) } });
          categories.set(name, category.id);
          createdCategories.push({ id: category.id, slug: category.slug });
        }
        const existingSlugs = new Set(current.existing.map(p => p.slug));
        const createdPosts = [];
        for (const [index, post] of posts.entries()) {
          if (existingSlugs.has(post.slug)) continue;
          const row = await tx.journalPost.create({ data: { ...post, categoryId: categories.get(source.posts[index].category) } });
          createdPosts.push({ id: row.id, slug: row.slug });
        }
        assert.equal(await tx.journalPost.count({ where: { slug: { in: slugs }, status: "PUBLISHED" } }), 12);
        return { createdPosts, createdCategories };
      }, { isolationLevel: "Serializable", timeout: 30_000 });
      Object.assign(audit, result, { finishedAt: new Date().toISOString() });
      fs.writeFileSync(auditPath, JSON.stringify(audit, null, 2), { mode: 0o600 });
      console.log(JSON.stringify({ published: 12, created: result.createdPosts.length, auditPath }));
    }
  } catch (error) {
    // Database errors can contain private connection details; print only their codes.
    console.error(error instanceof assert.AssertionError ? error.message : `Import failed (${error.code || error.name}).`);
    process.exitCode = 1;
  } finally {
    await db.$disconnect();
  }
}
