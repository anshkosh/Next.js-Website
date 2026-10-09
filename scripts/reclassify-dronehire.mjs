// One reviewed category correction. Preview by default; apply only after backup.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const args = process.argv.slice(2);
const require = createRequire(path.join(process.cwd(), "package.json"));
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient({ log: [] });
const inspect = async client => {
  const startup = await client.startup.findUnique({ where: { slug: "dronehire" }, select: {
    id: true, slug: true, name: true, status: true, categoryId: true, updatedAt: true,
    category: { select: { slug: true, name: true } },
  } });
  const category = await client.category.findUnique({ where: { slug: "aerospace-drones" }, select: { id: true, slug: true, name: true } });
  assert.ok(startup?.status === "LIVE" && startup.name === "DroneHire", "Expected published DroneHire profile");
  assert.ok(category, "Aerospace & Drones category must already exist");
  assert.ok(startup.category.slug === "other" || startup.categoryId === category.id, "DroneHire category changed since review");
  return { startup, category };
};

try {
  const before = await inspect(db);
  const change = before.startup.categoryId !== before.category.id;
  console.log(JSON.stringify({ mode: args.includes("--apply") ? "apply" : "preview", needsChange: change, startup: before.startup.slug, from: before.startup.category.name, to: before.category.name }));
  if (args.includes("--apply") && change) {
    const option = name => {
      const index = args.indexOf(name);
      assert.ok(index >= 0 && args[index + 1] && !args[index + 1].startsWith("--"), `Missing ${name}`);
      return args[index + 1];
    };
    const backup = JSON.parse(fs.readFileSync(option("--backup-state"), "utf8"));
    assert.ok(backup.at <= Date.now() && Date.now() - backup.at < 15 * 60_000 && /^[a-f0-9]{64}$/.test(backup.sha256) && fs.statSync(backup.filename).isFile() && fs.statSync(backup.filename).size > 0, "Fresh verified backup required");
    const auditDir = path.resolve(option("--audit-dir"));
    fs.mkdirSync(auditDir, { recursive: true, mode: 0o700 });
    const auditPath = path.join(auditDir, `dronehire-category-${Date.now()}.json`);
    const audit = { startedAt: new Date().toISOString(), backup: { filename: backup.filename, sha256: backup.sha256 }, before, completed: false };
    fs.writeFileSync(auditPath, JSON.stringify(audit, null, 2), { mode: 0o600, flag: "wx" });
    await db.$transaction(async tx => {
      assert.deepEqual(await inspect(tx), before, "Profile changed after preview");
      const updated = await tx.startup.updateMany({ where: {
        id: before.startup.id, slug: "dronehire", status: "LIVE", categoryId: before.startup.categoryId, updatedAt: before.startup.updatedAt,
      }, data: { categoryId: before.category.id } });
      assert.equal(updated.count, 1, "Profile changed concurrently");
      assert.equal((await inspect(tx)).startup.categoryId, before.category.id);
    }, { isolationLevel: "Serializable", timeout: 30_000 });
    Object.assign(audit, { after: await inspect(db), completed: true, finishedAt: new Date().toISOString() });
    fs.writeFileSync(auditPath, JSON.stringify(audit, null, 2), { mode: 0o600 });
    console.log(JSON.stringify({ correctedCategory: true, auditPath }));
  }
} catch (error) {
  console.error(error instanceof assert.AssertionError ? error.message : "Category correction failed; inspect server diagnostics.");
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
