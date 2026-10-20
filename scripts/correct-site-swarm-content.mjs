// Read-only preview by default. Publishing corrections requires --apply, a fresh
// verified backup, the deploy lock, and the owner's approval of the preview.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const SLUG = "why-bluelearn-shut-down-with-runway-left";
const OLD_TITLE = "Why Bluelearn Failed | Startup Forensics: The Fall of Bluelearn";
const TITLE = "Why Bluelearn Failed: A US$3.5m Startup Post-Mortem";
const OLD_CTA = " Subscribe to the Startup Forensics newsletter, or leave a comment telling us which startup we should investigate next.";
const NEW_CTA = ' Get occasional founder stories and pilot updates through the <a href="#newsletter-signup">newsletter form</a> at the bottom of this page.';

export const categoryCorrections = [
  ["campaign-notes", "Campaign Notes", "Pilot Notes"],
  ["funding-fundamentals", "Funding Fundamentals", "Startup Finance Basics"],
  ["capital-explained", "Capital Explained", "Startup Costs Explained"],
  ["backer-field-guide", "Backer Field Guide", "Supporter Field Guide"],
];

export function correctedBluelearn(post) {
  assert.ok(post?.slug === SLUG && post.status === "PUBLISHED", "Expected the published Bluelearn article");
  assert.ok([OLD_TITLE, TITLE].includes(post.title) && post.metaTitle === TITLE, "Article title changed since review");
  const next = { title: TITLE, contentHtml: post.contentHtml, contentJson: structuredClone(post.contentJson) };
  if (post.contentHtml.includes(OLD_CTA)) {
    assert.equal(post.contentHtml.split(OLD_CTA).length, 2, "Unexpected repeated CTA");
    next.contentHtml = post.contentHtml.replace(OLD_CTA, NEW_CTA);
    const ops = next.contentJson?.ops;
    assert.ok(Array.isArray(ops), "Expected the existing Quill document");
    const matching = ops.map((op, index) => op.insert === OLD_CTA ? index : -1).filter(index => index >= 0);
    assert.equal(matching.length, 1, "Editor CTA changed since review");
    ops.splice(matching[0], 1,
      { insert: " Get occasional founder stories and pilot updates through the " },
      { insert: "newsletter form", attributes: { link: "#newsletter-signup" } },
      { insert: " at the bottom of this page." });
  } else assert.ok(post.contentHtml.includes(NEW_CTA), "Article CTA changed since review");
  return next;
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const renameCategories = args.includes("--rename-categories");
  const option = name => {
    const index = args.indexOf(name);
    assert.ok(index >= 0 && args[index + 1] && !args[index + 1].startsWith("--"), `Missing ${name}`);
    return args[index + 1];
  };
  const require = createRequire(path.join(process.cwd(), "package.json"));
  const { PrismaClient } = require("@prisma/client");
  const db = new PrismaClient({ log: [] });
  const inspect = async client => ({
    post: await client.journalPost.findUnique({ where: { slug: SLUG }, select: { id: true, slug: true, title: true, metaTitle: true, status: true, contentHtml: true, contentJson: true, updatedAt: true } }),
    categories: await client.journalCategory.findMany({ where: { slug: { in: categoryCorrections.map(([slug]) => slug) } }, select: { id: true, slug: true, name: true }, orderBy: { slug: "asc" } }),
  });
  try {
    const before = await inspect(db);
    const next = correctedBluelearn(before.post);
    const categoryChanges = categoryCorrections.map(([slug, from, to]) => {
      const category = before.categories.find(row => row.slug === slug);
      assert.ok(category && [from, to].includes(category.name), "Category changed since review");
      return { ...category, to };
    }).filter(row => row.name !== row.to);
    const postChanged = Object.entries(next).some(([key, value]) => JSON.stringify(before.post[key]) !== JSON.stringify(value));
    console.log(JSON.stringify({ mode: apply ? "apply" : "preview", article: SLUG, articleChange: postChanged, newTitle: TITLE, cta: "Link to the existing newsletter form; remove nonexistent article comments", categoryChanges: renameCategories ? categoryChanges : [], categoryRenamesRequireFlag: !renameCategories }));
    if (!apply || (!postChanged && (!renameCategories || !categoryChanges.length))) return;
    const backup = JSON.parse(fs.readFileSync(option("--backup-state"), "utf8"));
    assert.ok(backup.at <= Date.now() && Date.now() - backup.at < 15 * 60_000 && /^[a-f0-9]{64}$/.test(backup.sha256) && fs.statSync(backup.filename).isFile() && fs.statSync(backup.filename).size > 0, "Fresh verified backup required");
    const auditDir = path.resolve(option("--audit-dir")); fs.mkdirSync(auditDir, { recursive: true, mode: 0o700 });
    const auditPath = path.join(auditDir, `site-swarm-content-${Date.now()}.json`);
    const audit = { startedAt: new Date().toISOString(), before, next, categoryChanges: renameCategories ? categoryChanges : [], completed: false };
    fs.writeFileSync(auditPath, JSON.stringify(audit, null, 2), { mode: 0o600, flag: "wx" });
    await db.$transaction(async tx => {
      assert.deepEqual(await inspect(tx), before, "Content changed after preview");
      if (postChanged) {
        const result = await tx.journalPost.updateMany({ where: { id: before.post.id, status: "PUBLISHED", updatedAt: before.post.updatedAt }, data: next });
        assert.equal(result.count, 1, "Article changed concurrently");
      }
      if (renameCategories) for (const category of categoryChanges) {
        const result = await tx.journalCategory.updateMany({ where: { id: category.id, slug: category.slug, name: category.name }, data: { name: category.to } });
        assert.equal(result.count, 1, "Category changed concurrently");
      }
    }, { isolationLevel: "Serializable", timeout: 30_000 });
    Object.assign(audit, { after: await inspect(db), completed: true, finishedAt: new Date().toISOString() });
    fs.writeFileSync(auditPath, JSON.stringify(audit, null, 2), { mode: 0o600 });
    console.log(JSON.stringify({ corrected: true, auditPath }));
  } catch {
    console.error("Content correction did not complete. Review the source preconditions and private audit; no diagnostic data is printed.");
    process.exitCode = 1;
  } finally { await db.$disconnect(); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
