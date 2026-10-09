// Targeted editorial correction; default is read-only. Never run as a migration.
// Applying requires the installed backup operation's fresh verification record.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { convertJournalPost, editorialFields } from "./lib/journal-content.mjs";
import { planPilotContent } from "./lib/pilot-content.mjs";

const source = JSON.parse(fs.readFileSync(new URL("./data/legacy-journal.json", import.meta.url), "utf8"));
const manifest = JSON.parse(fs.readFileSync(new URL("./data/pilot-content-correction.json", import.meta.url), "utf8"));

export async function main(args = process.argv.slice(2)) {
  const slugs = Object.keys(manifest.journalBeforeHashes);
  const posts = slugs.map(slug => convertJournalPost(source, source.posts.find(post => post.slug === slug)));
  assert.equal(posts.length, 8);
  assert.equal(source.pilotNotice, "Payments and preorders are not open during the pilot.");
  for (const post of posts) {
    assert.doesNotMatch([post.title, post.excerpt, post.contentHtml, JSON.stringify(post.contentJson), post.metaTitle, post.metaDescription].join("\n"), /\brewards?\b/i);
    assert.ok(post.contentHtml.includes(source.pilotNotice), `Missing pilot notice: ${post.slug}`);
  }
  if (args.includes("--validate-only")) {
    console.log(JSON.stringify({ validatedArticles: posts.length, startupStage: manifest.startup.after }));
    return;
  }
  const require = createRequire(path.join(process.cwd(), "package.json"));
  const { PrismaClient } = require("@prisma/client");
  const db = new PrismaClient({ log: [] });
  const selection = Object.fromEntries(["id", "slug", "status", "updatedAt", ...editorialFields].map(field => [field, true]));
  const inspect = async client => {
    const articles = await client.journalPost.findMany({ where: { slug: { in: slugs } }, select: selection });
    const startup = await client.startup.findUnique({ where: { slug: "cane-theory" }, select: { id: true, slug: true, status: true, prototypeStatus: true, updatedAt: true } });
    return planPilotContent(source, manifest, articles, startup);
  };
  try {
    const plan = await inspect(db);
    console.log(JSON.stringify({ mode: args.includes("--apply") ? "apply" : "preview", articlesToUpdate: plan.journal.map(change => change.before.slug), startupStage: plan.startup?.after.prototypeStatus ?? "already corrected" }));
    if (!args.includes("--apply") || (!plan.journal.length && !plan.startup)) return;
    const option = name => {
      const index = args.indexOf(name);
      assert.ok(index >= 0 && args[index + 1] && !args[index + 1].startsWith("--"), `Missing ${name}`);
      return args[index + 1];
    };
    const backup = JSON.parse(fs.readFileSync(option("--backup-state"), "utf8"));
    assert.ok(backup.at <= Date.now() && Date.now() - backup.at < 15 * 60_000 && /^[a-f0-9]{64}$/.test(backup.sha256) && fs.statSync(backup.filename).isFile() && fs.statSync(backup.filename).size > 0, "A fresh verified backup is required");
    const auditDir = path.resolve(option("--audit-dir"));
    fs.mkdirSync(auditDir, { recursive: true, mode: 0o700 });
    const auditPath = path.join(auditDir, `pilot-content-${Date.now()}.json`);
    const audit = { startedAt: new Date().toISOString(), backup: { filename: backup.filename, sha256: backup.sha256 }, before: plan, completed: false };
    fs.writeFileSync(auditPath, JSON.stringify(audit, null, 2), { mode: 0o600, flag: "wx" });
    await db.$transaction(async tx => {
      const current = await inspect(tx);
      // Any concurrent editorial change makes the transaction stop rather than overwrite it.
      assert.deepEqual(current, plan, "Content changed after preview");
      for (const change of current.journal) {
        const result = await tx.journalPost.updateMany({ where: { id: change.before.id, updatedAt: change.before.updatedAt, status: "PUBLISHED" }, data: change.after });
        assert.equal(result.count, 1, `Article changed concurrently: ${change.before.slug}`);
      }
      if (current.startup) {
        const change = current.startup;
        const result = await tx.startup.updateMany({ where: { id: change.before.id, updatedAt: change.before.updatedAt, prototypeStatus: manifest.startup.before, status: "LIVE" }, data: change.after });
        assert.equal(result.count, 1, "Cane Theory changed concurrently");
      }
      const remaining = await inspect(tx);
      assert.equal(remaining.journal.length, 0);
      assert.equal(remaining.startup, null);
    }, { isolationLevel: "Serializable", timeout: 30_000 });
    Object.assign(audit, { completed: true, finishedAt: new Date().toISOString() });
    fs.writeFileSync(auditPath, JSON.stringify(audit, null, 2), { mode: 0o600 });
    console.log(JSON.stringify({ updatedArticles: plan.journal.length, correctedStartupStage: !!plan.startup, auditPath }));
  } finally {
    await db.$disconnect();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(error instanceof assert.AssertionError ? error.message : `Content update failed (${error.code || error.name}).`);
    process.exitCode = 1;
  });
}
