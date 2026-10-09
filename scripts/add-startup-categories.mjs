// Add only the reviewed category catalogue; never run the full seed in production.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const categories = JSON.parse(fs.readFileSync(new URL("./data/additional-categories.json", import.meta.url), "utf8"));

export async function main(args = process.argv.slice(2)) {
  assert.equal(categories.length, 10);
  assert.equal(new Set(categories.map(category => category.slug)).size, categories.length);
  for (const category of categories) {
    assert.match(category.slug, /^[a-z]+(?:-[a-z]+)*$/);
    assert.ok(category.name && category.description && category.iconName);
  }
  if (args.includes("--validate-only")) {
    console.log(JSON.stringify({ validatedCategories: categories.length }));
    return;
  }
  const require = createRequire(path.join(process.cwd(), "package.json"));
  const { PrismaClient } = require("@prisma/client");
  const db = new PrismaClient({ log: [] });
  const inspect = client => client.category.findMany({ orderBy: [{ sortOrder: "asc" }, { id: "asc" }] });
  try {
    const before = await inspect(db);
    // Never rename or replace an existing category or reassign its startups.
    const missing = categories.filter(category => !before.some(existing => existing.slug === category.slug));
    console.log(JSON.stringify({ mode: args.includes("--apply") ? "apply" : "preview", categoriesToAdd: missing.map(category => category.name) }));
    if (!args.includes("--apply") || !missing.length) return;
    const option = name => {
      const index = args.indexOf(name);
      assert.ok(index >= 0 && args[index + 1] && !args[index + 1].startsWith("--"), `Missing ${name}`);
      return args[index + 1];
    };
    const backup = JSON.parse(fs.readFileSync(option("--backup-state"), "utf8"));
    assert.ok(backup.at <= Date.now() && Date.now() - backup.at < 15 * 60_000 && /^[a-f0-9]{64}$/.test(backup.sha256) && fs.statSync(backup.filename).isFile() && fs.statSync(backup.filename).size > 0, "Fresh verified backup required");
    const auditDir = path.resolve(option("--audit-dir"));
    fs.mkdirSync(auditDir, { recursive: true, mode: 0o700 });
    const auditPath = path.join(auditDir, `additional-categories-${Date.now()}.json`);
    const audit = { startedAt: new Date().toISOString(), backup: { filename: backup.filename, sha256: backup.sha256 }, before, additions: missing, completed: false };
    fs.writeFileSync(auditPath, JSON.stringify(audit, null, 2), { mode: 0o600, flag: "wx" });
    await db.$transaction(async tx => {
      assert.deepEqual(await inspect(tx), before, "Category catalogue changed after preview");
      const other = before.find(category => category.slug === "other");
      let order = Math.max(-1, ...before.filter(category => category.slug !== "other").map(category => category.sortOrder));
      for (const category of missing) await tx.category.create({ data: { ...category, sortOrder: ++order } });
      if (other && other.sortOrder <= order) await tx.category.update({ where: { id: other.id }, data: { sortOrder: order + 1 } });
    }, { isolationLevel: "Serializable", timeout: 30_000 });
    Object.assign(audit, { after: await inspect(db), completed: true, finishedAt: new Date().toISOString() });
    fs.writeFileSync(auditPath, JSON.stringify(audit, null, 2), { mode: 0o600 });
    console.log(JSON.stringify({ addedCategories: missing.length, auditPath }));
  } finally {
    await db.$disconnect();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(error instanceof assert.AssertionError ? error.message : "Category update failed; inspect server diagnostics.");
    process.exitCode = 1;
  });
}
